-- Drop existing functions for clean update
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