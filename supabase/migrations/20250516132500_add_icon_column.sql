-- Add icon column to document_types table if it doesn't exist
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT FROM information_schema.columns 
        WHERE table_name = 'document_types' AND column_name = 'icon'
    ) THEN
        ALTER TABLE document_types ADD COLUMN icon text;
    END IF;
END $$; 