-- 1. First, check if we have webhook events
SELECT id, type, created_at 
FROM public.stripe_webhook_events 
WHERE type = 'customer.created'
ORDER BY created_at DESC
LIMIT 5;

-- 2. Check the structure of a webhook (replace EVENT_ID with a real ID from the query above)
-- SELECT data FROM public.stripe_webhook_events WHERE id = 'EVENT_ID';

-- 3. Directly check existing users that need Stripe customers
SELECT user_id, stripe_customer_id, needs_stripe_customer
FROM public.stripe_customers
WHERE stripe_customer_id IS NULL OR needs_stripe_customer = TRUE
LIMIT 10;

-- 4. Option 1: Update all records using a direct join between webhook events and customers
-- This attempts to match users by extracting the userId from the webhook metadata
-- Note: This might not work if your webhook data structure is different
WITH customer_data AS (
  SELECT 
    we.id,
    we.type,
    we.data->'object'->'metadata'->>'userId' as user_id,
    we.data->'object'->>'id' as stripe_customer_id
  FROM 
    public.stripe_webhook_events we
  WHERE 
    we.type = 'customer.created'
    AND we.data->'object'->'metadata'->>'userId' IS NOT NULL
    AND we.data->'object'->>'id' IS NOT NULL
)
UPDATE public.stripe_customers sc
SET 
  stripe_customer_id = cd.stripe_customer_id,
  needs_stripe_customer = FALSE,
  updated_at = NOW()
FROM customer_data cd
WHERE sc.user_id::text = cd.user_id
AND (sc.stripe_customer_id IS NULL OR sc.needs_stripe_customer = TRUE);

-- 5. Option 2: Manual update for specific users
-- If you know the specific users and their Stripe customer IDs, you can update them directly
/*
UPDATE public.stripe_customers
SET 
  stripe_customer_id = 'STRIPE_CUSTOMER_ID', -- Replace with actual Stripe customer ID (cus_xxx)
  needs_stripe_customer = FALSE,
  updated_at = NOW()
WHERE user_id = 'USER_ID'; -- Replace with actual user ID (UUID)
*/

-- 6. Check for any changes
SELECT user_id, stripe_customer_id, needs_stripe_customer, updated_at
FROM public.stripe_customers
ORDER BY updated_at DESC
LIMIT 10; 