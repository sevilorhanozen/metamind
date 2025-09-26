'use client';

import { useState, useRef, useCallback, useEffect } from 'react';
import { quizQuestions } from '../data/quizData';
import Webcam from 'react-webcam';

interface AnswerRecord {
  questionId: number;
  answerText: string;
  isCorrect: boolean;
  correctnessLabel: 'Doğru' | 'Yanlış' | 'Kısmen Doğru';
  confidencePhoto?: string;
  photoUrl?: string;
  modelConfidencePercent?: number; // placeholder for future model output
}

const TOPIC_NAME = 'Su Döngüsü';

export default function Quiz() {
  const [currentQuestion, setCurrentQuestion] = useState(0);
  const [answerText, setAnswerText] = useState('');
  const [answers, setAnswers] = useState<AnswerRecord[]>([]);
  const [showCamera, setShowCamera] = useState(false);
  const [isQuizComplete, setIsQuizComplete] = useState(false);
  const [sessionId, setSessionId] = useState<string>('');
  const webcamRef = useRef<Webcam>(null);
  const autoCaptureTimer = useRef<number | null>(null);
  const countdownInterval = useRef<number | null>(null);
  const [countdownSec, setCountdownSec] = useState<number | null>(null);
  const lightCheckInterval = useRef<number | null>(null);
  const [isLowLight, setIsLowLight] = useState(false);
  const analysisCanvasRef = useRef<HTMLCanvasElement | null>(null);
  const [videoStream, setVideoStream] = useState<MediaStream | null>(null);

  const videoConstraints = {
    facingMode: 'user' as const,
    width: { ideal: 1280 },
    height: { ideal: 720 },
    frameRate: { ideal: 30, max: 30 }
  };

  useEffect(() => {
    setSessionId(`quiz_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`);
  }, []);

  useEffect(() => {
    if (isQuizComplete && answers.length === quizQuestions.length) {
      saveQuizResults();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isQuizComplete]);

  const stopCamera = () => {
    if (autoCaptureTimer.current) {
      window.clearTimeout(autoCaptureTimer.current);
      autoCaptureTimer.current = null;
    }
    if (countdownInterval.current) {
      window.clearInterval(countdownInterval.current);
      countdownInterval.current = null;
    }
    if (lightCheckInterval.current) {
      window.clearInterval(lightCheckInterval.current);
      lightCheckInterval.current = null;
    }
    setIsLowLight(false);
    setCountdownSec(null);
    setShowCamera(false);
  };

  const startCamera = () => {
    if (!answerText.trim()) {
      alert('Lütfen kamerayı başlatmadan önce yanıtınızı girin.');
      return;
    }
    setShowCamera(true);
    if (autoCaptureTimer.current) {
      window.clearTimeout(autoCaptureTimer.current);
    }
    // initialize countdown
    setCountdownSec(5);
    if (countdownInterval.current) {
      window.clearInterval(countdownInterval.current);
    }
    countdownInterval.current = window.setInterval(() => {
      setCountdownSec(prev => {
        if (prev === null) return null;
        if (prev <= 1) {
          if (countdownInterval.current) {
            window.clearInterval(countdownInterval.current);
            countdownInterval.current = null;
          }
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
    autoCaptureTimer.current = window.setTimeout(() => {
      capturePhoto();
    }, 5000);

    // start low-light monitoring
    if (lightCheckInterval.current) {
      window.clearInterval(lightCheckInterval.current);
    }
    lightCheckInterval.current = window.setInterval(() => {
      try {
        const videoEl: HTMLVideoElement | null = (webcamRef.current as any)?.video || null;
        if (!videoEl) return;
        const canvas = analysisCanvasRef.current || document.createElement('canvas');
        analysisCanvasRef.current = canvas;
        const targetW = 160;
        const targetH = 90;
        canvas.width = targetW;
        canvas.height = targetH;
        const ctx = canvas.getContext('2d');
        if (!ctx) return;
        ctx.drawImage(videoEl, 0, 0, targetW, targetH);
        const img = ctx.getImageData(0, 0, targetW, targetH).data;
        let sum = 0;
        for (let i = 0; i < img.length; i += 4) {
          const r = img[i];
          const g = img[i + 1];
          const b = img[i + 2];
          const y = 0.2126 * r + 0.7152 * g + 0.0722 * b;
          sum += y;
        }
        const avg = sum / (targetW * targetH);
        setIsLowLight(avg < 60);
      } catch (e) {
        // ignore sampling errors
      }
    }, 1000);
  };

  const capturePhoto = useCallback(async () => {
    if (!webcamRef.current) return;
    const photoData = webcamRef.current.getScreenshot();
    if (!photoData) return;
    try {
      const response = await fetch('/api/save-photo', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          image: photoData,
          questionId: quizQuestions[currentQuestion].id,
          timestamp: Date.now(),
          sessionId: sessionId,
          captureMode: 'auto_after_delay',
          captureDelaySec: 5
        })
      });
      const result = await response.json();
      // Attach photo to the last tentative answer if exists; otherwise, store for current
      setAnswers(prev => {
        const next = [...prev];
        // No tentative answer yet; just return prev and keep camera open for submit
        if (next.length !== currentQuestion) return next;
        return next;
      });
      stopCamera();
      // Keep photo in a transient place by adding to a shadow record when we actually submit
      setPendingPhoto({ dataUrl: photoData, url: result.url });
    } catch (error) {
      console.error('Error saving photo:', error);
      alert('Fotoğraf kaydedilemedi, lütfen tekrar deneyin.');
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentQuestion]);

  const [pendingPhoto, setPendingPhoto] = useState<{ dataUrl: string; url?: string } | null>(null);

  useEffect(() => {
    return () => {
      // cleanup on unmount
      if (autoCaptureTimer.current) {
        window.clearTimeout(autoCaptureTimer.current);
      }
      if (countdownInterval.current) {
        window.clearInterval(countdownInterval.current);
      }
      if (lightCheckInterval.current) {
        window.clearInterval(lightCheckInterval.current);
      }
    };
  }, []);

  const handleUserMedia = (stream: MediaStream) => {
    setVideoStream(stream);
    try {
      const track = stream.getVideoTracks()[0];
      track.applyConstraints({ advanced: [{ exposureMode: 'continuous' as any, focusMode: 'continuous' as any }] });
    } catch {
      // ignore if unsupported
    }
  };

  const evaluateAnswer = (text: string, correctOption: string): { isCorrect: boolean; label: 'Doğru' | 'Yanlış' | 'Kısmen Doğru' } => {
    const t = text.trim().toLowerCase();
    const c = correctOption.trim().toLowerCase();
    if (!t) return { isCorrect: false, label: 'Yanlış' };
    if (t === c) return { isCorrect: true, label: 'Doğru' };
    // partial credit: contains at least half of significant words
    const words = c.split(/[^a-zA-ZçğıöşüÇĞİÖŞÜ0-9]+/).filter(Boolean);
    const significant = words.filter(w => w.length > 3);
    const hits = significant.filter(w => t.includes(w)).length;
    if (significant.length > 0 && hits >= Math.ceil(significant.length / 2)) {
      return { isCorrect: false, label: 'Kısmen Doğru' };
    }
    return { isCorrect: false, label: 'Yanlış' };
  };

  const handleSubmit = async () => {
    const question = quizQuestions[currentQuestion];
    const correctOption = question.options[question.correctAnswer];
    const evalRes = evaluateAnswer(answerText, correctOption);

    const newRecord: AnswerRecord = {
      questionId: question.id,
      answerText,
      isCorrect: evalRes.isCorrect,
      correctnessLabel: evalRes.label,
      confidencePhoto: pendingPhoto?.dataUrl,
      photoUrl: pendingPhoto?.url,
      modelConfidencePercent: pendingPhoto ? 85 : 55
    };

    setAnswers(prev => [...prev, newRecord]);
    setPendingPhoto(null);
    stopCamera();

    if (currentQuestion < quizQuestions.length - 1) {
      setCurrentQuestion(currentQuestion + 1);
      setAnswerText('');
    } else {
      setIsQuizComplete(true);
    }
  };

  const calculateScore = () => answers.filter(a => a.isCorrect).length;

  const saveQuizResults = async () => {
    const score = calculateScore();
    const scorePercentage = (score / quizQuestions.length) * 100;

    const formattedAnswers = answers.map((answer, index) => ({
      questionId: answer.questionId,
      questionText: quizQuestions[index].question,
      selectedAnswer: null, // Text-based answers don't have a selected option index
      selectedAnswerText: answer.answerText,
      correctAnswer: quizQuestions[index].correctAnswer,
      correctAnswerText: quizQuestions[index].options[quizQuestions[index].correctAnswer],
      isCorrect: answer.isCorrect,
      photoUrl: answer.photoUrl,
      confidencePercentage: answer.modelConfidencePercent || 0,
      confidenceCaptureMode: 'auto_after_delay',
      confidenceCaptureDelaySec: 5
    }));

    try {
      const response = await fetch('/api/save-quiz-results', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          sessionId: sessionId,
          results: {
            totalQuestions: quizQuestions.length,
            correctAnswers: score,
            scorePercentage: scorePercentage
          },
          userId: (window as any).__APP_USER_ID__ || null,
          answers: formattedAnswers
        })
      });
      if (!response.ok) {
        console.error('Failed to save quiz results');
      }
    } catch (error) {
      console.error('Error saving quiz results:', error);
    }
  };

  // SUMMARY SCREEN
  if (isQuizComplete) {
    const score = calculateScore();
    const total = quizQuestions.length;
    const incorrect = answers.filter(a => !a.isCorrect);
    const tookPhotoIncorrect = incorrect.filter(a => a.confidencePhoto);
    const overconfidentLike = tookPhotoIncorrect; // heuristic grouping
    const lowconfidentLike = incorrect.filter(a => !a.confidencePhoto);
    const conceptKeywords = Array.from(new Set(lowconfidentLike.map((a, idx) => quizQuestions[idx].options[quizQuestions[idx].correctAnswer]))).slice(0, 6);

    const summaryText = score <= total / 2
      ? 'Bu alıştırmada bazı zorlandığın noktalar oldu. Endişelenme; bu hatalar öğrenmenin en değerli anlarıdır.'
      : 'Genel olarak iyi iş çıkardın. Birkaç küçük noktayı güçlendirmen yeterli olacak.';

    return (
      <div className="max-w-5xl mx-auto p-6">
        <header className="mb-6">
          <h1 className="text-3xl font-bold">Konu Değerlendirme Raporu</h1>
        </header>

        <section className="bg-white dark:bg-gray-800 rounded-lg shadow p-6 mb-6">
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
            <div>
              <p className="text-xl font-semibold">Toplam Skor</p>
              <p className="text-2xl font-bold mt-1">{score} / {total} doğru</p>
            </div>
            <div className="w-full md:w-1/2">
              <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-3">
                <div className="bg-green-600 h-3 rounded-full transition-all" style={{ width: `${(score / total) * 100}%` }} />
              </div>
            </div>
          </div>
          <p className="mt-4 text-gray-700 dark:text-gray-300">{summaryText}</p>
        </section>

        <section className="mb-8">
          <h2 className="text-xl font-semibold mb-3">Detaylı Analiz</h2>
          {!!overconfidentLike.length && (
            <div className="mb-6">
              <h3 className="font-semibold text-red-600 mb-2">Aşırı Güvenli Hatalar</h3>
              <div className="grid md:grid-cols-2 gap-4">
                {overconfidentLike.map((a, i) => {
                  const idx = answers.indexOf(a);
                  const q = quizQuestions[idx];
                  return (
                    <div key={`over-${a.questionId}`} className="bg-white dark:bg-gray-800 rounded-lg shadow p-4">
                      <p className="font-medium mb-2">Soru: {q.question}</p>
                      <p className="text-sm mb-1">Öğrenci Cevabı: {a.answerText || '—'}</p>
                      <div className="flex items-center gap-2 text-sm">
                        <span className="px-2 py-0.5 rounded bg-red-100 text-red-700">{a.correctnessLabel}</span>
                        <span className="text-gray-600">Güven: {a.modelConfidencePercent ?? 85}%</span>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}
          {!!lowconfidentLike.length && (
            <div className="mb-6">
              <h3 className="font-semibold text-yellow-700 mb-2">Düşük Güvenli Hatalar</h3>
              <div className="grid md:grid-cols-2 gap-4">
                {lowconfidentLike.map((a) => {
                  const idx = answers.indexOf(a);
                  const q = quizQuestions[idx];
                  return (
                    <div key={`low-${a.questionId}`} className="bg-white dark:bg-gray-800 rounded-lg shadow p-4">
                      <p className="font-medium mb-2">Soru: {q.question}</p>
                      <p className="text-sm mb-1">Öğrenci Cevabı: {a.answerText || '—'}</p>
                      <div className="flex items-center gap-2 text-sm">
                        <span className="px-2 py-0.5 rounded bg-red-100 text-red-700">{a.correctnessLabel}</span>
                        <span className="text-gray-600">Güven: {a.modelConfidencePercent ?? 55}%</span>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </section>

        <section className="mb-8">
          <h2 className="text-xl font-semibold mb-3">Kavram Analizi</h2>
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-4">
            <p className="font-medium mb-2">Hatalı Kavramlar</p>
            <div className="flex flex-wrap gap-2">
              {conceptKeywords.length ? (
                conceptKeywords.map(k => (
                  <span key={k} className="px-2 py-1 rounded-full bg-blue-100 text-blue-800 text-sm">{k}</span>
                ))
              ) : (
                <span className="text-sm text-gray-600">Öne çıkan kavram bulunamadı.</span>
              )}
            </div>
            <button onClick={() => window.location.reload()} className="mt-4 inline-flex items-center gap-2 bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700">
              Bu kavramlar üzerine ek alıştırma yap
            </button>
          </div>
        </section>

        <button onClick={() => window.location.reload()} className="w-full bg-gray-900 text-white font-semibold py-3 rounded">Baştan Başla</button>
      </div>
    );
  }

  const question = quizQuestions[currentQuestion];
  const progressPercent = ((currentQuestion + 1) / quizQuestions.length) * 100;

  return (
    <div className="max-w-3xl mx-auto p-6">
      {/* HEADER */}
      <div className="mb-6">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-3">
            <span className="text-xl font-semibold">{TOPIC_NAME}</span>
          </div>
          <div className="flex items-center gap-4">
            <span className="text-sm text-gray-600 dark:text-gray-400">Soru {currentQuestion + 1}/{quizQuestions.length}</span>
            {/* Logo placeholder */}
            <div className="w-8 h-8 rounded-full bg-gray-900 text-white flex items-center justify-center font-bold">M</div>
          </div>
        </div>
        <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2">
          <div className="bg-blue-600 h-2 rounded-full transition-all duration-300" style={{ width: `${progressPercent}%` }} />
        </div>
      </div>

      {/* MAIN */}
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
        <h2 className="text-xl font-semibold mb-4">{question.question}</h2>
        <div className="flex flex-col md:flex-row gap-4">
          <div className="flex-1 order-2 md:order-1">
            <div className="relative">
              <textarea
                value={answerText}
                onChange={(e) => setAnswerText(e.target.value)}
                placeholder="Cevabını buraya yaz..."
                className="w-full min-h-[140px] p-4 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white dark:bg-gray-900"
              />
            </div>
          </div>
          <div className="md:w-64 w-full order-1 md:order-2">
            {!showCamera ? (
              <button type="button" onClick={startCamera} className="w-full aspect-video bg-gray-100 dark:bg-gray-700 rounded-lg flex items-center justify-center border border-dashed hover:border-blue-500">
                <div className="text-center px-3">
                  <div className="mx-auto mb-2 w-10 h-10 rounded-full bg-blue-600 text-white flex items-center justify-center">
                    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="w-5 h-5"><path d="M9 2a1 1 0 00-.894.553L7.382 4H5a3 3 0 00-3 3v9a3 3 0 003 3h14a3 3 0 003-3V7a3 3 0 00-3-3h-2.382l-.724-1.447A1 1 0 0015 2H9zm3 6a5 5 0 110 10 5 5 0 010-10z"/></svg>
                  </div>
                  <p className="text-sm font-medium">Kamerayı başlatmak için tıklayın</p>
                  <p className="text-xs text-gray-600 dark:text-gray-300 mt-1">Başladıktan sonra 5 sn içinde güven fotoğrafı çekilecektir.</p>
                </div>
              </button>
            ) : (
              <div>
                <div className="rounded-lg overflow-hidden mb-3 relative">
                  <Webcam
                    ref={webcamRef}
                    audio={false}
                    screenshotFormat="image/jpeg"
                    className="w-full object-cover"
                    videoConstraints={videoConstraints}
                    mirrored
                    onUserMedia={handleUserMedia}
                  />
                  {typeof countdownSec === 'number' && (
                    <div className="absolute inset-0 flex items-center justify-center bg-black/30">
                      <div className="text-white text-4xl font-bold">{countdownSec}</div>
                    </div>
                  )}
                  {/* Face alignment overlay */}
                  <div className="pointer-events-none absolute inset-0">
                    <div className="absolute inset-6 border-2 border-white/60 rounded-lg" />
                    <div className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 w-32 h-40 rounded-full border-2 border-white/50" />
                  </div>
                </div>
                <div className="text-xs bg-blue-50 text-blue-900 dark:bg-blue-900/30 dark:text-blue-100 rounded p-3">
                  <p className="font-semibold mb-1">Kamera Yönergesi</p>
                  <p>Bu paneli tıklayarak kamerayı başlatırsın. Başladıktan sonra 5 saniye içinde güven fotoğrafı otomatik çekilecek ve kamera kapanacaktır. Her soruda aynı süre ve kadrajı kullanmanı öneririz: Yüzün ortadaki siluete hizalı, kamera göz hizasında olsun.</p>
                  {isLowLight && (
                    <p className="mt-2 text-yellow-800 dark:text-yellow-200">Düşük ışık tespit edildi. Lütfen ortamı aydınlat ya da ekrana daha yakın konumlan.</p>
                  )}
                  <p className="mt-2 opacity-90">Görüntüler yalnızca analitik amaçlı saklanır ve talebin halinde silinebilir.</p>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* FOOTER */}
        <div className="mt-6">
          <button
            onClick={handleSubmit}
            disabled={!answerText.trim()}
            className={`w-full font-semibold py-3 px-6 rounded-lg transition-colors ${
              !answerText.trim() ? 'bg-gray-300 text-gray-600 cursor-not-allowed' : 'bg-blue-600 text-white hover:bg-blue-700'
            }`}
          >
            Yanıtı Gönder
          </button>
        </div>
      </div>
    </div>
  );
}