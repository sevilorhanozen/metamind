import { NextRequest, NextResponse } from 'next/server';
import { spawn } from 'child_process';
import fs from 'fs';
import path from 'path';
import os from 'os';

export async function POST(request: NextRequest) {
  try {
    // ❌ const data = await request.json();
    // ❌ const { image } = data;
    
    // ✅ FormData kullan
    const formData = await request.formData();
    const file = formData.get('image') as File;
    
    if (!file) {
      return NextResponse.json(
        { error: 'No image provided' },
        { status: 400 }
      );
    }

    // ❌ Base64'ten buffer'a çevirme gereksiz
    // ✅ Doğrudan file'dan buffer
    const bytes = await file.arrayBuffer();
    const buffer = Buffer.from(bytes);

    // Geçici dosya oluştur
    const tempDir = os.tmpdir();
    const tempFilePath = path.join(tempDir, `emotion_${Date.now()}.jpg`);
    fs.writeFileSync(tempFilePath, buffer);

    // Python scriptini çalıştır
    const pythonScript = path.join(process.cwd(), 'python', 'emotion_analyzer.py');
    
    const result = await runPythonScript(pythonScript, tempFilePath);

    // Geçici dosyayı sil
    fs.unlinkSync(tempFilePath);

    return NextResponse.json({
      success: true,
      ...result
    });

  } catch (error) {
    console.error('Error analyzing emotion:', error);
    return NextResponse.json(
      { error: 'Failed to analyze emotion' },
      { status: 500 }
    );
  }
}

function runPythonScript(scriptPath: string, imagePath: string): Promise<any> {
  return new Promise((resolve, reject) => {
    const python = spawn('python3', [scriptPath, imagePath]);
    
    let dataString = '';
    let errorString = '';

    python.stdout.on('data', (data) => {
      dataString += data.toString();
    });

    python.stderr.on('data', (data) => {
      errorString += data.toString();
    });

    python.on('close', (code) => {
      if (code !== 0) {
        reject(new Error(`Python script exited with code ${code}: ${errorString}`));
        return;
      }
      
      try {
        const result = JSON.parse(dataString);
        resolve(result);
      } catch (e) {
        reject(new Error(`Failed to parse Python output: ${dataString}`));
      }
    });
  });
}
