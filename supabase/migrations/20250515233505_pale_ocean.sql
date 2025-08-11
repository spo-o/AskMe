/*
  # Enhanced Property Analysis Metrics

  1. New Tables
    - `financial_metrics`
      - Property-specific financial calculations and ratios
    - `location_metrics`
      - Location-based scores and measurements
    - `market_metrics`
      - Market dynamics and economic indicators
    - `risk_metrics`
      - Risk assessment scores and factors

  2. Changes
    - Added foreign key relationships to properties table
    - Added composite indexes for efficient querying
    - Added calculated columns for aggregate scores

  3. Security
    - Enabled RLS on all new tables
    - Added policies for authenticated users
*/

-- Financial Metrics Table
CREATE TABLE IF NOT EXISTS financial_metrics (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  property_id uuid REFERENCES properties(id) ON DELETE CASCADE,
  debt_service_coverage numeric(10,2) NOT NULL,
  operating_expense_ratio numeric(5,2) NOT NULL,
  net_operating_income numeric(12,2) NOT NULL,
  cash_on_cash_return numeric(5,2) NOT NULL,
  breakeven_occupancy numeric(5,2) NOT NULL,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  CONSTRAINT valid_debt_coverage CHECK (debt_service_coverage >= 0),
  CONSTRAINT valid_expense_ratio CHECK (operating_expense_ratio BETWEEN 0 AND 100),
  CONSTRAINT valid_cash_return CHECK (cash_on_cash_return BETWEEN 0 AND 100),
  CONSTRAINT valid_occupancy CHECK (breakeven_occupancy BETWEEN 0 AND 100)
);

-- Location Intelligence Table
CREATE TABLE IF NOT EXISTS location_metrics (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  property_id uuid REFERENCES properties(id) ON DELETE CASCADE,
  foot_traffic_score integer NOT NULL,
  competitor_density numeric(5,2) NOT NULL,
  anchor_tenant_score integer NOT NULL,
  development_potential integer NOT NULL,
  accessibility_score integer NOT NULL,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  CONSTRAINT valid_foot_traffic CHECK (foot_traffic_score BETWEEN 0 AND 100),
  CONSTRAINT valid_competitor_density CHECK (competitor_density >= 0),
  CONSTRAINT valid_anchor_score CHECK (anchor_tenant_score BETWEEN 0 AND 100),
  CONSTRAINT valid_development CHECK (development_potential BETWEEN 0 AND 100),
  CONSTRAINT valid_accessibility CHECK (accessibility_score BETWEEN 0 AND 100)
);

-- Market Dynamics Table
CREATE TABLE IF NOT EXISTS market_metrics (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  property_id uuid REFERENCES properties(id) ON DELETE CASCADE,
  market_absorption_rate numeric(5,2) NOT NULL,
  tenant_mix_score integer NOT NULL,
  economic_resiliency integer NOT NULL,
  business_licensing_ease integer NOT NULL,
  labor_market_strength integer NOT NULL,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  CONSTRAINT valid_absorption CHECK (market_absorption_rate >= 0),
  CONSTRAINT valid_tenant_mix CHECK (tenant_mix_score BETWEEN 0 AND 100),
  CONSTRAINT valid_resiliency CHECK (economic_resiliency BETWEEN 0 AND 100),
  CONSTRAINT valid_licensing CHECK (business_licensing_ease BETWEEN 0 AND 100),
  CONSTRAINT valid_labor CHECK (labor_market_strength BETWEEN 0 AND 100)
);

-- Risk Assessment Table
CREATE TABLE IF NOT EXISTS risk_metrics (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  property_id uuid REFERENCES properties(id) ON DELETE CASCADE,
  environmental_risk integer NOT NULL,
  regulatory_risk integer NOT NULL,
  market_volatility integer NOT NULL,
  infrastructure_risk integer NOT NULL,
  demographic_stability integer NOT NULL,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  CONSTRAINT valid_environmental CHECK (environmental_risk BETWEEN 0 AND 100),
  CONSTRAINT valid_regulatory CHECK (regulatory_risk BETWEEN 0 AND 100),
  CONSTRAINT valid_volatility CHECK (market_volatility BETWEEN 0 AND 100),
  CONSTRAINT valid_infrastructure CHECK (infrastructure_risk BETWEEN 0 AND 100),
  CONSTRAINT valid_demographic CHECK (demographic_stability BETWEEN 0 AND 100)
);

-- Create indexes for efficient querying
CREATE INDEX IF NOT EXISTS idx_financial_metrics_property ON financial_metrics(property_id);
CREATE INDEX IF NOT EXISTS idx_location_metrics_property ON location_metrics(property_id);
CREATE INDEX IF NOT EXISTS idx_market_metrics_property ON market_metrics(property_id);
CREATE INDEX IF NOT EXISTS idx_risk_metrics_property ON risk_metrics(property_id);

-- Enable RLS on all tables
ALTER TABLE financial_metrics ENABLE ROW LEVEL SECURITY;
ALTER TABLE location_metrics ENABLE ROW LEVEL SECURITY;
ALTER TABLE market_metrics ENABLE ROW LEVEL SECURITY;
ALTER TABLE risk_metrics ENABLE ROW LEVEL SECURITY;

-- Create policies for authenticated users
CREATE POLICY "Users can view metrics for accessible properties" ON financial_metrics
  FOR SELECT TO authenticated
  USING (EXISTS (
    SELECT 1 FROM properties
    WHERE properties.id = financial_metrics.property_id
    AND (properties.owner_id = auth.uid() OR properties.status = 'public')
  ));

CREATE POLICY "Users can view metrics for accessible properties" ON location_metrics
  FOR SELECT TO authenticated
  USING (EXISTS (
    SELECT 1 FROM properties
    WHERE properties.id = location_metrics.property_id
    AND (properties.owner_id = auth.uid() OR properties.status = 'public')
  ));

CREATE POLICY "Users can view metrics for accessible properties" ON market_metrics
  FOR SELECT TO authenticated
  USING (EXISTS (
    SELECT 1 FROM properties
    WHERE properties.id = market_metrics.property_id
    AND (properties.owner_id = auth.uid() OR properties.status = 'public')
  ));

CREATE POLICY "Users can view metrics for accessible properties" ON risk_metrics
  FOR SELECT TO authenticated
  USING (EXISTS (
    SELECT 1 FROM properties
    WHERE properties.id = risk_metrics.property_id
    AND (properties.owner_id = auth.uid() OR properties.status = 'public')
  ));

-- Create function to calculate aggregate opportunity score
CREATE OR REPLACE FUNCTION calculate_opportunity_score(
  property_id uuid
) RETURNS numeric AS $$
DECLARE
  financial_score numeric;
  location_score numeric;
  market_score numeric;
  risk_score numeric;
BEGIN
  -- Calculate financial score (25% weight)
  SELECT 
    (debt_service_coverage * 0.3 +
     (100 - operating_expense_ratio) * 0.3 +
     cash_on_cash_return * 0.4) * 0.25
  INTO financial_score
  FROM financial_metrics
  WHERE property_id = $1;

  -- Calculate location score (25% weight)
  SELECT 
    (foot_traffic_score * 0.3 +
     anchor_tenant_score * 0.3 +
     accessibility_score * 0.4) * 0.25
  INTO location_score
  FROM location_metrics
  WHERE property_id = $1;

  -- Calculate market score (25% weight)
  SELECT 
    (tenant_mix_score * 0.3 +
     economic_resiliency * 0.4 +
     labor_market_strength * 0.3) * 0.25
  INTO market_score
  FROM market_metrics
  WHERE property_id = $1;

  -- Calculate risk score (25% weight)
  SELECT 
    ((100 - environmental_risk) * 0.3 +
     (100 - regulatory_risk) * 0.3 +
     demographic_stability * 0.4) * 0.25
  INTO risk_score
  FROM risk_metrics
  WHERE property_id = $1;

  -- Return aggregate score
  RETURN COALESCE(financial_score, 0) + 
         COALESCE(location_score, 0) + 
         COALESCE(market_score, 0) + 
         COALESCE(risk_score, 0);
END;
$$ LANGUAGE plpgsql;