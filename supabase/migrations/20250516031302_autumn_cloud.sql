/*
  # Add task tracking system

  1. New Tables
    - `property_statuses`
      - Tracks active/inactive state of properties
    - `tasks`
      - Manages team tasks and assignments
    - `activity_logs`
      - Tracks all user actions and updates

  2. Security
    - Enable RLS on all tables
    - Add policies for access control
*/

-- Property Statuses Table
CREATE TABLE property_statuses (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  property_id uuid REFERENCES properties(id) ON DELETE CASCADE,
  status text NOT NULL CHECK (status IN ('active', 'inactive', 'archived')),
  reason text NOT NULL CHECK (reason IN ('analysis', 'pending_review', 'in_progress', 'completed')),
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Tasks Table
CREATE TABLE tasks (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  title text NOT NULL,
  description text,
  assigned_to uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  assigned_by uuid REFERENCES auth.users(id),
  property_id uuid REFERENCES properties(id) ON DELETE CASCADE,
  due_date timestamptz NOT NULL,
  priority text NOT NULL CHECK (priority IN ('low', 'medium', 'high')),
  status text NOT NULL CHECK (status IN ('planned', 'in_progress', 'completed', 'cancelled')),
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Activity Logs Table
CREATE TABLE activity_logs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  activity_type text NOT NULL CHECK (activity_type IN (
    'property_added',
    'analysis_created',
    'task_updated',
    'report_shared',
    'comment_added'
  )),
  entity_type text NOT NULL,
  entity_id uuid NOT NULL,
  details jsonb NOT NULL DEFAULT '{}',
  created_at timestamptz DEFAULT now()
);

-- Enable RLS
ALTER TABLE property_statuses ENABLE ROW LEVEL SECURITY;
ALTER TABLE tasks ENABLE ROW LEVEL SECURITY;
ALTER TABLE activity_logs ENABLE ROW LEVEL SECURITY;

-- RLS Policies
CREATE POLICY "Users can view their property statuses"
  ON property_statuses FOR SELECT
  TO authenticated
  USING (EXISTS (
    SELECT 1 FROM properties
    WHERE properties.id = property_statuses.property_id
    AND properties.owner_id = auth.uid()
  ));

CREATE POLICY "Users can view assigned tasks"
  ON tasks FOR SELECT
  TO authenticated
  USING (
    assigned_to = auth.uid() OR
    assigned_by = auth.uid() OR
    EXISTS (
      SELECT 1 FROM team_members
      WHERE team_members.user_id = auth.uid()
      AND team_members.role IN ('admin', 'analyst')
    )
  );

CREATE POLICY "Users can manage tasks they created"
  ON tasks FOR ALL
  TO authenticated
  USING (assigned_by = auth.uid())
  WITH CHECK (assigned_by = auth.uid());

CREATE POLICY "Users can view relevant activity logs"
  ON activity_logs FOR SELECT
  TO authenticated
  USING (
    user_id = auth.uid() OR
    EXISTS (
      SELECT 1 FROM team_members
      WHERE team_members.user_id = auth.uid()
      AND team_members.role IN ('admin', 'analyst')
    )
  );

-- Create indexes
CREATE INDEX idx_property_statuses_property ON property_statuses(property_id);
CREATE INDEX idx_tasks_assigned_to ON tasks(assigned_to);
CREATE INDEX idx_tasks_property ON tasks(property_id);
CREATE INDEX idx_activity_logs_user ON activity_logs(user_id);
CREATE INDEX idx_activity_logs_type ON activity_logs(activity_type);