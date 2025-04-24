-- Fix the add_credits function to use correct column names
CREATE OR REPLACE FUNCTION public.add_credits(
    user_uuid UUID,
    amount INTEGER,
    description TEXT,
    transaction_type TEXT
) RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    current_credits INT;
BEGIN
    -- Debug logging
    RAISE NOTICE 'Adding % credits for user %', amount, user_uuid;
    
    -- Check if user already has credits
    SELECT credits_remaining INTO current_credits FROM user_credits WHERE user_id = user_uuid;
    
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
            user_uuid, 
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
        WHERE user_id = user_uuid;
        
        RAISE NOTICE 'Updated user to % credits', current_credits + amount;
    END IF;
    
    -- Record the transaction exactly as provided
    INSERT INTO credit_transactions (
        user_id,
        amount,
        description,
        transaction_type,
        created_at
    ) VALUES (
        user_uuid,
        amount,
        description,
        transaction_type,
        NOW()
    );
    
    RAISE NOTICE 'Transaction recorded with amount %', amount;
END;
$$; 