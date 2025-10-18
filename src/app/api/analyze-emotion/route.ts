import { NextRequest, NextResponse } from 'next/server';
import { spawn, ChildProcess } from 'child_process';
import fs from 'fs';
import path from 'path';
import os from 'os';

// GLOBAL: Python prosesini canlı tut
let pythonProcess: ChildProcess | null = null;
let isProcessReady = false;
let pendingRequests: Array<{
  imagePath: string;
  resolve: (value: any) => void;
  reject: (reason: any) => void;
}> = [];

/**
 * Python prosesini başlat ve canlı tut
 */
function initPythonProcess() {
  if (pythonProcess) return;

  const scriptPath = path.join(process.cwd(), 'python', 'emotion_analyzer.py');
  
  console.log('🚀 Starting persistent Python process...');
  
  // Platforma göre uygun Python komutunu seç
  const isWindows = process.platform === 'win32';
  const envPython = process.env.PYTHON_EXECUTABLE; // Opsiyonel override
  const pythonCommand = envPython && envPython.trim().length > 0
    ? envPython
    : (isWindows ? 'py' : 'python3');
  const pythonArgs = (envPython && envPython.trim().length > 0)
    ? ['-u', scriptPath, '--server']
    : (isWindows ? ['-3', '-u', scriptPath, '--server'] : ['-u', scriptPath, '--server']);

  pythonProcess = spawn(pythonCommand, pythonArgs, {
    stdio: ['pipe', 'pipe', 'pipe']
  });

  let currentResponse = '';

  pythonProcess.stdout?.on('data', (data) => {
    const output = data.toString();
    
    // Model yüklenme mesajı
    if (output.includes('READY')) {
      isProcessReady = true;
      console.log('✅ Python process ready');
      return;
    }

    // JSON response topla
    currentResponse += output;

    // Tam JSON geldi mi kontrol et
    try {
      const parsed = JSON.parse(currentResponse);
      
      // İlk bekleyen isteği çöz
      const request = pendingRequests.shift();
      if (request) {
        request.resolve(parsed);
      }
      
      currentResponse = ''; // Sıfırla
    } catch (e) {
      // Henüz tam JSON değil, beklemeye devam
    }
  });

  pythonProcess.stderr?.on('data', (data) => {
    console.error('Python stderr:', data.toString());
  });

  pythonProcess.on('close', (code) => {
    console.log(`Python process closed with code ${code}`);
    pythonProcess = null;
    isProcessReady = false;
    
    // Bekleyen istekleri reddet
    pendingRequests.forEach(req => {
      req.reject(new Error('Python process died'));
    });
    pendingRequests = [];
  });

  pythonProcess.on('error', (err) => {
    console.error('Python process error:', err);
    pythonProcess = null;
    isProcessReady = false;
  });
}

/**
 * Python prosesine istek gönder
 */
function sendToPythonProcess(imagePath: string): Promise<any> {
  return new Promise((resolve, reject) => {
    // Proses yoksa başlat
    if (!pythonProcess) {
      initPythonProcess();
    }

    // Hazır olana kadar bekle
    const checkReady = setInterval(() => {
      if (isProcessReady) {
        clearInterval(checkReady);
        
        // İsteği kuyruğa ekle
        pendingRequests.push({ imagePath, resolve, reject });
        
        // Resim yolunu gönder
        pythonProcess?.stdin?.write(imagePath + '\n');
      }
    }, 100);

    // Timeout: 30 saniye
    setTimeout(() => {
      clearInterval(checkReady);
      reject(new Error('Python process timeout'));
    }, 30000);
  });
}

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData();
    const file = formData.get('image') as File;
    
    if (!file) {
      return NextResponse.json(
        { error: 'No image provided' },
        { status: 400 }
      );
    }

    const bytes = await file.arrayBuffer();
    const buffer = Buffer.from(bytes);
    
    // Geçici dosya oluştur
    const tempDir = os.tmpdir();
    const tempFilePath = path.join(tempDir, `emotion_${Date.now()}.jpg`);
    fs.writeFileSync(tempFilePath, buffer);
    
    // Persistent process kullan
    const result = await sendToPythonProcess(tempFilePath);
    
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

// Graceful shutdown
process.on('SIGTERM', () => {
  if (pythonProcess) {
    pythonProcess.kill();
  }
});

process.on('SIGINT', () => {
  if (pythonProcess) {
    pythonProcess.kill();
  }
});
