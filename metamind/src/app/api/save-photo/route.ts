import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';

export async function POST(request: NextRequest) {
  try {
    const data = await request.json();
    const { image, questionId, timestamp, sessionId, captureMode, captureDelaySec } = data;

    if (!image || !questionId || !sessionId) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      );
    }

    // Remove data:image/jpeg;base64, from the beginning of the string
    const base64Data = image.replace(/^data:image\/\w+;base64,/, '');
    const buffer = Buffer.from(base64Data, 'base64');

    // Create a unique filename
    const meta = `mode-${captureMode || 'manual'}_delay-${captureDelaySec ?? 0}s`;
    const filename = `${sessionId}/confidence_q${questionId}_${timestamp}_${meta}.jpg`;
    
    // Upload to Supabase Storage
    const { error: uploadError } = await supabase.storage
      .from('confidence-photos')
      .upload(filename, buffer, {
        contentType: 'image/jpeg',
        cacheControl: '3600',
        upsert: false
      });

    if (uploadError) {
      console.error('Error uploading to Supabase:', uploadError);
      return NextResponse.json(
        { error: 'Failed to upload photo' },
        { status: 500 }
      );
    }

    // Get the public URL
    const { data: { publicUrl } } = supabase.storage
      .from('confidence-photos')
      .getPublicUrl(filename);

    return NextResponse.json({ 
      success: true, 
      filename,
      url: publicUrl 
    });
  } catch (error) {
    console.error('Error saving photo:', error);
    return NextResponse.json(
      { error: 'Failed to save photo' },
      { status: 500 }
    );
  }
}