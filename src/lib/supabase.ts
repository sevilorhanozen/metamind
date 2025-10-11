import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

export const supabase = createClient(supabaseUrl, supabaseAnonKey);

export type AppUser = {
  id?: string;
  created_at?: string;
  full_name: string;
  email?: string | null;
};

export type QuizResult = {
  id?: string;
  created_at?: string;
  quiz_session_id: string;
  total_questions: number;
  correct_answers: number;
  score_percentage: number;
  completed_at: string;
  user_id?: string | null;
};

export type QuizAnswer = {
  id?: string;
  created_at?: string;
  quiz_session_id: string;
  question_id: number;
  question_text: string;
  selected_answer?: number; // Can be null for text-based answers
  selected_answer_text: string;
  correct_answer: number;
  correct_answer_text: string;
  is_correct: boolean;
  confidence_photo_url?: string;
  confidence_percentage?: number;
  model_confidence_percent?: number;
  confidence_capture_mode?: 'manual' | 'auto_after_delay';
  confidence_capture_delay_sec?: number;
  answer_type?: 'text' | 'multiple_choice';
  user_id?: string | null;
};
