-- Create a function to process Stripe webhook data and update stripe_customers table
CREATE OR REPLACE FUNCTION public.process_stripe_webhook()
RETURNS TRIGGER AS $$
DECLARE
  customer_data JSONB;
  stripe_customer_id TEXT;
  user_id TEXT;
BEGIN
  -- For customer.created events
  IF NEW.type = 'customer.created' THEN
    -- Extract the customer data from the webhook payload
    -- The structure is data->object for webhook events
    customer_data := NEW.data->'object';
    
    -- Extract the Stripe customer ID
    stripe_customer_id := customer_data->>'id';
    
    -- Extract the user ID from metadata
    user_id := customer_data->'metadata'->>'userId';
    
    -- Log the extracted data for debugging
    RAISE NOTICE 'Processing webhook: type=%, customer_id=%, user_id=%', 
      NEW.type, stripe_customer_id, user_id;
    
    -- Update the stripe_customers table if we have both IDs
    IF stripe_customer_id IS NOT NULL AND user_id IS NOT NULL THEN
      UPDATE public.stripe_customers
      SET 
        stripe_customer_id = stripe_customer_id,
        needs_stripe_customer = FALSE,
        updated_at = NOW()
      WHERE user_id = user_id::uuid;
      
      -- Log success or failure
      IF FOUND THEN
        RAISE NOTICE 'Successfully updated stripe_customer_id for user %', user_id;
      ELSE
        RAISE WARNING 'No matching record found for user %', user_id;
      END IF;
    ELSE
      RAISE WARNING 'Missing data in webhook: stripe_customer_id=%, user_id=%', 
        stripe_customer_id, user_id;
    END IF;
  END IF;
  
  -- Always return NEW to continue with the INSERT
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create a function to manually process webhook data
CREATE OR REPLACE FUNCTION public.manually_process_webhook(webhook_id TEXT)
RETURNS BOOLEAN AS $$
DECLARE
  webhook_record RECORD;
  customer_data JSONB;
  stripe_customer_id TEXT;
  user_id TEXT;
  success BOOLEAN := FALSE;
BEGIN
  -- Get the webhook record
  SELECT * INTO webhook_record 
  FROM public.stripe_webhook_events 
  WHERE id = webhook_id;
  
  IF NOT FOUND THEN
    RAISE EXCEPTION 'Webhook with ID % not found', webhook_id;
  END IF;
  
  -- For customer.created events
  IF webhook_record.type = 'customer.created' THEN
    -- Extract the customer data from the webhook payload
    -- Adapt this path based on the actual structure in your database
    -- It could be data->object or data->data->object depending on how it's stored
    customer_data := webhook_record.data->'object';
    
    -- If the above doesn't work, try this alternative path
    IF customer_data IS NULL THEN
      customer_data := webhook_record.data->'data'->'object';
    END IF;
    
    -- Extract the Stripe customer ID
    stripe_customer_id := customer_data->>'id';
    
    -- Extract the user ID from metadata
    user_id := customer_data->'metadata'->>'userId';
    
    -- Update the stripe_customers table if we have both IDs
    IF stripe_customer_id IS NOT NULL AND user_id IS NOT NULL THEN
      UPDATE public.stripe_customers
      SET 
        stripe_customer_id = stripe_customer_id,
        needs_stripe_customer = FALSE,
        updated_at = NOW()
      WHERE user_id = user_id::uuid;
      
      IF FOUND THEN
        success := TRUE;
        
        -- Log success in webhook_logs
        INSERT INTO public.webhook_logs (
          event_type,
          stripe_event_id,
          customer_id,
          user_id,
          processed_at,
          success
        ) VALUES (
          webhook_record.type,
          webhook_record.id,
          stripe_customer_id,
          user_id,
          NOW(),
          TRUE
        );
      ELSE
        -- Log failure in webhook_logs
        INSERT INTO public.webhook_logs (
          event_type,
          stripe_event_id,
          customer_id,
          user_id,
          processed_at,
          success,
          error_message
        ) VALUES (
          webhook_record.type,
          webhook_record.id,
          stripe_customer_id,
          user_id,
          NOW(),
          FALSE,
          'No matching record found for user ' || user_id
        );
      END IF;
    END IF;
  END IF;
  
  RETURN success;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Make sure we have the webhook_logs table
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

-- Create trigger for the stripe_webhook_events table
DROP TRIGGER IF EXISTS trig_process_stripe_webhook ON public.stripe_webhook_events;
CREATE TRIGGER trig_process_stripe_webhook
  AFTER INSERT ON public.stripe_webhook_events
  FOR EACH ROW
  EXECUTE FUNCTION public.process_stripe_webhook();

-- Function to diagnose the webhook data structure
CREATE OR REPLACE FUNCTION public.diagnose_webhook_structure(webhook_id TEXT)
RETURNS JSONB AS $$
DECLARE
  webhook_record RECORD;
  diagnostic JSONB;
BEGIN
  -- Get the webhook record
  SELECT * INTO webhook_record 
  FROM public.stripe_webhook_events 
  WHERE id = webhook_id;
  
  IF NOT FOUND THEN
    RAISE EXCEPTION 'Webhook with ID % not found', webhook_id;
  END IF;
  
  -- Create a diagnostic object
  diagnostic := jsonb_build_object(
    'webhook_id', webhook_id,
    'type', webhook_record.type,
    'data_keys', jsonb_object_keys(webhook_record.data),
    'data_object_path', webhook_record.data->'object',
    'data_data_object_path', webhook_record.data->'data'->'object',
    'has_object', (webhook_record.data->'object') IS NOT NULL,
    'has_data_object', (webhook_record.data->'data'->'object') IS NOT NULL
  );
  
  -- If there's a customer object
  IF webhook_record.type = 'customer.created' THEN
    -- Try different paths to find customer data
    IF (webhook_record.data->'object') IS NOT NULL THEN
      diagnostic := diagnostic || jsonb_build_object(
        'customer_id_from_object', webhook_record.data->'object'->>'id',
        'user_id_from_object', webhook_record.data->'object'->'metadata'->>'userId'
      );
    END IF;
    
    IF (webhook_record.data->'data'->'object') IS NOT NULL THEN
      diagnostic := diagnostic || jsonb_build_object(
        'customer_id_from_data_object', webhook_record.data->'data'->'object'->>'id',
        'user_id_from_data_object', webhook_record.data->'data'->'object'->'metadata'->>'userId'
      );
    END IF;
  END IF;
  
  RETURN diagnostic;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to display the data structure
CREATE OR REPLACE FUNCTION public.view_webhook_data(webhook_id TEXT)
RETURNS JSONB AS $$
DECLARE
  webhook_data JSONB;
BEGIN
  SELECT data INTO webhook_data
  FROM public.stripe_webhook_events
  WHERE id = webhook_id;
  
  IF NOT FOUND THEN
    RAISE EXCEPTION 'Webhook with ID % not found', webhook_id;
  END IF;
  
  RETURN webhook_data;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to manually apply a customer ID to a user
CREATE OR REPLACE FUNCTION public.manually_set_customer_id(
  p_user_id UUID,
  p_customer_id TEXT
)
RETURNS BOOLEAN AS $$
DECLARE
  success BOOLEAN := FALSE;
BEGIN
  UPDATE public.stripe_customers
  SET 
    stripe_customer_id = p_customer_id,
    needs_stripe_customer = FALSE,
    updated_at = NOW()
  WHERE user_id = p_user_id;
  
  IF FOUND THEN
    success := TRUE;
    
    -- Log the manual update
    INSERT INTO public.webhook_logs (
      event_type,
      customer_id,
      user_id,
      processed_at,
      success
    ) VALUES (
      'manual_update',
      p_customer_id,
      p_user_id::TEXT,
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
      'manual_update',
      p_customer_id,
      p_user_id::TEXT,
      NOW(),
      FALSE,
      'No matching record found for user ' || p_user_id::TEXT
    );
  END IF;
  
  RETURN success;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER; 