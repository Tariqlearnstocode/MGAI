-- Create a function to handle Stripe webhook events
CREATE OR REPLACE FUNCTION public.handle_stripe_webhook_event()
RETURNS TRIGGER AS $$
DECLARE
  customer_data JSONB;
  user_id TEXT;
BEGIN
  -- Extract customer data from the webhook payload
  customer_data := NEW.data->'object';
  
  -- Get the user_id from metadata if available
  user_id := customer_data->'metadata'->>'userId';
  
  -- If this is a customer.created event and we have a user_id
  IF NEW.type = 'customer.created' AND user_id IS NOT NULL THEN
    -- Update the stripe_customers table with the Stripe customer ID
    UPDATE public.stripe_customers
    SET 
      stripe_customer_id = customer_data->>'id',
      needs_stripe_customer = FALSE,
      updated_at = NOW()
    WHERE user_id = user_id::uuid;
    
    -- Log the update
    INSERT INTO public.webhook_logs (
      event_type,
      stripe_event_id,
      customer_id,
      user_id,
      processed_at,
      success
    ) VALUES (
      NEW.type,
      NEW.id,
      customer_data->>'id',
      user_id,
      NOW(),
      TRUE
    );
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create a webhook_logs table to track webhook processing
CREATE TABLE IF NOT EXISTS public.webhook_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  event_type TEXT NOT NULL,
  stripe_event_id TEXT,
  customer_id TEXT,
  user_id TEXT,
  processed_at TIMESTAMPTZ DEFAULT NOW(),
  success BOOLEAN DEFAULT FALSE,
  error_message TEXT
);

-- Add a trigger for stripe webhook events
-- Note: You'll need to create a stripe_webhook_events table
-- to store incoming webhook events for this to work
-- 
-- Example of how to create the table:
CREATE TABLE IF NOT EXISTS public.stripe_webhook_events (
  id TEXT PRIMARY KEY,
  type TEXT NOT NULL,
  data JSONB NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create the trigger on the webhook events table
DROP TRIGGER IF EXISTS on_stripe_webhook_event ON public.stripe_webhook_events;
CREATE TRIGGER on_stripe_webhook_event
  AFTER INSERT ON public.stripe_webhook_events
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_stripe_webhook_event();

-- Add a helper function to manually process a webhook event
CREATE OR REPLACE FUNCTION public.process_stripe_customer_creation(
  customer_id TEXT,
  user_id UUID
) RETURNS BOOLEAN AS $$
DECLARE
  success BOOLEAN := FALSE;
BEGIN
  -- Update the stripe_customers table
  UPDATE public.stripe_customers
  SET 
    stripe_customer_id = customer_id,
    needs_stripe_customer = FALSE,
    updated_at = NOW()
  WHERE user_id = user_id;
  
  -- Check if the update was successful
  IF FOUND THEN
    success := TRUE;
    
    -- Log the update
    INSERT INTO public.webhook_logs (
      event_type,
      customer_id,
      user_id,
      processed_at,
      success
    ) VALUES (
      'manual_processing',
      customer_id,
      user_id::TEXT,
      NOW(),
      TRUE
    );
  ELSE
    -- Log the failure
    INSERT INTO public.webhook_logs (
      event_type,
      customer_id,
      user_id,
      processed_at,
      success,
      error_message
    ) VALUES (
      'manual_processing',
      customer_id,
      user_id::TEXT,
      NOW(),
      FALSE,
      'No matching user found'
    );
  END IF;
  
  RETURN success;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER; 