-- Create quiz_results table
CREATE TABLE IF NOT EXISTS app_users (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW()),
  full_name TEXT NOT NULL,
  email TEXT,
  UNIQUE (email)
);

ALTER TABLE IF EXISTS quiz_results ADD COLUMN IF NOT EXISTS user_id UUID REFERENCES app_users(id);
ALTER TABLE IF EXISTS quiz_answers ADD COLUMN IF NOT EXISTS user_id UUID REFERENCES app_users(id);
CREATE TABLE quiz_results (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW()),
  quiz_session_id TEXT NOT NULL,
  total_questions INTEGER NOT NULL,
  correct_answers INTEGER NOT NULL,
  score_percentage DECIMAL(5,2) NOT NULL,
  completed_at TIMESTAMP WITH TIME ZONE NOT NULL
);

-- Create quiz_answers table
CREATE TABLE quiz_answers (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW()),
  quiz_session_id TEXT NOT NULL,
  question_id INTEGER NOT NULL,
  question_text TEXT NOT NULL,
  selected_answer INTEGER, -- Can be NULL for text-based answers
  selected_answer_text TEXT NOT NULL, -- Text response from user
  correct_answer INTEGER NOT NULL,
  correct_answer_text TEXT NOT NULL,
  is_correct BOOLEAN NOT NULL,
  confidence_photo_url TEXT,
  confidence_percentage INTEGER DEFAULT 0, -- User's confidence level
  confidence_capture_mode TEXT DEFAULT 'auto_after_delay' CHECK (confidence_capture_mode IN ('manual', 'auto_after_delay')),
  confidence_capture_delay_sec INTEGER DEFAULT 5,
  answer_type TEXT DEFAULT 'text' CHECK (answer_type IN ('text', 'multiple_choice'))
);

-- Create indexes for better query performance
CREATE INDEX idx_quiz_results_session ON quiz_results(quiz_session_id);
CREATE INDEX idx_quiz_answers_session ON quiz_answers(quiz_session_id);

-- Create storage bucket for confidence photos (run in Supabase dashboard)
-- INSERT INTO storage.buckets (id, name, public) VALUES ('confidence-photos', 'confidence-photos', true);

-- Storage Policies for confidence-photos bucket
-- Run these after creating the bucket:

-- Allow anonymous users to upload files
CREATE POLICY "Allow anonymous uploads" ON storage.objects
FOR INSERT TO anon
WITH CHECK (bucket_id = 'confidence-photos');

-- Allow anonymous users to view files
CREATE POLICY "Allow anonymous downloads" ON storage.objects
FOR SELECT TO anon
USING (bucket_id = 'confidence-photos');

-- If the above policies don't work, you can use these more permissive policies:
-- CREATE POLICY "Allow all uploads" ON storage.objects
-- FOR INSERT TO anon, authenticated
-- WITH CHECK (bucket_id = 'confidence-photos' AND true);

-- CREATE POLICY "Allow all downloads" ON storage.objects
-- FOR SELECT TO anon, authenticated
-- USING (bucket_id = 'confidence-photos' AND true);