-- Add document_order column to document_types table
DO $$
BEGIN
  -- Check if column doesn't already exist before adding it
  IF NOT EXISTS (
    SELECT FROM information_schema.columns 
    WHERE table_name = 'document_types' AND column_name = 'document_order'
  ) THEN
    -- Add document_order column with default ordering
    ALTER TABLE document_types ADD COLUMN document_order INTEGER;
    
    -- Update existing records with default ordering
    -- This ensures all existing document types get a sequential order
    WITH ordered AS (
      SELECT id, ROW_NUMBER() OVER (ORDER BY name) as row_num
      FROM document_types
    )
    UPDATE document_types
    SET document_order = ordered.row_num
    FROM ordered
    WHERE document_types.id = ordered.id;
    
    -- Set a NOT NULL constraint after populating values
    ALTER TABLE document_types ALTER COLUMN document_order SET NOT NULL;
    
    -- Add an index to improve sorting performance
    CREATE INDEX IF NOT EXISTS idx_document_types_order ON document_types(document_order);
  END IF;
END $$;

-- Update existing document types with intentional ordering
UPDATE document_types SET document_order = 1 WHERE id = 'marketing_plan';
UPDATE document_types SET document_order = 2 WHERE id = 'brand_guidelines';
UPDATE document_types SET document_order = 3 WHERE id = 'customer_acquisition';
UPDATE document_types SET document_order = 4 WHERE id = 'social_media_strategy';
UPDATE document_types SET document_order = 5 WHERE id = 'email_campaign';
UPDATE document_types SET document_order = 6 WHERE id = 'website_content';
UPDATE document_types SET document_order = 7 WHERE id = 'product_launch';
UPDATE document_types SET document_order = 8 WHERE id = 'sales_deck';
UPDATE document_types SET document_order = 9 WHERE id = 'business_proposal'; 