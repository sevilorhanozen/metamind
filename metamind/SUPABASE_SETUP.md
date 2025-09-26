# Supabase Setup Instructions

Follow these steps to set up Supabase for the Quiz Application:

## 1. Create a Supabase Project

1. Go to [https://supabase.com](https://supabase.com)
2. Sign up or log in to your account
3. Click "New Project"
4. Fill in the project details:
   - Project name: `quiz-confidence-app` (or your preferred name)
   - Database Password: Choose a strong password
   - Region: Select the closest region to you
5. Click "Create new project"

## 2. Get Your API Keys

1. Once your project is created, go to Settings → API
2. Copy the following values:
   - `Project URL` → This is your `NEXT_PUBLIC_SUPABASE_URL`
   - `anon public` key → This is your `NEXT_PUBLIC_SUPABASE_ANON_KEY`

## 3. Create Environment Variables

1. Create a `.env.local` file in your project root
2. Add the following (replace with your actual values):

```env
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key-here
```

## 4. Set Up Database Tables

1. Go to the SQL Editor in your Supabase dashboard
2. Copy and paste the contents of `supabase-schema.sql`
3. Click "Run" to create the tables

## 5. Create Storage Bucket

1. Go to Storage in your Supabase dashboard
2. Click "Create a new bucket"
3. Name it `confidence-photos`
4. Check "Public bucket" (for easier access to photos)
5. Click "Create bucket"

## 6. Configure Storage Policies (Optional)

If you want to restrict uploads:

1. Go to Storage → Policies
2. Click "New Policy" for the `confidence-photos` bucket
3. Create an INSERT policy:
   - Name: `Allow anonymous uploads`
   - Target roles: `anon`
   - WITH CHECK expression: `true`

## 7. Test the Application

1. Run `npm run dev`
2. Complete a quiz
3. Check your Supabase dashboard:
   - Database → Table Editor → Check `quiz_results` and `quiz_answers` tables
   - Storage → `confidence-photos` bucket → Check uploaded photos

## Troubleshooting

- **Photos not uploading**: Check that the storage bucket is created and public
- **Database errors**: Ensure all tables are created correctly
- **Connection errors**: Verify your environment variables are set correctly

## Data Structure

### Quiz Results Table
- Stores overall quiz performance
- Links to individual answers via `quiz_session_id`

### Quiz Answers Table
- Stores each answer with confidence photo URL and percentage
- Supports both text-based and multiple choice answers
- Includes confidence tracking and answer type classification
- Fields: question_id, selected_answer_text, confidence_percentage, answer_type

### Storage Structure
- Photos organized by session: `{sessionId}/confidence_q{questionId}_{timestamp}.jpg`
- Public URLs accessible directly from the browser