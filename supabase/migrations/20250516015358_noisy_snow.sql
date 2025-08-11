-- Create blogs table
CREATE TABLE blogs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  title text NOT NULL,
  content text NOT NULL,
  status text NOT NULL CHECK (status IN ('draft', 'published', 'archived')),
  author_id uuid REFERENCES auth.users(id) ON DELETE CASCADE,
  published_at timestamptz,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Enable RLS
ALTER TABLE blogs ENABLE ROW LEVEL SECURITY;

-- Create policies
CREATE POLICY "Anyone can read published blogs"
  ON blogs FOR SELECT
  TO authenticated
  USING (status = 'published');

CREATE POLICY "Authors can manage their blogs"
  ON blogs FOR ALL
  TO authenticated
  USING (author_id = auth.uid());

CREATE POLICY "Admins can manage all blogs"
  ON blogs FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM team_members
      WHERE user_id = auth.uid()
      AND role = 'admin'
    )
  );

-- Create indexes
CREATE INDEX idx_blogs_status ON blogs(status);
CREATE INDEX idx_blogs_author ON blogs(author_id);
CREATE INDEX idx_blogs_published_at ON blogs(published_at);