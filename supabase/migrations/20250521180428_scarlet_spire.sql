/*
  # Add property analysis requests table
  
  1. New Table
    - `property_analysis_requests`
      - Stores form submissions and consultation requests
  
  2. Security
    - Enable RLS
    - Add policies for access control
*/

CREATE TABLE property_analysis_requests (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  form_data jsonb NOT NULL,
  selected_package text NOT NULL,
  status text NOT NULL CHECK (status IN ('pending', 'scheduled', 'completed', 'cancelled')),
  consultation_date timestamptz,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Enable RLS
ALTER TABLE property_analysis_requests ENABLE ROW LEVEL SECURITY;

-- Create policies
CREATE POLICY "Admins can view all requests"
  ON property_analysis_requests FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM team_members
      WHERE user_id = auth.uid()
      AND role = 'admin'
    )
  );