-- ===========================================
-- Business & Code Analyzer - Initial Schema
-- ===========================================

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ===========================================
-- Enums
-- ===========================================

CREATE TYPE analysis_type AS ENUM ('code', 'business', 'competitor', 'full');
CREATE TYPE task_priority AS ENUM ('critical', 'high', 'medium', 'low');
CREATE TYPE task_status AS ENUM ('pending', 'in_progress', 'completed', 'skipped');

-- ===========================================
-- Profiles (extends auth.users)
-- ===========================================

CREATE TABLE profiles (
  id UUID REFERENCES auth.users ON DELETE CASCADE PRIMARY KEY,
  email TEXT NOT NULL,
  full_name TEXT,
  avatar_url TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

-- Enable RLS
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;

-- Policies
CREATE POLICY "Users can view own profile" ON profiles
  FOR SELECT USING (auth.uid() = id);

CREATE POLICY "Users can update own profile" ON profiles
  FOR UPDATE USING (auth.uid() = id);

-- Auto-create profile on signup
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (id, email, full_name, avatar_url)
  VALUES (
    NEW.id,
    NEW.email,
    NEW.raw_user_meta_data->>'full_name',
    NEW.raw_user_meta_data->>'avatar_url'
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE PROCEDURE public.handle_new_user();

-- ===========================================
-- Projects
-- ===========================================

CREATE TABLE projects (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  user_id UUID REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
  name TEXT NOT NULL,
  description TEXT,
  repo_url TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

-- Enable RLS
ALTER TABLE projects ENABLE ROW LEVEL SECURITY;

-- Policies
CREATE POLICY "Users can view own projects" ON projects
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can create own projects" ON projects
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own projects" ON projects
  FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own projects" ON projects
  FOR DELETE USING (auth.uid() = user_id);

-- Index
CREATE INDEX idx_projects_user_id ON projects(user_id);

-- ===========================================
-- Analyses
-- ===========================================

CREATE TABLE analyses (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  project_id UUID REFERENCES projects(id) ON DELETE CASCADE NOT NULL,
  type analysis_type NOT NULL,
  result JSONB NOT NULL,
  metadata JSONB,
  created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

-- Enable RLS
ALTER TABLE analyses ENABLE ROW LEVEL SECURITY;

-- Policies (through project ownership)
CREATE POLICY "Users can view own analyses" ON analyses
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM projects
      WHERE projects.id = analyses.project_id
      AND projects.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can create analyses for own projects" ON analyses
  FOR INSERT WITH CHECK (
    EXISTS (
      SELECT 1 FROM projects
      WHERE projects.id = analyses.project_id
      AND projects.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can delete own analyses" ON analyses
  FOR DELETE USING (
    EXISTS (
      SELECT 1 FROM projects
      WHERE projects.id = analyses.project_id
      AND projects.user_id = auth.uid()
    )
  );

-- Indexes
CREATE INDEX idx_analyses_project_id ON analyses(project_id);
CREATE INDEX idx_analyses_type ON analyses(type);
CREATE INDEX idx_analyses_created_at ON analyses(created_at DESC);

-- ===========================================
-- Business Canvases
-- ===========================================

CREATE TABLE business_canvases (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  project_id UUID REFERENCES projects(id) ON DELETE CASCADE NOT NULL,
  canvas JSONB NOT NULL,
  business_stage TEXT,
  gaps_in_model JSONB,
  created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

-- Enable RLS
ALTER TABLE business_canvases ENABLE ROW LEVEL SECURITY;

-- Policies
CREATE POLICY "Users can view own canvases" ON business_canvases
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM projects
      WHERE projects.id = business_canvases.project_id
      AND projects.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can create canvases for own projects" ON business_canvases
  FOR INSERT WITH CHECK (
    EXISTS (
      SELECT 1 FROM projects
      WHERE projects.id = business_canvases.project_id
      AND projects.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can update own canvases" ON business_canvases
  FOR UPDATE USING (
    EXISTS (
      SELECT 1 FROM projects
      WHERE projects.id = business_canvases.project_id
      AND projects.user_id = auth.uid()
    )
  );

-- Index
CREATE INDEX idx_business_canvases_project_id ON business_canvases(project_id);

-- ===========================================
-- Competitors
-- ===========================================

CREATE TABLE competitors (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  project_id UUID REFERENCES projects(id) ON DELETE CASCADE NOT NULL,
  name TEXT NOT NULL,
  url TEXT,
  social_links JSONB,
  notes TEXT,
  profile JSONB,
  created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

-- Enable RLS
ALTER TABLE competitors ENABLE ROW LEVEL SECURITY;

-- Policies
CREATE POLICY "Users can view own competitors" ON competitors
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM projects
      WHERE projects.id = competitors.project_id
      AND projects.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can create competitors for own projects" ON competitors
  FOR INSERT WITH CHECK (
    EXISTS (
      SELECT 1 FROM projects
      WHERE projects.id = competitors.project_id
      AND projects.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can update own competitors" ON competitors
  FOR UPDATE USING (
    EXISTS (
      SELECT 1 FROM projects
      WHERE projects.id = competitors.project_id
      AND projects.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can delete own competitors" ON competitors
  FOR DELETE USING (
    EXISTS (
      SELECT 1 FROM projects
      WHERE projects.id = competitors.project_id
      AND projects.user_id = auth.uid()
    )
  );

-- Index
CREATE INDEX idx_competitors_project_id ON competitors(project_id);

-- ===========================================
-- Tasks
-- ===========================================

CREATE TABLE tasks (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  project_id UUID REFERENCES projects(id) ON DELETE CASCADE NOT NULL,
  analysis_id UUID REFERENCES analyses(id) ON DELETE SET NULL,
  title TEXT NOT NULL,
  description TEXT,
  priority task_priority DEFAULT 'medium' NOT NULL,
  status task_status DEFAULT 'pending' NOT NULL,
  due_date DATE,
  created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

-- Enable RLS
ALTER TABLE tasks ENABLE ROW LEVEL SECURITY;

-- Policies
CREATE POLICY "Users can view own tasks" ON tasks
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM projects
      WHERE projects.id = tasks.project_id
      AND projects.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can create tasks for own projects" ON tasks
  FOR INSERT WITH CHECK (
    EXISTS (
      SELECT 1 FROM projects
      WHERE projects.id = tasks.project_id
      AND projects.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can update own tasks" ON tasks
  FOR UPDATE USING (
    EXISTS (
      SELECT 1 FROM projects
      WHERE projects.id = tasks.project_id
      AND projects.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can delete own tasks" ON tasks
  FOR DELETE USING (
    EXISTS (
      SELECT 1 FROM projects
      WHERE projects.id = tasks.project_id
      AND projects.user_id = auth.uid()
    )
  );

-- Indexes
CREATE INDEX idx_tasks_project_id ON tasks(project_id);
CREATE INDEX idx_tasks_status ON tasks(status);
CREATE INDEX idx_tasks_priority ON tasks(priority);
CREATE INDEX idx_tasks_due_date ON tasks(due_date);

-- ===========================================
-- Updated At Trigger
-- ===========================================

CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Apply to tables with updated_at
CREATE TRIGGER update_profiles_updated_at
  BEFORE UPDATE ON profiles
  FOR EACH ROW EXECUTE PROCEDURE update_updated_at_column();

CREATE TRIGGER update_projects_updated_at
  BEFORE UPDATE ON projects
  FOR EACH ROW EXECUTE PROCEDURE update_updated_at_column();

CREATE TRIGGER update_business_canvases_updated_at
  BEFORE UPDATE ON business_canvases
  FOR EACH ROW EXECUTE PROCEDURE update_updated_at_column();

CREATE TRIGGER update_competitors_updated_at
  BEFORE UPDATE ON competitors
  FOR EACH ROW EXECUTE PROCEDURE update_updated_at_column();

CREATE TRIGGER update_tasks_updated_at
  BEFORE UPDATE ON tasks
  FOR EACH ROW EXECUTE PROCEDURE update_updated_at_column();
