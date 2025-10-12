import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData();
    
    // Alanları al
    const image = formData.get('image') as File;
    const questionId = formData.get('questionId') as string;
    const timestamp = formData.get('timestamp') as string;
    const sessionId = formData.get('sessionId') as string;
    const captureMode = (formData.get('captureMode') as string) || 'manual';
    const captureDelaySec = (formData.get('captureDelaySec') as string) || '0';

    // Validasyon
    if (!image || !questionId || !timestamp || !sessionId) {
      return NextResponse.json(
        { 
          success: false,
          error: 'Missing required fields: image, questionId, timestamp, sessionId' 
        },
        { status: 400 }
      );
    }

    // Dosyayı buffer'a çevir
    const bytes = await image.arrayBuffer();
    const buffer = Buffer.from(bytes);

    // Dosya adı oluştur
    const meta = `mode-${captureMode}_delay-${captureDelaySec}s`;
    const filename = `${sessionId}/confidence_q${questionId}_${timestamp}_${meta}.jpg`;

    // Supabase Storage'a yükle
    const { error: uploadError } = await supabase.storage
      .from('confidence-photos')
      .upload(filename, buffer, {
        contentType: 'image/jpeg',
        cacheControl: '3600',
        upsert: false
      });

    if (uploadError) {
      console.error('Supabase upload error:', uploadError);
      return NextResponse.json(
        { 
          success: false,
          error: 'Failed to upload photo to storage',
          details: uploadError.message
        },
        { status: 500 }
      );
    }

    // Public URL'i al
    const { data: { publicUrl } } = supabase.storage
      .from('confidence-photos')
      .getPublicUrl(filename);

    // REST API Response
    return NextResponse.json({
      success: true,
      data: {
        filename,
        url: publicUrl
      }
    });

  } catch (error) {
    console.error('Save photo error:', error);
    return NextResponse.json(
      { 
        success: false,
        error: error instanceof Error ? error.message : 'Failed to save photo'
      },
      { status: 500 }
    );
  }
}
