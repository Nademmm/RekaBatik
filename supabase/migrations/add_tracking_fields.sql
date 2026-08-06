-- Migration SQL to add tracking, review, and custom design references to orders table

-- Add shipping tracking fields
ALTER TABLE orders ADD COLUMN IF NOT EXISTS tracking_number VARCHAR(100);
ALTER TABLE orders ADD COLUMN IF NOT EXISTS courier VARCHAR(50);

-- Add review rating and comment fields
ALTER TABLE orders ADD COLUMN IF NOT EXISTS review_rating INTEGER;
ALTER TABLE orders ADD COLUMN IF NOT EXISTS review_comment TEXT;

-- Add custom design ID reference to associate orders with custom designs
ALTER TABLE orders ADD COLUMN IF NOT EXISTS custom_design_id INTEGER REFERENCES custom_designs(id) ON DELETE SET NULL;
