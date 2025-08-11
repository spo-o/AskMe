/*
  # Update subscription plans pricing structure
  
  1. Changes
    - Add monthly and annual pricing options
    - Set annual pricing at 15% discount
    - Update billing frequency options
  
  2. Migration Steps
    - Add new columns with temporary nullable constraint
    - Update existing data
    - Make columns non-nullable
    - Remove old price column
*/

-- First add columns as nullable
ALTER TABLE subscription_plans 
ADD COLUMN monthly_price numeric(10,2),
ADD COLUMN annual_price numeric(10,2),
ADD COLUMN billing_frequency text DEFAULT 'monthly';

-- Update existing data
UPDATE subscription_plans SET
  monthly_price = price,
  annual_price = ROUND(price * 0.85 * 12, 2),
  billing_frequency = 'monthly'
WHERE id IS NOT NULL;

-- Now make columns non-nullable and add constraint
ALTER TABLE subscription_plans 
ALTER COLUMN monthly_price SET NOT NULL,
ALTER COLUMN annual_price SET NOT NULL,
ALTER COLUMN billing_frequency SET NOT NULL,
ADD CONSTRAINT valid_billing_frequency 
  CHECK (billing_frequency IN ('monthly', 'annual'));

-- Finally remove old column
ALTER TABLE subscription_plans DROP COLUMN price;