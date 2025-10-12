'use client';

import { useState, useRef, useEffect } from 'react';
import { quizQuestions } from '../data/quizData';
import ResultsAnalysis from './ResultsAnalysis';

interface AnswerRecord {
  questionId: number;
  answerText: string;
  isCorrect: boolean;
  correctnessLabel: 'Doğru' | 'Yanlış' | 'Kısmen Doğru';
  confidencePhoto?: string;
  photoUrl?: string;
  modelConfidencePercent?: number;
}

export default function Quiz() {
  const [currentQuestion, setCurrentQuestion] = useState(0);
  const [answerText, setAnswerText] = useState('');
  const [answers, setAnswers] = useState<AnswerRecord[]>([]);
  const [isQuizComplete, setIsQuizComplete] = useState(false);
  const [sessionId, setSessionId] = useState<string>('');

  // Camera state
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const [countdown, setCountdown] = useState<number | null>(null);
  const [isCapturing, setIsCapturing] = useState(false);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [cameraError, setCameraError] = useState<string | null>(null);

  // Captured photo state
  const [pendingPhoto, setPendingPhoto] = useState<{
    dataUrl: string;
    url?: string;
    confidenceScore?: number
  } | null>(null);

  // Session ID
  useEffect(() => {
    setSessionId(`quiz_${Date.now()}_${Math.random().toString(36).substring(2, 11)}`);
  }, []);

  // Quiz complete -> save results
  useEffect(() => {
    if (isQuizComplete && answers.length === quizQuestions.length) {
      saveQuizResults();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isQuizComplete]);

  // Start camera, countdown, capture, and analyze
  const startCamera = async () => {
    if (!answerText.trim()) {
      alert('Lütfen kamerayı başlatmadan önce yanıtınızı girin.');
      return;
    }

    if (isCapturing) return;

    setIsCapturing(true);
    setCameraError(null);
    setCountdown(null);

    let stream: MediaStream | null = null;

    try {
      // Start camera
      stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: 'user' }
      });

      if (videoRef.current) {
        videoRef.current.srcObject = stream;

        // Wait for video to load
        await new Promise<void>((resolve) => {
          if (videoRef.current) {
            videoRef.current.onloadedmetadata = () => {
              videoRef.current?.play();
              resolve();
            };
          }
        });

        // Wait for camera to stabilize
        await new Promise(resolve => setTimeout(resolve, 500));

        // 3 second countdown
        for (let i = 3; i > 0; i--) {
          setCountdown(i);
          await new Promise(resolve => setTimeout(resolve, 1000));
        }
        setCountdown(null);

        // Capture photo
        const canvas = canvasRef.current;
        const video = videoRef.current;
        const context = canvas?.getContext('2d');

        if (context && video && canvas) {
          canvas.width = video.videoWidth;
          canvas.height = video.videoHeight;
          context.drawImage(video, 0, 0);

          // Convert to data URL for display
          const dataUrl = canvas.toDataURL('image/jpeg', 0.95);

          // Convert to blob for API
          const blob = await new Promise<Blob | null>((resolve) => {
            canvas.toBlob((b) => resolve(b), 'image/jpeg', 0.95);
          });

          // Stop camera immediately
          stream.getTracks().forEach(track => track.stop());
          video.srcObject = null;

          // Save and analyze
          if (blob) {
            await saveAndAnalyzePhoto(blob, dataUrl);
          }
        }
      }
    } catch (error) {
      console.error('Kamera hatası:', error);
      setCameraError('Kameraya erişilemedi. Lütfen tarayıcı izinlerini kontrol edin.');
    } finally {
      // Ensure camera is stopped
      if (stream) {
        stream.getTracks().forEach(track => track.stop());
      }
      if (videoRef.current) {
        videoRef.current.srcObject = null;
      }
      setIsCapturing(false);
      setCountdown(null);
    }
  };

  // Save photo and analyze emotion in parallel
  
const saveAndAnalyzePhoto = async (imageBlob: Blob, dataUrl: string) => {
  setIsAnalyzing(true);

  try {
    // FormData'yı hazırla (save-photo için)
    const saveFormData = new FormData();
    saveFormData.append('image', imageBlob, 'capture.jpg');
    saveFormData.append('questionId', String(quizQuestions[currentQuestion]?.id ?? null));
    saveFormData.append('timestamp', String(Date.now()));
    saveFormData.append('sessionId', sessionId);
    saveFormData.append('captureMode', 'auto_after_delay');
    saveFormData.append('captureDelaySec', '3');

    // FormData'yı hazırla (analyze-emotion için)
    const analyzeFormData = new FormData();
    analyzeFormData.append('image', imageBlob, 'capture.jpg');

    // Paralel çağrı: Fotoğraf kaydet + Duygu analiz et
    const [saveRes, analyzeRes] = await Promise.all([
      fetch('/api/save-photo', {
        method: 'POST',
        body: saveFormData,
      }),
      fetch('/api/analyze-emotion', {
        method: 'POST',
        body: analyzeFormData,
      }),
    ]);

    // Save yanıtını işle
    let savedUrl: string | undefined = undefined;
    if (saveRes.ok) {
      try {
        const saveJson = await saveRes.json();
        console.log('Save response:', saveJson);
        
        if (saveJson.success && saveJson.data?.url) {
          savedUrl = saveJson.data.url;
        } else if (saveJson.url) { // Eski format uyumluluğu
          savedUrl = saveJson.url;
        }
      } catch (e) {
        console.warn('Failed to parse save response:', e);
      }
    } else {
      console.warn('Save API returned status:', saveRes.status);
    }

    // Analyze yanıtını işle
    let confidenceScore: number | undefined = undefined;
    if (analyzeRes.ok) {
      try {
        const analyzeJson = await analyzeRes.json();
        console.log('Analyze response:', analyzeJson);
        
        if (analyzeJson.success && analyzeJson.confidence_score) {
          confidenceScore = Math.round(Number(analyzeJson.confidence_score));
        } else if (analyzeJson.confidence_score) { // Doğrudan erişim
          confidenceScore = Math.round(Number(analyzeJson.confidence_score));
        } else if (analyzeJson.data?.confidence_score) {
          confidenceScore = Math.round(Number(analyzeJson.data.confidence_score));
        }
      } catch (e) {
        console.warn('Failed to parse analyze response:', e);
      }
    } else {
      console.warn('Analyze API returned status:', analyzeRes.status);
    }

    // Pending photo'yu ayarla
    setPendingPhoto({
      dataUrl: dataUrl,
      url: savedUrl,
      confidenceScore: typeof confidenceScore === 'number' ? confidenceScore : undefined,
    });

    // Başarı mesajı
    if (savedUrl && confidenceScore) {
      console.log(' Fotoğraf kaydedildi ve analiz tamamlandı');
    }

  } catch (error) {
    console.error('Error in saveAndAnalyzePhoto:', error);
    alert('Fotoğraf işlenirken hata oluştu. Lütfen tekrar deneyin.');
  } finally {
    setIsAnalyzing(false);
  }
};

  // Evaluate answer logic - checks against all acceptable answers
  const evaluateAnswer = (
    text: string,
    options: string[],
    correctAnswerIndices: number[]
  ): { isCorrect: boolean; label: 'Doğru' | 'Yanlış' | 'Kısmen Doğru' } => {
    const t = text.trim().toLowerCase();
    if (!t) return { isCorrect: false, label: 'Yanlış' };

    // Check for exact match with any correct option
    for (const idx of correctAnswerIndices) {
      const correctOption = options[idx].trim().toLowerCase();
      if (t === correctOption) {
        return { isCorrect: true, label: 'Doğru' };
      }
    }

    // Check for partial match (any correct option)
    for (const idx of correctAnswerIndices) {
      const correctOption = options[idx].trim().toLowerCase();
      const words = correctOption.split(/[^a-zA-ZçğıöşüÇĞİÖŞÜ0-9]+/).filter(Boolean);
      const significant = words.filter((w) => w.length > 3);
      const hits = significant.filter((w) => t.includes(w)).length;
      if (significant.length > 0 && hits >= Math.ceil(significant.length / 2)) {
        return { isCorrect: false, label: 'Kısmen Doğru' };
      }
    }

    return { isCorrect: false, label: 'Yanlış' };
  };

  // Submit answer
  const handleSubmit = async () => {
    if (!pendingPhoto) {
      alert('Lütfen önce kamerayı başlatın ve fotoğraf çekin.');
      return;
    }

    const question = quizQuestions[currentQuestion];
    const evalRes = evaluateAnswer(answerText, question.options, question.correctAnswer);

    const newRecord: AnswerRecord = {
      questionId: question.id,
      answerText,
      isCorrect: evalRes.isCorrect,
      correctnessLabel: evalRes.label,
      confidencePhoto: pendingPhoto?.dataUrl,
      photoUrl: pendingPhoto?.url,
      modelConfidencePercent: pendingPhoto?.confidenceScore ?? 50,
    };

    setAnswers((prev) => [...prev, newRecord]);
    setPendingPhoto(null);

    if (currentQuestion < quizQuestions.length - 1) {
      setCurrentQuestion((c) => c + 1);
      setAnswerText('');
    } else {
      setIsQuizComplete(true);
    }
  };

  const calculateScore = () => answers.filter((a) => a.isCorrect).length;

  const saveQuizResults = async () => {
    const score = calculateScore();
    const scorePercentage = (score / quizQuestions.length) * 100;

    const formattedAnswers = answers.map((answer, index) => {
      const question = quizQuestions[index];
      // Get the first correct answer text for display
      const correctAnswerText = question.options[question.correctAnswer[0]];

      return {
        questionId: answer.questionId,
        questionText: question.question,
        selectedAnswer: null,
        selectedAnswerText: answer.answerText,
        correctAnswer: question.correctAnswer,
        correctAnswerText: correctAnswerText,
        isCorrect: answer.isCorrect,
        photoUrl: answer.photoUrl,
        confidencePercentage: answer.modelConfidencePercent || 0,
        confidenceCaptureMode: 'auto_after_delay',
        confidenceCaptureDelaySec: 3,
      };
    });

    try {
      const response = await fetch('/api/save-quiz-results', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          sessionId,
          results: {
            totalQuestions: quizQuestions.length,
            correctAnswers: score,
            scorePercentage,
          },
          userId: (window as any).__APP_USER_ID__ || null,
          answers: formattedAnswers,
        }),
      });
      if (!response.ok) console.error('Failed to save quiz results');
    } catch (error) {
      console.error('Error saving quiz results:', error);
    }
  };

  // If quiz complete show results
  if (isQuizComplete) {
    return (
      <ResultsAnalysis
        answers={answers}
        questions={quizQuestions}
        onRestart={() => window.location.reload()}
      />
    );
  }

  const question = quizQuestions[currentQuestion];
  const progressPercent = ((currentQuestion + 1) / quizQuestions.length) * 100;

  return (
    <div className="max-w-3xl mx-auto p-6">
      <div className="mb-6">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-3">
            <span className="text-xl font-semibold">{question.topic}</span>
          </div>
          <div className="flex items-center gap-4">
            <span className="text-sm text-gray-600 dark:text-gray-400">
              Soru {currentQuestion + 1}/{quizQuestions.length}
            </span>
            <div className="w-8 h-8 rounded-full bg-gray-900 text-white flex items-center justify-center font-bold">
              M
            </div>
          </div>
        </div>
        <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2">
          <div
            className="bg-blue-600 h-2 rounded-full transition-all duration-300"
            style={{ width: `${progressPercent}%` }}
          />
        </div>
      </div>

      <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
        <h2 className="text-xl font-semibold mb-4">{question.question}</h2>

        <div className="flex flex-col md:flex-row gap-4">
          <div className="flex-1 order-2 md:order-1">
            <textarea
              value={answerText}
              onChange={(e) => setAnswerText(e.target.value)}
              placeholder="Cevabını buraya yaz..."
              className="w-full min-h-[140px] p-4 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white dark:bg-gray-900"
            />
          </div>

          <div className="md:w-64 w-full order-1 md:order-2">
            {/* Hidden video for capture */}
            <video
              ref={videoRef}
              autoPlay
              playsInline
              muted
              className={`w-full rounded-lg bg-black ${isCapturing && !countdown ? '' : 'hidden'}`}
            />

            {/* Hidden canvas for capture */}
            <canvas ref={canvasRef} className="hidden" />

            {/* Countdown overlay */}
            {countdown !== null && (
              <div className="w-full aspect-video rounded-lg bg-black flex items-center justify-center mb-3">
                <div className="text-white text-6xl font-bold animate-pulse">
                  {countdown}
                </div>
              </div>
            )}

            {/* Show captured photo */}
            {pendingPhoto && !isCapturing && (
              <div className="rounded-lg overflow-hidden mb-3 relative">
                <img
                  src={pendingPhoto.dataUrl}
                  alt="Çekilen fotoğraf"
                  className="w-full object-cover rounded-lg"
                />
              </div>
            )}

            {/* Placeholder when not capturing and no photo */}
            {!isCapturing && !pendingPhoto && (
              <button
                type="button"
                onClick={startCamera}
                disabled={!answerText.trim()}
                className={`w-full aspect-video rounded-lg flex items-center justify-center border border-dashed ${
                  answerText.trim()
                    ? 'bg-gray-100 dark:bg-gray-700 hover:border-blue-500 cursor-pointer'
                    : 'bg-gray-50 dark:bg-gray-800 border-gray-300 cursor-not-allowed opacity-50'
                }`}
              >
                <div className="text-center px-3">
                  <div className="mx-auto mb-2 w-10 h-10 rounded-full bg-blue-600 text-white flex items-center justify-center">
                    <svg xmlns="http://www.w3.org/2000/svg" fill="currentColor" viewBox="0 0 24 24" className="w-5 h-5">
                      <path d="M9 2a1 1 0 00-.894.553L7.382 4H5a3 3 0 00-3 3v9a3 3 0 003 3h14a3 3 0 003-3V7a3 3 0 00-3-3h-2.382l-.724-1.447A1 1 0 0015 2H9zm3 6a5 5 0 110 10 5 5 0 010-10z" />
                    </svg>
                  </div>
                  <p className="text-sm font-medium">Kamerayı başlatmak için tıklayın</p>
                  <p className="text-xs text-gray-600 dark:text-gray-300 mt-1">
                    Başladıktan sonra <strong>3 saniye</strong> içinde güven fotoğrafı çekilecektir.
                  </p>
                </div>
              </button>
            )}

            {/* Analyzing overlay */}
            {isAnalyzing && (
              <div className="w-full aspect-video rounded-lg bg-black/60 flex items-center justify-center mb-3">
                <div className="text-white text-center">
                  <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-white mx-auto mb-2"></div>
                  <p>Analiz ediliyor...</p>
                </div>
              </div>
            )}

            {/* Camera error */}
            {cameraError && (
              <div className="mt-2 p-2 bg-red-50 dark:bg-red-900/20 rounded text-xs text-red-800 dark:text-red-200">
                {cameraError}
              </div>
            )}

            {/* Success message */}
            {pendingPhoto && !isCapturing && !isAnalyzing && (
              <div className="mt-2 p-2 bg-green-50 dark:bg-green-900/20 rounded text-xs text-green-800 dark:text-green-200">
                Fotoğraf çekildi ✅ Güven skoru: {typeof pendingPhoto.confidenceScore === 'number' ? `${pendingPhoto.confidenceScore}%` : 'Analiz yapılamadı'}
              </div>
            )}
          </div>
        </div>

        <div className="mt-6">
          <button
            onClick={handleSubmit}
            disabled={!answerText.trim() || !pendingPhoto}
            className={`w-full font-semibold py-3 px-6 rounded-lg transition-colors ${
              (!answerText.trim() || !pendingPhoto)
                ? 'bg-gray-300 text-gray-600 cursor-not-allowed'
                : 'bg-blue-600 text-white hover:bg-blue-700'
            }`}
          >
            Yanıtı Gönder
          </button>
        </div>
      </div>
    </div>
  );
}
