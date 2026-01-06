-- ===========================================
-- Analysis Versioning for History & Comparison
-- ===========================================

-- Add version number to analyses (auto-incremented per project)
ALTER TABLE analyses ADD COLUMN IF NOT EXISTS version INTEGER;

-- Add alignment_score for quick filtering (from gap analysis)
ALTER TABLE analyses ADD COLUMN IF NOT EXISTS alignment_score INTEGER;

-- Add summary for quick display without parsing JSONB
ALTER TABLE analyses ADD COLUMN IF NOT EXISTS summary TEXT;

-- Add label for user-defined version names (e.g., "v1.0 Launch", "After Auth Fix")
ALTER TABLE analyses ADD COLUMN IF NOT EXISTS label TEXT;

-- Create index for version comparison queries
CREATE INDEX IF NOT EXISTS idx_analyses_version ON analyses(project_id, version DESC);
CREATE INDEX IF NOT EXISTS idx_analyses_alignment_score ON analyses(alignment_score);

-- Function to auto-increment version per project
CREATE OR REPLACE FUNCTION increment_analysis_version()
RETURNS TRIGGER AS $$
DECLARE
  max_version INTEGER;
BEGIN
  -- Get the max version for this project
  SELECT COALESCE(MAX(version), 0) INTO max_version
  FROM analyses
  WHERE project_id = NEW.project_id;

  -- Set the new version
  NEW.version = max_version + 1;

  -- Extract alignment_score from result if it exists (for gap/full analyses)
  IF NEW.result ? 'alignment_score' THEN
    NEW.alignment_score = (NEW.result->>'alignment_score')::INTEGER;
  END IF;

  -- Extract summary from result if it exists
  IF NEW.result ? 'summary' THEN
    NEW.summary = NEW.result->>'summary';
  ELSIF NEW.result ? 'verdict_explanation' THEN
    NEW.summary = NEW.result->>'verdict_explanation';
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger for auto-versioning
DROP TRIGGER IF EXISTS auto_version_analysis ON analyses;
CREATE TRIGGER auto_version_analysis
  BEFORE INSERT ON analyses
  FOR EACH ROW EXECUTE PROCEDURE increment_analysis_version();

-- ===========================================
-- Backfill existing analyses
-- ===========================================

-- Update existing analyses with version numbers
WITH numbered AS (
  SELECT
    id,
    ROW_NUMBER() OVER (PARTITION BY project_id ORDER BY created_at) as rn
  FROM analyses
)
UPDATE analyses
SET version = numbered.rn
FROM numbered
WHERE analyses.id = numbered.id
  AND analyses.version IS NULL;

-- Extract alignment_score from existing analyses
UPDATE analyses
SET alignment_score = (result->>'alignment_score')::INTEGER
WHERE result ? 'alignment_score'
  AND alignment_score IS NULL;

-- Extract summary from existing analyses
UPDATE analyses
SET summary = COALESCE(result->>'summary', result->>'verdict_explanation')
WHERE (result ? 'summary' OR result ? 'verdict_explanation')
  AND summary IS NULL;
