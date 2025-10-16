import { NextRequest, NextResponse } from 'next/server';

const SPACES_API = process.env.NEXT_PUBLIC_SPACES_API;

export async function POST(request: NextRequest) {
  try {
    if (!SPACES_API) {
      return NextResponse.json(
        { error: 'SPACES_API not configured' },
        { status: 500 }
      );
    }

    const formData = await request.formData();
    const file = formData.get('image') as File;
    
    if (!file) {
      return NextResponse.json(
        { error: 'No image provided' },
        { status: 400 }
      );
    }

    // Spaces'e gönder
    const spacesFormData = new FormData();
    spacesFormData.append('file', file);

    const response = await fetch(`${SPACES_API}/analyze`, {
      method: 'POST',
      body: spacesFormData,
      timeout: 120000 // 2 dakika
    });

    if (!response.ok) {
      const error = await response.text();
      console.error('Spaces error:', error);
      return NextResponse.json(
        { error: 'Spaces API error', details: error },
        { status: response.status }
      );
    }

    const result = await response.json();
    return NextResponse.json(result);

  } catch (error) {
    console.error('Error:', error);
    return NextResponse.json(
      { error: 'Failed to analyze emotion', details: String(error) },
      { status: 500 }
    );
  }
}
