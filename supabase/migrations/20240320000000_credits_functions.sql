-- Function to add credits to a user
CREATE OR REPLACE FUNCTION add_credits(
  user_uuid UUID,
  amount INTEGER,
  description TEXT,
  transaction_type TEXT
) RETURNS VOID AS $$
BEGIN
  -- Start a transaction
  BEGIN
    -- Insert the transaction record
    INSERT INTO credit_transactions (
      user_id,
      amount,
      description,
      transaction_type
    ) VALUES (
      user_uuid,
      amount,
      description,
      transaction_type
    );

    -- Update or insert user credits
    INSERT INTO user_credits (
      user_id,
      credits_remaining,
      credits_used,
      last_reset_date
    ) VALUES (
      user_uuid,
      amount,
      0,
      NOW()
    )
    ON CONFLICT (user_id) DO UPDATE
    SET 
      credits_remaining = user_credits.credits_remaining + amount,
      updated_at = NOW();
  EXCEPTION WHEN OTHERS THEN
    RAISE EXCEPTION 'Error adding credits: %', SQLERRM;
  END;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to check if user has sufficient credits
CREATE OR REPLACE FUNCTION has_sufficient_credits(
  user_uuid UUID,
  required_credits INTEGER
) RETURNS BOOLEAN AS $$
DECLARE
  available_credits INTEGER;
BEGIN
  SELECT credits_remaining INTO available_credits
  FROM user_credits
  WHERE user_id = user_uuid;

  IF available_credits IS NULL THEN
    RETURN FALSE;
  END IF;

  RETURN available_credits >= required_credits;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to use credits
CREATE OR REPLACE FUNCTION use_credits(
  user_uuid UUID,
  amount INTEGER,
  description TEXT
) RETURNS BOOLEAN AS $$
DECLARE
  available_credits INTEGER;
BEGIN
  -- Start a transaction
  BEGIN
    -- Get current credits
    SELECT credits_remaining INTO available_credits
    FROM user_credits
    WHERE user_id = user_uuid;

    -- Check if user has enough credits
    IF available_credits IS NULL OR available_credits < amount THEN
      RETURN FALSE;
    END IF;

    -- Insert the transaction record
    INSERT INTO credit_transactions (
      user_id,
      amount,
      description,
      transaction_type
    ) VALUES (
      user_uuid,
      -amount,
      description,
      'VIDEO_GENERATION'
    );

    -- Update user credits
    UPDATE user_credits
    SET 
      credits_remaining = credits_remaining - amount,
      credits_used = credits_used + amount,
      updated_at = NOW()
    WHERE user_id = user_uuid;

    RETURN TRUE;
  EXCEPTION WHEN OTHERS THEN
    RAISE EXCEPTION 'Error using credits: %', SQLERRM;
  END;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to reset monthly free credits
CREATE OR REPLACE FUNCTION reset_monthly_free_credits() RETURNS VOID AS $$
BEGIN
  -- Start a transaction
  BEGIN
    -- Update credits for users who haven't received their monthly reset
    UPDATE user_credits
    SET 
      credits_remaining = credits_remaining + 100,
      last_reset_date = NOW(),
      updated_at = NOW()
    WHERE 
      last_reset_date < NOW() - INTERVAL '30 days';

    -- Insert transaction records for the monthly reset
    INSERT INTO credit_transactions (
      user_id,
      amount,
      description,
      transaction_type
    )
    SELECT 
      user_id,
      100,
      'Monthly free credits',
      'MONTHLY_RESET'
    FROM user_credits
    WHERE 
      last_reset_date < NOW() - INTERVAL '30 days';
  EXCEPTION WHEN OTHERS THEN
    RAISE EXCEPTION 'Error resetting monthly credits: %', SQLERRM;
  END;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER; 