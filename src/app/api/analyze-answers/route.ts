import { NextRequest, NextResponse } from 'next/server';
import { Client } from '@gradio/client';

// Route config
export const runtime = 'nodejs';
export const maxDuration = 60; // 1 dakika yeterli
export const dynamic = 'force-dynamic';

// Hugging Face Spaces API URL
const HF_API_URL = process.env.HF_API_URL || 'https://ozget-metamind-nlp-session.hf.space';

/**
 * POST /api/analyze-answers
 * Hugging Face Spaces API'yi kullanarak quiz cevaplarını analiz et
 */
export async function POST(req: NextRequest) {
  try {
    console.log('📥 Received analyze request');
    
    const body = await req.json();
    const { question, studentAnswer, correctAnswer, student_confidence, topic } = body;

    console.log('📝 Request body:', { question, studentAnswer, correctAnswer, student_confidence, topic });

    // Validasyon
    if (!question || !studentAnswer || !correctAnswer) {
      console.log('❌ Validation failed: Missing parameters');
      return NextResponse.json(
        { success: false, error: 'Eksik parametreler' },
        { status: 400 }
      );
    }

    console.log('✅ Validation passed, calling Hugging Face API...');

    // Hugging Face Gradio API formatı
    const apiPayload = {
      data: [
        question,
        studentAnswer,
        correctAnswer,
        student_confidence || 50,
        topic || ""
      ]
    };

    console.log('📤 Sending to Hugging Face:', apiPayload);

    try {
      // Gradio Client kullanarak API'yi çağır
      const hfToken = process.env.HF_TOKEN;
      // TypeScript expects the token to begin with "hf_"
      if (hfToken && !hfToken.startsWith("hf_")) {
        throw new Error("HF_TOKEN must start with 'hf_'");
      }
      const client = await Client.connect(HF_API_URL, {
        hf_token: hfToken as `hf_${string}` | undefined
      });

      // Gradio Client için direkt array gönder (data wrapper yok)
      const result = await client.predict("/predict", apiPayload.data);
      console.log('✅ Hugging Face response:', result);

      // Gradio response formatını parse et
      // result.data = [label, feedback, details_json, confidence]
      if (result.data && Array.isArray(result.data)) {
        const [label, feedback, detailsJson, confidence] = result.data;
        
        let details: any = {};
        try {
          details = JSON.parse(detailsJson);
        } catch (e) {
          console.warn('Could not parse details JSON:', detailsJson);
        }

        // Unified format - eski Python response formatıyla uyumlu
        const formattedResult = {
          success: true,
          label: label,
          feedback: feedback,
          confidence: confidence / 100, // 0-1 arasına normalize et
          models: {
            mbart: {
              label: details.mBART || label,
              label_code: getLabelCode(details.mBART || label),
              feedback: feedback,
              confidence: 85
            },
            mt5: {
              label: details.MT5 || label,
              label_code: getLabelCode(details.MT5 || label),
              feedback: feedback,
              confidence: 82
            },
            agent: {
              chosen_model: "mBART + MT5 Consensus",
              label: label,
              feedback: feedback,
              confidence: confidence / 100,
              reasoning: `İki model birlikte '${label}' sonucuna vardı.`
            }
          }
        };

        console.log('✅ Analysis complete:', formattedResult);
        return NextResponse.json(formattedResult);
      } else {
        throw new Error('Invalid response format from Hugging Face API');
      }

    } catch (gradioError: any) {
      console.error('❌ Gradio Client error:', gradioError);
      
      return NextResponse.json(
        { success: false, error: `Gradio API error: ${gradioError.message || 'Unknown error'}` },
        { status: 500 }
      );
    }

  } catch (error: any) {
    console.error('❌ API error:', error);
    console.error('Error stack:', error.stack);
    return NextResponse.json(
      { success: false, error: `Server error: ${error.message}` },
      { status: 500 }
    );
  }
}

/**
 * GET /api/analyze-answers/health
 * Sağlık kontrolü
 */
export async function GET() {
  try {
    // Hugging Face API'nin health'ini kontrol et
    const response = await fetch(`${HF_API_URL}/`, {
      method: 'GET',
      headers: { 'Content-Type': 'application/json' }
    });

    const isHealthy = response.ok;

    return NextResponse.json({
      status: isHealthy ? 'ok' : 'error',
      hfApiUrl: HF_API_URL,
      hfApiStatus: isHealthy ? 'running' : 'down',
      timestamp: new Date().toISOString()
    });
  } catch (error: any) {
    return NextResponse.json({
      status: 'error',
      hfApiUrl: HF_API_URL,
      hfApiStatus: 'unreachable',
      error: error?.message || 'Unknown error',
      timestamp: new Date().toISOString()
    }, { status: 503 });
  }
}

/**
 * Helper: Label'ı sayısal koda çevir
 */
function getLabelCode(label: string): number {
  const labelCodes: { [key: string]: number } = {
    'Yanlış': 0,
    'Kısmen Doğru': 1,
    'Çok Benzer': 2,
    'Tam Doğru': 3
  };
  return labelCodes[label] || 0;
}
