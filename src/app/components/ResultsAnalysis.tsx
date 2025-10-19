import React, { useState } from 'react';
import { PieChart, Pie, Cell, Tooltip, ResponsiveContainer } from 'recharts';
import { useRouter } from "next/navigation";

interface ModelAnalysis {
  mbart: {
    label: string;
    label_code: number;
    feedback: string;
    confidence: number;
  };
  mt5: {
    label: string;
    label_code: number;
    feedback: string;
    confidence: number;
  };
  agent: {
    chosen_model: string;
    label: string;
    feedback: string;
    confidence: number;
    reasoning: string;
  };
}

interface AnswerRecord {
  questionId: number;
  answerText: string;
  isCorrect: boolean;
  correctnessLabel: 'Doğru' | 'Yanlış' | 'Kısmen Doğru';
  confidencePhoto?: string;
  photoUrl?: string;
  modelConfidencePercent?: number;
  modelAnalysis?: ModelAnalysis;
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
  const router = useRouter();
  const [selectedQuestion, setSelectedQuestion] = useState<number | null>(null);

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

        {/* 3. BÖLÜM: AI Model Değerlendirmesi */}
        <div className="bg-white rounded-2xl p-8 shadow-sm border border-gray-200">
          <h2 className="text-xl font-bold text-gray-900 mb-6 text-center">
            🤖 AI Model Değerlendirmesi
          </h2>
          <p className="text-gray-600 text-center mb-6">
            Cevaplarınız 3 farklı LLM modeli tarafından analiz edildi ve en uygun değerlendirme seçildi
          </p>

          <div className="space-y-6">
            {answers.map((answer, index) => {
              const question = questions[index];
              const analysis = answer.modelAnalysis;

              if (!analysis) {
                return (
                  <div key={index} className="bg-gray-50 rounded-lg p-4 border border-gray-200">
                    <h3 className="font-semibold text-gray-900 mb-2">
                      Soru {index + 1}: {question.question}
                    </h3>
                    <p className="text-gray-500 text-sm">Model analizi yapılamadı</p>
                  </div>
                );
              }

              // Agent'ın seçtiği final değerlendirme
              const finalEvaluation = analysis.agent;

              return (
                <div key={index} className="bg-gradient-to-br from-gray-50 to-blue-50 rounded-lg p-6 border border-gray-200 shadow-sm hover:shadow-md transition-shadow">
                  {/* Soru Başlığı */}
                  <div className="mb-4 pb-4 border-b border-gray-300">
                    <h3 className="font-semibold text-gray-900 mb-3 flex items-center gap-2">
                      <span className="text-2xl">📝</span>
                      <span>Soru {index + 1}: {question.question}</span>
                    </h3>
                    <div className="space-y-2">
                      <div className="flex items-center justify-between bg-white rounded-lg p-3 border border-gray-200">
                        <div>
                          <span className="font-medium text-blue-700">Sizin Cevabınız:</span> 
                          <span className="ml-2">{answer.answerText}</span>
                        </div>
                        {typeof answer.modelConfidencePercent === 'number' && (
                          <div className="flex items-center gap-2 ml-4">
                            <span className="text-xs text-gray-500">Güveniniz:</span>
                            <div className={`px-3 py-1 rounded-full text-sm font-bold ${
                              answer.modelConfidencePercent >= 80 ? 'bg-green-100 text-green-700' :
                              answer.modelConfidencePercent >= 60 ? 'bg-blue-100 text-blue-700' :
                              answer.modelConfidencePercent >= 40 ? 'bg-yellow-100 text-yellow-700' :
                              'bg-red-100 text-red-700'
                            }`}>
                              {answer.modelConfidencePercent}%
                            </div>
                          </div>
                        )}
                      </div>
                      <p className="text-sm text-gray-700 bg-white rounded-lg p-3 border border-green-200">
                        <span className="font-medium text-green-700">Doğru Cevap:</span> 
                        <span className="ml-2">{question.options[question.correctAnswer[0]]}</span>
                      </p>
                    </div>
                  </div>

                  {/* Öğrenci Güven Fotoğrafı */}
                  {answer.confidencePhoto && (
                    <div className="mb-4 bg-white rounded-lg p-3 border border-gray-200">
                      <div className="flex items-center gap-3">
                        <img 
                          src={answer.confidencePhoto} 
                          alt="Güven Fotoğrafı" 
                          className="w-16 h-16 rounded-lg object-cover border-2 border-blue-300"
                        />
                        <div className="flex-1">
                          <p className="text-sm font-medium text-gray-700">Güven Analizi</p>
                          <p className="text-xs text-gray-500">Yüz ifadesi analizi ile %{answer.modelConfidencePercent || 0} güven tespit edildi</p>
                        </div>
                      </div>
                    </div>
                  )}

                  {/* AI Model Değerlendirmesi */}
                  <div className="bg-white rounded-xl p-5 border-2 border-blue-300 shadow-sm">
                    <div className="flex items-center gap-3 mb-4">
                      <div className="w-10 h-10 rounded-full bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center">
                        <span className="text-white text-xl">🧠</span>
                      </div>
                      <div>
                        <h4 className="font-bold text-gray-900">AI Değerlendirmesi</h4>
                        <p className="text-xs text-gray-500">
                          {finalEvaluation.chosen_model === 'mbart' ? 'mBART' : 
                           finalEvaluation.chosen_model === 't5' ? 'MT5' : 
                           finalEvaluation.chosen_model.toUpperCase()} modeli seçildi
                        </p>
                      </div>
                    </div>

                    {/* Değerlendirme Label */}
                    <div className="mb-4">
                      <span className="font-medium text-gray-700 text-sm">Değerlendirme:</span>
                      <span className={`ml-2 px-3 py-1.5 rounded-full text-sm font-bold ${
                        finalEvaluation.label === 'Tam Doğru' ? 'bg-green-100 text-green-800 border-2 border-green-300' :
                        finalEvaluation.label === 'Çok Benzer' ? 'bg-blue-100 text-blue-800 border-2 border-blue-300' :
                        finalEvaluation.label === 'Kısmen Doğru' ? 'bg-yellow-100 text-yellow-800 border-2 border-yellow-300' :
                        'bg-red-100 text-red-800 border-2 border-red-300'
                      }`}>
                        {finalEvaluation.label}
                      </span>
                    </div>

                    {/* Feedback */}
                    <div className="bg-gradient-to-r from-blue-50 to-purple-50 rounded-lg p-4 border border-blue-200">
                      <p className="text-gray-800 text-sm leading-relaxed">
                        {finalEvaluation.feedback}
                      </p>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Aksiyon Butonu */}
        <div className="text-center pt-4">
          <button
            onClick={() => router.push('/onboarding')}
            className="bg-gradient-to-r from-blue-500 to-purple-600 text-white px-8 py-4 rounded-xl font-semibold text-lg hover:from-blue-600 hover:to-purple-700 transition-all duration-200 transform hover:scale-105 shadow-lg"
          >
            🔄 Yeni Test Başlat
          </button>
        </div>
      </div>
    </div>
  );
}
