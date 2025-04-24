-- Fix the add_credits function to properly insert or update user_credits
DROP FUNCTION IF EXISTS public.add_credits;

CREATE OR REPLACE FUNCTION public.add_credits(
  user_uuid UUID,
  amount INTEGER,
  description TEXT,
  transaction_type TEXT
) RETURNS BOOLEAN AS $$
DECLARE
  v_user_id UUID;
  current_credits INTEGER;
BEGIN
  -- Validate UUID
  v_user_id := user_uuid::UUID;

  -- Start transaction
  BEGIN
    -- Record the transaction
    INSERT INTO credit_transactions (
      user_id,
      amount,
      description,
      transaction_type,
      created_at
    ) VALUES (
      v_user_id,
      amount,
      description,
      transaction_type,
      NOW()
    );

    -- Check if user already has credits
    SELECT credits_remaining INTO current_credits FROM user_credits WHERE user_id = v_user_id;

    IF current_credits IS NULL THEN
      -- Insert new user_credits row
      INSERT INTO user_credits (
        user_id, 
        credits_remaining,
        credits_used,
        last_reset_date,
        created_at,
        updated_at
      )
      VALUES (
        v_user_id, 
        amount,
        0,
        NOW(),
        NOW(),
        NOW()
      );
    ELSE
      -- Update existing user_credits row
      UPDATE user_credits
      SET 
        credits_remaining = credits_remaining + amount,
        updated_at = NOW()
      WHERE user_id = v_user_id;
    END IF;

    RETURN TRUE;
  EXCEPTION WHEN OTHERS THEN
    RAISE EXCEPTION 'Error adding credits: %', SQLERRM;
    RETURN FALSE;
  END;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER; 