-- Dad's Workout Magazine Database Schema
-- Run this in Supabase SQL Editor

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Issues table (main digest records)
CREATE TABLE IF NOT EXISTS issues (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  issue_number INTEGER NOT NULL UNIQUE,
  week_number INTEGER NOT NULL,
  year INTEGER NOT NULL,
  title VARCHAR(255) NOT NULL,
  slug VARCHAR(255) NOT NULL UNIQUE,
  editors_letter TEXT NOT NULL,
  gear_corner JSONB NOT NULL DEFAULT '{}',
  challenge_update TEXT,
  status VARCHAR(50) DEFAULT 'draft',
  published_at TIMESTAMPTZ,
  email_sent_at TIMESTAMPTZ,
  email_recipient_count INTEGER DEFAULT 0,
  pdf_url VARCHAR(500),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),

  CONSTRAINT valid_status CHECK (status IN ('draft', 'scheduled', 'published', 'archived'))
);

-- Articles table
CREATE TABLE IF NOT EXISTS articles (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  issue_id UUID NOT NULL REFERENCES issues(id) ON DELETE CASCADE,
  author_id VARCHAR(100) NOT NULL,
  author_name VARCHAR(255) NOT NULL,
  author_title VARCHAR(255),
  title VARCHAR(500) NOT NULL,
  slug VARCHAR(500) NOT NULL,
  content TEXT NOT NULL,
  excerpt TEXT,
  word_count INTEGER NOT NULL,
  article_type VARCHAR(50) NOT NULL,
  position INTEGER NOT NULL,
  topics TEXT[] DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT NOW(),

  CONSTRAINT valid_article_type CHECK (article_type IN ('main_column', 'wildcard', 'guest')),
  UNIQUE(issue_id, slug)
);

-- Quick Wins table
CREATE TABLE IF NOT EXISTS quick_wins (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  issue_id UUID NOT NULL REFERENCES issues(id) ON DELETE CASCADE,
  title VARCHAR(255) NOT NULL,
  content TEXT NOT NULL,
  category VARCHAR(50) NOT NULL,
  position INTEGER NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),

  CONSTRAINT valid_category CHECK (category IN ('workout', 'nutrition', 'mindset', 'recovery', 'lifestyle'))
);

-- Reader Q&A table
CREATE TABLE IF NOT EXISTS reader_qa (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  issue_id UUID NOT NULL REFERENCES issues(id) ON DELETE CASCADE,
  question TEXT NOT NULL,
  answer TEXT NOT NULL,
  answering_expert VARCHAR(255),
  position INTEGER NOT NULL,
  submitted_by VARCHAR(255),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Subscribers table
CREATE TABLE IF NOT EXISTS subscribers (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  email VARCHAR(255) NOT NULL UNIQUE,
  name VARCHAR(255),
  status VARCHAR(50) DEFAULT 'active',
  subscribed_at TIMESTAMPTZ DEFAULT NOW(),
  unsubscribed_at TIMESTAMPTZ,
  preferences JSONB DEFAULT '{}',

  CONSTRAINT valid_subscriber_status CHECK (status IN ('active', 'unsubscribed', 'bounced', 'complained'))
);

-- Topics table for rotation tracking
CREATE TABLE IF NOT EXISTS topics (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  topic_name VARCHAR(255) NOT NULL,
  category VARCHAR(100) NOT NULL,
  last_used_at TIMESTAMPTZ,
  usage_count INTEGER DEFAULT 0,
  cooldown_weeks INTEGER DEFAULT 8,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Topic usage history
CREATE TABLE IF NOT EXISTS topic_usage (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  topic_id UUID NOT NULL REFERENCES topics(id),
  issue_id UUID NOT NULL REFERENCES issues(id),
  article_id UUID REFERENCES articles(id),
  author_id VARCHAR(100),
  used_at TIMESTAMPTZ DEFAULT NOW(),

  UNIQUE(topic_id, issue_id)
);

-- Monthly challenges
CREATE TABLE IF NOT EXISTS monthly_challenges (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  title VARCHAR(255) NOT NULL,
  description TEXT NOT NULL,
  month INTEGER NOT NULL,
  year INTEGER NOT NULL,
  difficulty VARCHAR(50) DEFAULT 'intermediate',
  category VARCHAR(100) NOT NULL,
  weekly_milestones JSONB NOT NULL DEFAULT '[]',
  tips TEXT[],
  is_active BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMPTZ DEFAULT NOW(),

  CONSTRAINT valid_difficulty CHECK (difficulty IN ('beginner', 'intermediate', 'advanced')),
  UNIQUE(month, year)
);

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_issues_status ON issues(status);
CREATE INDEX IF NOT EXISTS idx_issues_published_at ON issues(published_at DESC);
CREATE INDEX IF NOT EXISTS idx_articles_issue_id ON articles(issue_id);
CREATE INDEX IF NOT EXISTS idx_articles_author_id ON articles(author_id);
CREATE INDEX IF NOT EXISTS idx_articles_topics ON articles USING GIN(topics);
CREATE INDEX IF NOT EXISTS idx_subscribers_status ON subscribers(status);
CREATE INDEX IF NOT EXISTS idx_subscribers_email ON subscribers(email);
CREATE INDEX IF NOT EXISTS idx_topics_category ON topics(category);
CREATE INDEX IF NOT EXISTS idx_topics_last_used ON topics(last_used_at);

-- Updated_at trigger function
CREATE OR REPLACE FUNCTION update_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Apply trigger to issues table
DROP TRIGGER IF EXISTS issues_updated_at ON issues;
CREATE TRIGGER issues_updated_at
  BEFORE UPDATE ON issues
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at();

-- Seed initial subscriber (beta tester)
INSERT INTO subscribers (email, name, status)
VALUES ('youearndit@gmail.com', 'Beta Tester', 'active')
ON CONFLICT (email) DO NOTHING;

-- Seed initial topics
INSERT INTO topics (topic_name, category, cooldown_weeks) VALUES
  ('Progressive Overload Basics', 'training', 12),
  ('Sleep and Recovery', 'recovery', 8),
  ('Protein Timing and Requirements', 'nutrition', 10),
  ('Gym Anxiety and Confidence', 'mental', 8),
  ('Lower Back Pain Prevention', 'injury', 6),
  ('Home Workout Setup', 'equipment', 12),
  ('Meal Prep Strategies', 'nutrition', 8),
  ('Motivation After Setbacks', 'mental', 8),
  ('Knee Health for Active Dads', 'injury', 8),
  ('Time-Efficient Training', 'training', 6),
  ('Hydration Strategies', 'nutrition', 10),
  ('Shoulder Mobility', 'mobility', 8),
  ('Building Consistency', 'mental', 8),
  ('Compound Movements', 'training', 10),
  ('Pre-Workout Nutrition', 'nutrition', 8),
  ('Stress Management', 'mental', 8),
  ('Core Strength Fundamentals', 'training', 10),
  ('Joint Health After 40', 'injury', 8),
  ('Quick Healthy Meals', 'nutrition', 6),
  ('Morning vs Evening Workouts', 'training', 10)
ON CONFLICT DO NOTHING;

-- Seed first monthly challenge (January 2025)
INSERT INTO monthly_challenges (title, description, month, year, difficulty, category, weekly_milestones, tips, is_active)
VALUES (
  '30-Day Core Strength Challenge',
  'Build a stronger, more stable core with just 10 minutes a day. Perfect for busy dads who want real results without spending hours at the gym.',
  1, 2025,
  'beginner',
  'training',
  '[
    {"week": 1, "focus": "Foundation", "goal": "3 sets of planks, 30 seconds each, 4 days this week"},
    {"week": 2, "focus": "Build", "goal": "Add dead bugs and bird dogs, 5 days this week"},
    {"week": 3, "focus": "Challenge", "goal": "Increase plank time to 45 seconds, add side planks"},
    {"week": 4, "focus": "Maintain", "goal": "Full routine every day, test 1-minute plank"}
  ]'::jsonb,
  ARRAY[
    'Do your core work first thing in the morning before excuses kick in',
    'Your kids can join in - make it a family challenge',
    'Quality over quantity - focus on engaging your core, not just surviving',
    'Breathe! Holding your breath makes it harder'
  ],
  true
)
ON CONFLICT (month, year) DO UPDATE SET is_active = true;
