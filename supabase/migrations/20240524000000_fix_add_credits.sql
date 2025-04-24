-- Fix the add_credits function
DROP FUNCTION IF EXISTS public.add_credits;

CREATE OR REPLACE FUNCTION public.add_credits(
  user_uuid UUID,
  amount INTEGER,
  description TEXT,
  transaction_type TEXT
) RETURNS BOOLEAN AS $$
DECLARE
  current_credits INTEGER;
  v_user_id UUID;
BEGIN
  -- Debug logging
  RAISE NOTICE 'Adding % credits for user %', amount, user_uuid;
  
  -- Ensure valid UUID
  BEGIN
    v_user_id := user_uuid::UUID;
  EXCEPTION WHEN OTHERS THEN
    RAISE EXCEPTION 'Invalid UUID provided: %', user_uuid;
    RETURN FALSE;
  END;
  
  -- Check if user already has credits
  SELECT credits_remaining INTO current_credits FROM user_credits WHERE user_id = v_user_id;
  
  -- Start transaction
  BEGIN
    -- Record the transaction first
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
    
    RAISE NOTICE 'Transaction recorded with amount %', amount;
    
    IF NOT FOUND THEN
      -- Insert new user with the exact amount specified
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
      
      RAISE NOTICE 'Created new user_credits with % credits', amount;
    ELSE
      -- Update existing user
      UPDATE user_credits
      SET 
        credits_remaining = credits_remaining + amount,
        updated_at = NOW()
      WHERE user_id = v_user_id;
      
      RAISE NOTICE 'Updated user to % credits', COALESCE(current_credits, 0) + amount;
    END IF;
    
    RETURN TRUE;
  EXCEPTION WHEN OTHERS THEN
    RAISE EXCEPTION 'Error adding credits: %', SQLERRM;
    RETURN FALSE;
  END;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER; 