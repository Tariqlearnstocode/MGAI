-- Create purchases table to track user purchases and document access
CREATE TABLE IF NOT EXISTS purchases (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES profiles(id),
  product_id VARCHAR NOT NULL,  -- 'single_plan', 'complete_guide', 'agency_pack'
  status VARCHAR NOT NULL DEFAULT 'active',  -- 'active', 'cancelled'
  purchase_date TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  expires_at TIMESTAMPTZ,
  remaining_uses INT,  -- For agency_pack (10-pack)
  used_for_projects JSONB,  -- Array of project IDs where 10-pack is applied
  stripe_transaction_id VARCHAR,
  stripe_price_id VARCHAR,  -- Store the Stripe price ID
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create RLS policies for purchases
ALTER TABLE purchases ENABLE ROW LEVEL SECURITY;

-- Policy to allow users to see only their own purchases
CREATE POLICY purchases_select_policy ON purchases
  FOR SELECT
  USING (auth.uid() = user_id);

-- Create a function to update the updated_at timestamp
CREATE OR REPLACE FUNCTION update_modified_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create a trigger to update the timestamp
CREATE TRIGGER update_purchases_updated_at
BEFORE UPDATE ON purchases
FOR EACH ROW
EXECUTE FUNCTION update_modified_column();

-- Add a reference to our product IDs in the products table
INSERT INTO products (id, name, description, price, features, stripe_price_id) 
VALUES 
  ('single_plan', 'Single Marketing Plan', 'Access to one document for a single project', 1999, 
   '["Complete marketing plan document", "Export to PDF & Word", "One-time payment"]'::jsonb,
   'prod_RwqVYgVHlqs1dy')
ON CONFLICT (id) 
DO UPDATE SET 
  stripe_price_id = 'prod_RwqVYgVHlqs1dy';

UPDATE products 
SET stripe_price_id = 'price_1R2wrwENRbwTo9ZjYZjz1oRS'
WHERE id = 'complete_guide';

UPDATE products 
SET stripe_price_id = 'price_1R2wrwENRbwTo9ZjeIIAIqRV'
WHERE id = 'agency_pack';

-- Add stripe_price_id column to products table if it doesn't exist
ALTER TABLE products ADD COLUMN IF NOT EXISTS stripe_price_id VARCHAR; 