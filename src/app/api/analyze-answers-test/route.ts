import { NextRequest, NextResponse } from 'next/server';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

/**
 * Test endpoint - Python olmadan mock response döndürür
 */
export async function POST(req: NextRequest) {
  console.log('🧪🧪🧪 TEST ENDPOINT CALLED! 🧪🧪🧪');
  
  try {
    const body = await req.json();
    const { question, studentAnswer, correctAnswer } = body;

    console.log('✅ Test data received:', { 
      hasQuestion: !!question, 
      hasAnswer: !!studentAnswer, 
      hasCorrect: !!correctAnswer 
    });

    // Mock response
    const mockResponse = {
      success: true,
      models: {
        mbart: {
          label: "Test Label",
          label_code: 2,
          feedback: "Bu bir test feedback'i - mBART",
          confidence: 0.75
        },
        mt5: {
          label: "Test Label",
          label_code: 2,
          feedback: "Bu bir test feedback'i - MT5",
          confidence: 0.80
        },
        agent: {
          chosen_model: "mbart",
          label: "Test Label",
          feedback: "Bu bir test feedback'i - Agent",
          confidence: 0.85,
          reasoning: "Test reasoning"
        }
      },
      question,
      student_answer: studentAnswer,
      correct_answer: correctAnswer
    };

    console.log('✅ Returning mock response');
    return NextResponse.json(mockResponse);
    
  } catch (error: any) {
    console.error('❌ Test endpoint error:', error);
    return NextResponse.json(
      { success: false, error: error.message },
      { status: 500 }
    );
  }
}

export async function GET() {
  return NextResponse.json({ status: 'Test endpoint OK' });
}

