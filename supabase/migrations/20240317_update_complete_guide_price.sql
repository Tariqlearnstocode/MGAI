-- Update the price ID for the complete_guide product
UPDATE products 
SET stripe_price_id = 'price_1R4q0AENRbwTo9ZjztVfddMv'
WHERE id = 'complete_guide';

-- Log the change
INSERT INTO system_logs (action, description)
VALUES ('update_price_id', 'Updated Complete Guide price ID to price_1R4q0AENRbwTo9ZjztVfddMv')
ON CONFLICT DO NOTHING; 