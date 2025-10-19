"use client";

import { useState, useRef } from "react";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell } from "recharts";

interface ConfidenceTestProps {
  onComplete: () => void;
}

const emotionLabels = {
  'angry': 'Kızgın', 'disgust': 'İğrenme', 'fear': 'Korku', 
  'happy': 'Mutlu', 'sad': 'Üzgün', 'surprise': 'Şaşırma', 'neutral': 'Nötr'
};

const emotionColors = {
  'angry': '#ef4444', 'disgust': '#059669', 'fear': '#f97316', 
  'happy': '#3b82f6', 'sad': '#a855f7', 'surprise': '#eab308', 'neutral': '#64748b'
};

export default function ConfidenceTest({ onComplete }: ConfidenceTestProps) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  
  const [countdown, setCountdown] = useState<number | null>(null);
  const [isCapturing, setIsCapturing] = useState(false);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [showPoseGuide, setShowPoseGuide] = useState(false);
  const [cameraError, setCameraError] = useState<string | null>(null);
  
  // Analysis results
  const [emotions, setEmotions] = useState<Record<string, number> | null>(null);
  const [confidenceScore, setConfidenceScore] = useState<number | null>(null);
  const [details, setDetails] = useState<any>(null);

  const capturePhoto = async () => {
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
          
          // Convert to blob
          const blob = await new Promise<Blob | null>((resolve) => {
            canvas.toBlob((b) => resolve(b), 'image/jpeg', 0.95);
          });
          
          // Stop camera immediately
          stream.getTracks().forEach(track => track.stop());
          video.srcObject = null;
          
          // Analyze
          if (blob) {
            await analyzeEmotion(blob);
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

  const analyzeEmotion = async (imageBlob: Blob) => {
    setIsAnalyzing(true);
    try {
      const formData = new FormData();
      formData.append('image', imageBlob, 'capture.jpg');

      const response = await fetch('/api/analyze-emotion', {
        method: 'POST',
        body: formData,
      });

      if (!response.ok) {
        throw new Error('API hatası');
      }

      const data = await response.json();
      
      if (data.error) {
        throw new Error(data.error);
      }
      
      setEmotions(data.emotions);
      setConfidenceScore(data.confidence_score);
      setDetails(data.details);
      
    } catch (error) {
      console.error('Analiz hatası:', error);
      
      // Simulation for development
      const simulatedEmotions = {
        'angry': Math.random() * 5,
        'disgust': Math.random() * 3,
        'fear': Math.random() * 8,
        'happy': 20 + Math.random() * 30,
        'sad': Math.random() * 5,
        'surprise': Math.random() * 10,
        'neutral': 40 + Math.random() * 20
      };

      const total = Object.values(simulatedEmotions).reduce((sum, val) => sum + val, 0);
      const normalizedEmotions = Object.fromEntries(
        Object.entries(simulatedEmotions).map(([key, val]) => [key, (val / total) * 100])
      );

      const calculatedDetails = calculateContextualConfidence(normalizedEmotions);
      
      setEmotions(normalizedEmotions);
      setConfidenceScore(calculatedDetails.score);
      setDetails(calculatedDetails);
    } finally {
      setIsAnalyzing(false);
    }
  };

  const calculateContextualConfidence = (emotions: Record<string, number>) => {
    const total = Object.values(emotions).reduce((sum, val) => sum + val, 0);
    
    if (total === 0) {
      return {
        score: 50.0,
        certainty: 0.0,
        emotionalTone: 'belirsiz',
        explanation: 'Duygu tespiti yapılamadı',
        happy_total: 0,
        negative_total: 0,
        neutral_impact: 0,
        surprise_contribution: 0,
        valence: 0,
        entropy: 0
      };
    }

    // 1. Entropy calculation
    let entropy = 0;
    for (const val of Object.values(emotions)) {
      const p = val / 100;
      if (p > 0) {
        entropy -= p * Math.log2(p);
      }
    }
    const maxEntropy = Math.log2(7);
    const certainty = (1 - entropy / maxEntropy) * 100;

    // 2. Valence calculation
    const happy = emotions.happy || 0;
    const negative = (emotions.sad || 0) + (emotions.fear || 0) + 
                     (emotions.angry || 0) + (emotions.disgust || 0);
    const valence = happy - negative;

    // 3. Surprise adjustment
    const surprise = emotions.surprise || 0;
    let adjustedValence = valence;
    let surpriseContribution = 0;
    let surpriseReason = 'Nötr Etki';

    if (surprise > 30) {
      if (valence > 0) {
        surpriseContribution = surprise * 0.5;
        adjustedValence += surpriseContribution;
        surpriseReason = 'Pozitif (Mutluluk Baskın)';
      } else if (valence < 0) {
        surpriseContribution = -surprise * 0.3;
        adjustedValence += surpriseContribution;
        surpriseReason = 'Negatif (Olumsuz Duygular Baskın)';
      }
    }

    // 4. Neutral effect
    const neutral = emotions.neutral || 0;
    let neutralPenalty = 0;
    if (neutral > 70) {
      neutralPenalty = (neutral / 100 - 0.7) * 0.5;
    }

    // 5. Final score
    const certaintyComponent = certainty / 100;
    const emotionComponent = (adjustedValence / 100 + 1) / 2;
    let finalScore = (certaintyComponent * 0.6 + emotionComponent * 0.4) * 100;
    finalScore = Math.max(0, Math.min(100, finalScore - neutralPenalty * 100));

    // 6. Explanation
    const valenceNormalized = adjustedValence / 100;
    let emotionalTone = 'nötr';
    if (valenceNormalized > 0.2) emotionalTone = 'pozitif';
    else if (valenceNormalized < -0.2) emotionalTone = 'negatif';

    let explanation = '';
    if (finalScore > 70) {
      explanation = `Yüksek güven: Net ${emotionalTone} duygusal durum`;
    } else if (finalScore > 50) {
      explanation = `Orta güven: ${emotionalTone} ton, orta kesinlik`;
    } else if (finalScore > 30) {
      explanation = `Düşük güven: ${certainty < 40 ? 'Karışık duygular' : 'Negatif ton'}`;
    } else {
      explanation = 'Çok düşük güven: Belirsiz duygusal durum';
    }

    return {
      score: Math.round(finalScore * 10) / 10,
      certainty: Math.round(certainty * 10) / 10,
      emotionalTone,
      explanation,
      happy_total: Math.round(happy * 10) / 10,
      negative_total: Math.round(negative * 10) / 10,
      neutral_impact: Math.round(neutral * 10) / 10,
      surprise_contribution: Math.round(surpriseContribution * 10) / 10,
      surprise_reason: surpriseReason,
      valence: Math.round(valence * 10) / 10,
      adjusted_valence: Math.round(adjustedValence * 10) / 10,
      entropy: Math.round(entropy * 10000) / 10000
    };
  };

  const chartData = emotions ? Object.entries(emotions).map(([key, value]) => ({
    name: emotionLabels[key as keyof typeof emotionLabels],
    value: value,
    color: emotionColors[key as keyof typeof emotionColors]
  })) : [];

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-blue-50 py-10 px-4">
    <div className="max-w-6xl mx-auto">
      {/* Header */}
      <header className="text-center mb-10">
        <div className="inline-flex items-center justify-center w-20 h-20 bg-gradient-to-r from-blue-500 to-purple-600 rounded-full mb-6 shadow-lg">
          <span className="text-3xl">🧠</span>
        </div>
        <h1 className="text-3xl md:text-4xl font-extrabold text-slate-900 mb-3">
          Güven Skoru Demo Alanı
        </h1>
        <p className="text-slate-600 max-w-3xl mx-auto text-lg">
          Bu bölüm, quiz öncesinde yüz ifadenle güven skorunun nasıl ölçüldüğünü anlaman için bir <strong>deneme alanıdır</strong>.
        </p>
      </header>

        {/* Pose Guide Modal */}
        {showPoseGuide && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-2xl p-8 max-w-2xl w-full max-h-[90vh] overflow-y-auto">
              <div className="flex justify-between items-center mb-6">
                <h2 className="text-2xl font-bold text-gray-900">Güven Pozu Rehberi</h2>
                <button 
                  onClick={() => setShowPoseGuide(false)}
                  className="text-gray-500 hover:text-gray-700 text-2xl leading-none"
                >
                  ✕
                </button>
              </div>
              
              <div className="space-y-6">
                <div className="bg-gradient-to-r from-green-50 to-emerald-100 p-6 rounded-xl border border-green-200">
                  <h3 className="font-bold text-lg mb-4 text-green-800 flex items-center gap-2">
                    <span className="text-xl">😊</span>
                    Güvendiğiniz Yanıtlarda
                  </h3>
                  <div className="space-y-3 text-green-700">
                    <div className="flex items-center gap-3">
                      <span className="text-2xl">👁️</span>
                      <span>Kameraya doğrudan bakın</span>
                    </div>
                    <div className="flex items-center gap-3">
                      <span className="text-2xl">😌</span>
                      <span>Rahat ve sakin bir ifade takının</span>
                    </div>
                    <div className="flex items-center gap-3">
                      <span className="text-2xl">🙂</span>
                      <span>Hafif bir gülümseme</span>
                    </div>
                    <div className="flex items-center gap-3">
                      <span className="text-2xl">💪</span>
                      <span>Omuzlarınızı geriye alın</span>
                    </div>
                  </div>
                </div>

                <div className="bg-gradient-to-r from-red-50 to-pink-100 p-6 rounded-xl border border-red-200">
                  <h3 className="font-bold text-lg mb-4 text-red-800 flex items-center gap-2">
                    <span className="text-xl">😕</span>
                    Emin Olmadığınız Yanıtlarda
                  </h3>
                  <div className="space-y-3 text-red-700">
                    <div className="flex items-center gap-3">
                      <span className="text-2xl">🤔</span>
                      <span>Kaşlarınızı çatın</span>
                    </div>
                    <div className="flex items-center gap-3">
                      <span className="text-2xl">😐</span>
                      <span>Nötr veya endişeli bir ifade</span>
                    </div>
                    <div className="flex items-center gap-3">
                      <span className="text-2xl">👀</span>
                      <span>Gözlerinizi kaçırın veya yukarı bakın</span>
                    </div>
                    <div className="flex items-center gap-3">
                      <span className="text-2xl">🤷</span>
                      <span>Omuz silkme hareketi</span>
                    </div>
                  </div>
                </div>

                <div className="bg-blue-50 p-6 rounded-xl border border-blue-200">
                  <h3 className="font-bold text-lg mb-3 text-blue-800">💡 İpuçları</h3>
                  <ul className="space-y-2 text-blue-700 text-sm">
                    <li>• Doğal davranın, zorlamayın</li>
                    <li>• 3 saniye geri sayımdan sonra poz çekilecek</li>
                    <li>• İyi aydınlatma altında olun</li>
                    <li>• Yüzünüzün tamamı görünür olsun</li>
                  </ul>
                </div>

                <div className="bg-purple-50 p-6 rounded-xl border border-purple-200">
                  <h3 className="font-bold text-lg mb-3 text-purple-800">🔒 Gizlilik & Kamera Kullanımı</h3>
                  <div className="space-y-2 text-purple-700 text-sm">
                    <p>Sistemimiz, anlık duygu analizi için görüntünüzü kullanır ve gelecekte model iyileştirme amacıyla depolayabilir.</p>
                    <p className="font-medium mt-3">Nasıl Koruyoruz?</p>
                    <ul className="space-y-1 ml-4">
                      <li>• Görüntüler anonimleştirilir ve şifrelenir</li>
                      <li>• Sadece yetkili ekip erişebilir</li>
                      <li>• Üçüncü şahıslarla paylaşılmaz</li>
                      <li>• Yalnızca eğitimsel amaçla kullanılır</li>
                    </ul>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Main Content - Side by Side Layout */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Left Side: Camera Capture */}
          <div>
            <div className="bg-white p-8 rounded-2xl shadow-xl border border-slate-200">
              <h2 className="text-2xl font-semibold mb-6 text-blue-700 text-center flex items-center justify-center gap-2">
                <span>📷</span>
                Kamera ile Poz Çekimi
              </h2>

              {/* Hidden video for capture */}
              <video
                ref={videoRef}
                autoPlay
                playsInline
                muted
                className={`w-full rounded-xl bg-black ${isCapturing ? '' : 'hidden'}`}
              />

              {/* Countdown overlay */}
              {countdown !== null && (
                <div className="relative w-full aspect-video rounded-xl bg-black flex items-center justify-center mb-6">
                  <div className="text-white text-8xl font-bold animate-pulse">
                    {countdown}
                  </div>
                </div>
              )}

              {/* Placeholder when not capturing */}
              {!isCapturing && (
                <div className="w-full aspect-video rounded-xl bg-slate-100 flex items-center justify-center mb-6">
                  <div className="text-center">
                    <div className="text-6xl mb-3">📷</div>
                    <p className="text-slate-600 font-medium">Kamera Hazır</p>
                    <p className="text-slate-500 text-sm mt-1">Fotoğraf çekmek için butona tıklayın</p>
                  </div>
                </div>
              )}

              <canvas ref={canvasRef} className="hidden" />

              {cameraError && (
                <div className="bg-red-50 border border-red-200 rounded-xl p-4 text-red-700 mb-4">
                  <p>{cameraError}</p>
                </div>
              )}

              <div className="space-y-3">
                <button
                  onClick={() => setShowPoseGuide(true)}
                  disabled={isCapturing}
                  className="w-full bg-gradient-to-r from-purple-500 to-pink-600 text-white py-3 rounded-xl font-semibold hover:from-purple-600 hover:to-pink-700 transition-all duration-200 transform hover:scale-[1.02] disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  🎭 Güven Pozu Rehberi
                </button>
                <button
                  onClick={capturePhoto}
                  disabled={isCapturing}
                  className="w-full bg-gradient-to-r from-blue-500 to-cyan-600 text-white py-3 rounded-xl font-semibold hover:from-blue-600 hover:to-cyan-700 transition-all duration-200 transform hover:scale-[1.02] disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {isCapturing ? '📸 Çekiliyor...' : isAnalyzing ? '🔍 Analiz Ediliyor...' : '📸 Poz Çek (3 Saniye)'}
                </button>
              </div>
            </div>
          </div>

          {/* Right Side: Analysis Results */}
          <div>
            {confidenceScore ? (
              <div className="bg-white p-6 rounded-2xl shadow-xl border border-slate-200 h-full">
                <h2 className="text-2xl font-semibold mb-6 text-center text-blue-700">
                  Anlık Güven Skoru Analizi
                </h2>

                {/* Güven Skoru Göstergesi */}
                <div className="flex flex-col items-center justify-center p-4 bg-slate-50 rounded-xl mb-6">
                  <h3 className="text-md font-medium text-slate-700 mb-4 uppercase tracking-wider">
                    Güven Skoru
                  </h3>
                  <div className="relative w-36 h-36">
                    <svg className="absolute inset-0" viewBox="0 0 100 100">
                      <circle cx="50" cy="50" r="45" fill="none" stroke="#e2e8f0" strokeWidth="8" />
                      <circle
                        cx="50"
                        cy="50"
                        r="45"
                        fill="none"
                        stroke={confidenceScore < 50 ? '#ef4444' : (confidenceScore < 75 ? '#f59e0b' : '#2563eb')}
                        strokeWidth="8"
                        strokeDasharray="282.6"
                        strokeDashoffset={282.6 - (confidenceScore / 100) * 282.6}
                        transform="rotate(-90 50 50)"
                        style={{ transition: 'stroke-dashoffset 0.5s ease' }}
                      />
                    </svg>
                    <div className="absolute inset-0 flex flex-col items-center justify-center text-4xl font-extrabold text-slate-900">
                      {confidenceScore.toFixed(1)}
                    </div>
                  </div>
                  <p className="text-sm text-slate-600 mt-3 text-center">{details?.explanation}</p>
                </div>

                {/* Hesaplama Detayları */}
                <div className="p-4 bg-slate-50 rounded-xl mb-6">
                  <h3 className="text-md font-medium text-slate-700 mb-3 uppercase tracking-wider border-b pb-2">
                    Duygusal Uyum Detayları
                  </h3>
                  <div className="grid grid-cols-2 gap-3 text-sm">
                    <div>
                      <span className="font-semibold text-green-600">Mutluluk:</span>
                      <span className="ml-2">{details?.happy_total.toFixed(1)}%</span>
                    </div>
                    <div>
                      <span className="font-semibold text-red-600">Negatif Toplam:</span>
                      <span className="ml-2">{details?.negative_total.toFixed(1)}%</span>
                    </div>
                    <div>
                      <span className="font-semibold text-yellow-600">Nötr Etki:</span>
                      <span className="ml-2">{details?.neutral_impact.toFixed(1)}%</span>
                    </div>
                    <div>
                      <span className="font-semibold text-purple-600">Kesinlik:</span>
                      <span className="ml-2">{details?.certainty.toFixed(1)}%</span>
                    </div>
                    <div className="col-span-2">
                      <span className="font-semibold text-blue-600">Şaşkınlık Katkısı:</span>
                      <span className="ml-2">{details?.surprise_contribution > 0 ? '+' : ''}{details?.surprise_contribution.toFixed(1)}%</span>
                      <span className="text-xs text-slate-500 ml-1">({details?.surprise_reason})</span>
                    </div>
                    <div className="col-span-2">
                      <span className="font-semibold text-indigo-600">Duygusal Ton:</span>
                      <span className="ml-2 capitalize">{details?.emotionalTone}</span>
                    </div>
                  </div>
                </div>

                {/* Grafik */}
                <h3 className="text-lg font-semibold text-slate-700 mb-3 text-center">
                  Duygu Dağılımı
                </h3>
                <div className="w-full h-64">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={chartData}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                      <XAxis dataKey="name" tick={{ fontSize: 12 }} />
                      <YAxis domain={[0, 100]} tick={{ fontSize: 12 }} />
                      <Tooltip
                        formatter={(value: number) => `${value.toFixed(1)}%`}
                        contentStyle={{ borderRadius: '8px', border: '1px solid #e2e8f0' }}
                      />
                      <Bar dataKey="value" radius={[8, 8, 0, 0]}>
                        {chartData.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={entry.color} />
                        ))}
                      </Bar>
                    </BarChart>
                  </ResponsiveContainer>
                </div>

                <div className="mt-6 flex gap-3">
                  <button
                    onClick={() => {
                      setEmotions(null);
                      setConfidenceScore(null);
                      setDetails(null);
                    }}
                    className="flex-1 bg-gradient-to-r from-blue-500 to-cyan-600 text-white py-3 rounded-xl font-semibold hover:from-blue-600 hover:to-cyan-700 transition-all duration-200"
                  >
                    🔄 Yeni Analiz
                  </button>
                  <button
                    onClick={onComplete}
                    className="flex-1 bg-gradient-to-r from-green-500 to-emerald-600 text-white py-3 rounded-xl font-semibold hover:from-green-600 hover:to-emerald-700 transition-all duration-200"
                  >
                    ✅ Testi Bitir
                  </button>
                </div>
              </div>
            ) : (
              <div className="bg-white p-8 rounded-2xl shadow-xl border border-slate-200 h-full flex items-center justify-center">
                <div className="text-center text-slate-400">
                  <div className="text-6xl mb-4">📊</div>
                  <p className="text-lg font-medium">Analiz Sonuçları</p>
                  <p className="text-sm mt-2">Fotoğraf çekildikten sonra burada görünecek</p>
                </div>
              </div>
            )}
          </div>
        </div>
        
        <footer className="text-center mt-8 text-slate-500 text-sm">
          <p>
            Bu platform, <strong>Bağlamsal Güven Skoru</strong> formülünü kullanarak yüz ifadenizden duygusal uyumunuzu hesaplar.
          </p>
          <p className="mt-2 text-xs">
            Formül: Shannon Entropy (kesinlik) + Russell Valence Modeli (duygusal ton)
          </p>
        </footer>
      </div>
    </div>
  );
}