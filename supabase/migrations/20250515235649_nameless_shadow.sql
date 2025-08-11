/*
  # Create subscription and user role tables

  1. New Tables
    - `subscription_plans`
      - Plan details and limits
    - `user_subscriptions`
      - Links users to their subscription plan
    - `team_members`
      - Manages team members and their roles
    - `invitations`
      - Handles team member invitations

  2. Security
    - Enable RLS on all tables
    - Add policies for access control
*/

-- Subscription Plans Table
CREATE TABLE subscription_plans (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  price numeric(10,2) NOT NULL,
  max_team_members integer NOT NULL,
  max_properties integer NOT NULL,
  max_analyses integer NOT NULL,
  features jsonb NOT NULL,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- User Subscriptions Table
CREATE TABLE user_subscriptions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE,
  plan_id uuid REFERENCES subscription_plans(id),
  status text NOT NULL CHECK (status IN ('active', 'cancelled', 'past_due')),
  current_period_start timestamptz NOT NULL,
  current_period_end timestamptz NOT NULL,
  cancel_at_period_end boolean DEFAULT false,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  UNIQUE (user_id)
);

-- Team Members Table
CREATE TABLE team_members (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  team_id uuid REFERENCES user_subscriptions(id) ON DELETE CASCADE,
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE,
  role text NOT NULL CHECK (role IN ('admin', 'analyst', 'viewer')),
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  UNIQUE (team_id, user_id)
);

-- Invitations Table
CREATE TABLE invitations (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  team_id uuid REFERENCES user_subscriptions(id) ON DELETE CASCADE,
  email text NOT NULL,
  role text NOT NULL CHECK (role IN ('analyst', 'viewer')),
  token text NOT NULL UNIQUE,
  expires_at timestamptz NOT NULL,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Insert default subscription plans
INSERT INTO subscription_plans (name, price, max_team_members, max_properties, max_analyses, features) VALUES
  ('Free', 0, 1, 5, 10, '["Basic market insights", "Standard reporting", "Email support"]'),
  ('Basic', 29, 2, 20, 50, '["Team collaboration", "Advanced market insights", "Priority support", "Custom reporting"]'),
  ('Professional', 79, 5, 100, 200, '["API access", "White-label reports", "Dedicated account manager", "Custom integrations"]'),
  ('Enterprise', 199, 999999, 999999, 999999, '["On-premise deployment", "SLA guarantee", "Custom features", "24/7 support"]');

-- Enable RLS
ALTER TABLE subscription_plans ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_subscriptions ENABLE ROW LEVEL SECURITY;
ALTER TABLE team_members ENABLE ROW LEVEL SECURITY;
ALTER TABLE invitations ENABLE ROW LEVEL SECURITY;

-- RLS Policies
CREATE POLICY "Anyone can view subscription plans"
  ON subscription_plans FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Users can view their own subscription"
  ON user_subscriptions FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Team members can view their team"
  ON team_members FOR SELECT
  TO authenticated
  USING (
    user_id = auth.uid() OR
    EXISTS (
      SELECT 1 FROM team_members tm
      WHERE tm.team_id = team_members.team_id
      AND tm.user_id = auth.uid()
    )
  );

CREATE POLICY "Team admins can manage team members"
  ON team_members FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM team_members tm
      WHERE tm.team_id = team_members.team_id
      AND tm.user_id = auth.uid()
      AND tm.role = 'admin'
    )
  );

CREATE POLICY "Team admins can manage invitations"
  ON invitations FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM team_members tm
      WHERE tm.team_id = invitations.team_id
      AND tm.user_id = auth.uid()
      AND tm.role = 'admin'
    )
  );

-- Functions
CREATE OR REPLACE FUNCTION check_team_limit() RETURNS trigger AS $$
BEGIN
  IF EXISTS (
    SELECT 1
    FROM user_subscriptions us
    JOIN subscription_plans sp ON us.plan_id = sp.id
    JOIN team_members tm ON tm.team_id = us.id
    WHERE us.id = NEW.team_id
    GROUP BY sp.max_team_members
    HAVING COUNT(*) >= sp.max_team_members
  ) THEN
    RAISE EXCEPTION 'Team member limit reached for subscription plan';
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER check_team_limit_trigger
  BEFORE INSERT ON team_members
  FOR EACH ROW
  EXECUTE FUNCTION check_team_limit();