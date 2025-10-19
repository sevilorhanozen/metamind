import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';
import { QuizResult, QuizAnswer } from '@/lib/supabase';

export async function POST(request: NextRequest) {
  try {
    const data = await request.json();
    const { sessionId, results, answers, userId } = data;

    if (!sessionId || !results || !answers) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      );
    }

    // Save quiz results
    const quizResult: QuizResult = {
      quiz_session_id: sessionId,
      total_questions: results.totalQuestions,
      correct_answers: results.correctAnswers,
      score_percentage: results.scorePercentage,
      completed_at: new Date().toISOString(),
      user_id: userId || null
    };

    const { data: resultData, error: resultError } = await supabase
      .from('quiz_results')
      .insert([quizResult])
      .select();

    if (resultError) {
      console.error('Error saving quiz results:', resultError);
      return NextResponse.json(
        { error: 'Failed to save quiz results' },
        { status: 500 }
      );
    }

    // Save individual answers
    const quizAnswers: QuizAnswer[] = answers.map((answer: any) => ({
      quiz_session_id: sessionId,
      question_id: answer.questionId,
      question_text: answer.questionText,
      selected_answer: Array.isArray(answer.selectedAnswer) ? answer.selectedAnswer[0] : (answer.selectedAnswer || 0), // Default to 0 for text-based answers
      selected_answer_text: answer.selectedAnswerText,
      correct_answer: Array.isArray(answer.correctAnswer) ? answer.correctAnswer[0] : answer.correctAnswer,
      correct_answer_text: answer.correctAnswerText,
      is_correct: answer.isCorrect,
      confidence_photo_url: answer.photoUrl || null
    }));

    const { data: answersData, error: answersError } = await supabase
      .from('quiz_answers')
      .insert(quizAnswers)
      .select();

    if (answersError) {
      console.error('Error saving quiz answers:', answersError);
      return NextResponse.json(
        { error: 'Failed to save quiz answers' },
        { status: 500 }
      );
    }

    return NextResponse.json({ 
      success: true,
      resultId: resultData?.[0]?.id,
      message: 'Quiz results saved successfully'
    });
  } catch (error) {
    console.error('Error in save-quiz-results:', error);
    return NextResponse.json(
      { error: 'Failed to save quiz results' },
      { status: 500 }
    );
  }
}
