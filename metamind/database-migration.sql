-- Database Migration Script
-- Run this in your Supabase SQL Editor to update existing tables

-- Add new columns to quiz_answers table
ALTER TABLE quiz_answers 
ADD COLUMN IF NOT EXISTS confidence_percentage INTEGER DEFAULT 0,
ADD COLUMN IF NOT EXISTS answer_type TEXT DEFAULT 'text' CHECK (answer_type IN ('text', 'multiple_choice'));

-- Make selected_answer nullable for text-based answers
ALTER TABLE quiz_answers 
ALTER COLUMN selected_answer DROP NOT NULL;

-- Update existing records to have default values
UPDATE quiz_answers 
SET confidence_percentage = 0, answer_type = 'text' 
WHERE confidence_percentage IS NULL OR answer_type IS NULL;

-- Create additional indexes for better performance
CREATE INDEX IF NOT EXISTS idx_quiz_answers_confidence ON quiz_answers(confidence_percentage);
CREATE INDEX IF NOT EXISTS idx_quiz_answers_type ON quiz_answers(answer_type);
CREATE INDEX IF NOT EXISTS idx_quiz_answers_correctness ON quiz_answers(is_correct);

-- Add comments for better documentation
COMMENT ON COLUMN quiz_answers.confidence_percentage IS 'User confidence level (0-100)';
COMMENT ON COLUMN quiz_answers.answer_type IS 'Type of answer: text or multiple_choice';
COMMENT ON COLUMN quiz_answers.selected_answer IS 'Selected option index (NULL for text answers)';
COMMENT ON COLUMN quiz_answers.selected_answer_text IS 'User provided text answer';
