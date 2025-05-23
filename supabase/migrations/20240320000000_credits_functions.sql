-- Function to add credits to a user
CREATE OR REPLACE FUNCTION add_credits(
  user_uuid UUID,
  amount INTEGER,
  description TEXT,
  transaction_type TEXT
) RETURNS VOID AS $$
DECLARE
  v_user_id UUID;
  v_credits_remaining INTEGER;
BEGIN
  -- Make sure we have a valid UUID
  v_user_id := user_uuid::UUID;
  
  -- Start a transaction
  BEGIN
    -- Insert the transaction record
    INSERT INTO credit_transactions (
      user_id,
      amount,
      description,
      transaction_type
    ) VALUES (
      v_user_id,
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
      v_user_id,
      amount,
      0,
      NOW()
    )
    ON CONFLICT (user_id) DO UPDATE
    SET 
      credits_remaining = user_credits.credits_remaining + amount,
      updated_at = NOW();
      
    -- Log success
    RAISE NOTICE 'Added % credits for user %', amount, v_user_id;
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

-- Create a new migration that forcibly updates the use_credits function
DROP FUNCTION IF EXISTS use_credits;

-- Function to use credits without any credit check
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
    -- Get current credits (for logging only)
    SELECT credits_remaining INTO available_credits
    FROM user_credits
    WHERE user_id = user_uuid;
    
    -- Log the transaction
    RAISE NOTICE 'Using % credits for user %, current balance: %', amount, user_uuid, available_credits;

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

    RAISE NOTICE 'Credits updated for user %, new balance: %', user_uuid, (available_credits - amount);
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