import React, { useState } from 'react';
import { PieChart, Pie, Cell, Tooltip, ResponsiveContainer } from 'recharts';

interface AnswerRecord {
  questionId: number;
  answerText: string;
  isCorrect: boolean;
  correctnessLabel: 'Doğru' | 'Yanlış' | 'Kısmen Doğru';
  confidencePhoto?: string;
  photoUrl?: string;
  modelConfidencePercent?: number;
}

interface QuizQuestion {
  id: number;
  question: string;
  options: string[];
  correctAnswer: number[];
  topic: string;
}

interface ResultsAnalysisProps {
  answers: AnswerRecord[];
  questions: QuizQuestion[];
  onRestart: () => void;
}

export default function ResultsAnalysis({ answers, questions, onRestart }: ResultsAnalysisProps) {
  const [selectedQuestion, setSelectedQuestion] = useState(null);

  // Metabilişsel hata analizi - Dinamik hesaplama
  const getMetacognitiveAnalysis = () => {
    const analysis = {
      highConfidenceCorrect: 0,
      highConfidenceWrong: 0,
      lowConfidenceCorrect: 0,
      lowConfidenceWrong: 0
    };

    answers.forEach(a => {
      const highConfidence = (a.modelConfidencePercent || 50) > 70;
      const isCorrect = a.isCorrect;
      
      if (highConfidence && isCorrect) analysis.highConfidenceCorrect++;
      else if (highConfidence && !isCorrect) analysis.highConfidenceWrong++;
      else if (!highConfidence && isCorrect) analysis.lowConfidenceCorrect++;
      else if (!highConfidence && !isCorrect) analysis.lowConfidenceWrong++;
    });

    return [
      { tip: "Yüksek Güvenle Doğru", sayi: analysis.highConfidenceCorrect, renk: "#10b981", aciklama: "İdeal durum - Bilgi ve farkındalık uyumlu" },
      { tip: "Yüksek Güvenle Yanlış", sayi: analysis.highConfidenceWrong, renk: "#ef4444", aciklama: "En kritik durum - Kavram yanılgısı var" },
      { tip: "Düşük Güvenle Doğru", sayi: analysis.lowConfidenceCorrect, renk: "#3b82f6", aciklama: "Şans faktörü - Bilgiyi pekiştirmeli" },
      { tip: "Düşük Güvenle Yanlış", sayi: analysis.lowConfidenceWrong, renk: "#f59e0b", aciklama: "Farkındalık var - Çalışma gerekli" }
    ];
  };

  const metaBilisselAnaliz = getMetacognitiveAnalysis();

  const COLORS = ['#10b981', '#ef4444', '#3b82f6', '#f59e0b'];
  const totalCorrect = answers.filter(a => a.isCorrect).length;
  const avgConfidence = (answers.reduce((sum, a) => sum + (a.modelConfidencePercent || 50), 0) / answers.length).toFixed(1);

  // Geri bildirim hesaplamaları
  const overconfidentCount = answers.filter(a => !a.isCorrect && (a.modelConfidencePercent || 50) > 70).length;
  const underconfidentCount = answers.filter(a => a.isCorrect && (a.modelConfidencePercent || 50) < 70).length;
  const overallAccuracy = (totalCorrect / answers.length) * 100;

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-5xl mx-auto space-y-6">
        
        {/* Header */}
        <div className="text-center mb-8">
          <div className="w-20 h-20 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <span className="text-5xl">🧠</span>
          </div>
          <h1 className="text-3xl font-bold text-gray-900 mb-2">MetaMind Quiz Sonuçları</h1>
          <p className="text-gray-600">{questions.length} sorudan {totalCorrect}'sini doğru yanıtladınız</p>
          <div className="mt-4 text-sm text-gray-500">
            Ortalama Güven Skorunuz: <span className="font-semibold text-blue-600">{avgConfidence}%</span>
          </div>
        </div>

        {/* 1. BÖLÜM: Metabilişsel Performans Haritası */}
        <div className="bg-white rounded-2xl p-8 shadow-sm border border-gray-200">
          <h2 className="text-xl font-bold text-gray-900 mb-6 text-center">📊 Metabilişsel Performans Haritanız</h2>
          <ResponsiveContainer width="100%" height={320}>
            <PieChart>
              <Pie
                data={metaBilisselAnaliz}
                cx="50%"
                cy="50%"
                labelLine={false}
                label={({ sayi, percent }: any) => sayi > 0 ? `${sayi} (${(percent * 100).toFixed(0)}%)` : ''}
                outerRadius={110}
                fill="#8884d8"
                dataKey="sayi"
              >
                {metaBilisselAnaliz.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                ))}
              </Pie>
              <Tooltip 
                contentStyle={{ 
                  backgroundColor: 'white', 
                  border: '1px solid #e5e7eb', 
                  borderRadius: '12px', 
                  padding: '12px' 
                }} 
              />
            </PieChart>
          </ResponsiveContainer>
          <div className="grid grid-cols-2 gap-4 mt-6">
            {metaBilisselAnaliz.map((item, i) => (
              <div key={i} className="flex items-start gap-3 bg-gray-50 p-3 rounded-lg border border-gray-100">
                <div className="w-3 h-3 rounded-full mt-1 flex-shrink-0" style={{ backgroundColor: item.renk }}></div>
                <div>
                  <p className="text-gray-900 font-medium text-sm">{item.tip}</p>
                  <p className="text-gray-600 text-xs mt-1">{item.aciklama}</p>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* 2. BÖLÜM: Metabilişsel Koç Geri Bildirimi */}
        <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-200">
          <h2 className="text-xl font-bold text-gray-900 mb-4 flex items-center gap-2">
            <span className="text-2xl">💡</span>
            Metabilişsel Koç Geri Bildirimi
          </h2>
          
          <div className="space-y-4">
            {/* Kritik Uyarı - Aşırı Güven */}
            {overconfidentCount > 0 && (
              <div className="bg-red-50 border-l-4 border-red-500 rounded-lg p-4">
                <div className="flex items-start gap-3">
                  <span className="text-xl flex-shrink-0">⚠️</span>
                  <div>
                    <h3 className="font-semibold text-red-900 mb-2">Kritik: Aşırı Güven Tespit Edildi</h3>
                    <p className="text-gray-700 text-sm leading-relaxed mb-2">
                      {overconfidentCount} soruda yüksek güvenle yanlış cevap verdiniz. Bu, kavramsal yanılgınız olabileceğini gösteriyor.
                    </p>
                  </div>
                </div>
              </div>
            )}

            {/* Pozitif Geri Bildirim */}
            {overallAccuracy >= 50 && (
              <div className="bg-green-50 border-l-4 border-green-500 rounded-lg p-4">
                <div className="flex items-start gap-3">
                  <span className="text-xl flex-shrink-0">✅</span>
                  <div>
                    <h3 className="font-semibold text-green-900 mb-2">Güçlü Yönünüz</h3>
                    <p className="text-gray-700 text-sm leading-relaxed mb-2">
                      {overallAccuracy >= 70 ? "Mükemmel performans!" : "İyi bir performans!"}
                    </p>
                  </div>
                </div>
              </div>
            )}

            {/* Pekiştirme Önerisi */}
            {underconfidentCount > 0 && (
              <div className="bg-blue-50 border-l-4 border-blue-500 rounded-lg p-4">
                <div className="flex items-start gap-3">
                  <span className="text-xl flex-shrink-0">📈</span>
                  <div>
                    <h3 className="font-semibold text-blue-900 mb-2">Pekiştirme Gerekiyor</h3>
                    <p className="text-gray-700 text-sm leading-relaxed mb-2">
                      {underconfidentCount} soruda düşük güvenle doğru yanıt verdiniz. Bilginizi pekiştirerek güveninizi artırabilirsiniz.
                    </p>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Aksiyon Butonu */}
        <div className="text-center pt-4">
          <button 
            onClick={() => router.push('/')}
            className="bg-gradient-to-r from-blue-500 to-purple-600 text-white px-8 py-4 rounded-xl font-semibold text-lg hover:from-blue-600 hover:to-purple-700 transition-all duration-200 transform hover:scale-105 shadow-lg"
          >
            🔄 Yeni Test Başlat
          </button>
        </div>

      </div>
    </div>
  );
}
