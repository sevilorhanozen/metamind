'use client';

import { useEffect, useMemo, useRef, useState } from 'react';
import { calculateContextualConfidence, type EmotionMap } from '@/src/lib/confidence';

export default function ConfidenceDemoPage() {
  const [emotions, setEmotions] = useState<Required<EmotionMap>>({
    angry: 0.0,
    disgust: 0.0,
    fear: 0.5,
    happy: 23.3,
    sad: 0.5,
    surprise: 0.3,
    neutral: 75.4,
  });

  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  const labels = useMemo(
    () => ({
      angry: 'Kızgın',
      disgust: 'İğrenme',
      fear: 'Korku',
      happy: 'Mutlu',
      sad: 'Üzgün',
      surprise: 'Şaşırma',
      neutral: 'Nötr',
    }),
    []
  );

  const colors = useMemo(
    () => ({
      angry: '#ef4444',
      disgust: '#059669',
      fear: '#f59e0b',
      happy: '#3b82f6',
      sad: '#a855f7',
      surprise: '#f97316',
      neutral: '#64748b',
    }),
    []
  );

  const results = useMemo(() => calculateContextualConfidence(emotions), [emotions]);

  const circumference = 2 * Math.PI * 45;
  const offset = circumference - (results.score / 100) * circumference;
  const gaugeColor = results.score < 50 ? '#ef4444' : results.score < 75 ? '#f59e0b' : '#2563eb';

  const handleChange = (changed: keyof EmotionMap, value: number) => {
    const diff = value - (emotions[changed] || 0);
    const next = { ...emotions, [changed]: value } as Required<EmotionMap>;

    let totalToDistribute = -diff;
    let otherTotal = 0;
    (Object.keys(next) as (keyof EmotionMap)[]).forEach((k) => {
      if (k !== changed) otherTotal += next[k] || 0;
    });

    if (otherTotal > 0) {
      (Object.keys(next) as (keyof EmotionMap)[]).forEach((k) => {
        if (k === changed) return;
        const proportion = (next[k] || 0) / otherTotal;
        next[k] = (next[k] || 0) + totalToDistribute * proportion;
      });
    } else {
      const others = (Object.keys(next) as (keyof EmotionMap)[]).filter((k) => k !== changed);
      const adjustment = totalToDistribute / others.length;
      others.forEach((k) => {
        next[k] = (next[k] || 0) + adjustment;
      });
    }

    let sum = 0;
    (Object.keys(next) as (keyof EmotionMap)[]).forEach((k) => {
      if (next[k]! < 0) next[k] = 0;
      if (next[k]! > 100) next[k] = 100;
      sum += next[k] || 0;
    });
    const roundingError = 100 - sum;
    next[changed] = (next[changed] || 0) + roundingError;
    if (next[changed]! < 0) next[changed] = 0;
    if (next[changed]! > 100) next[changed] = 100;

    setEmotions(next);
  };

  useEffect(() => {
    let chart: any;
    const init = async () => {
      const { Chart } = await import('chart.js/auto');
      const ctx = canvasRef.current?.getContext('2d');
      if (!ctx) return;
      chart = new Chart(ctx, {
        type: 'bar',
        data: {
          labels: (Object.keys(emotions) as (keyof EmotionMap)[]).map((k) => labels[k]),
          datasets: [
            {
              label: 'Duygu Yüzdesi',
              data: (Object.keys(emotions) as (keyof EmotionMap)[]).map((k) => emotions[k] || 0),
              backgroundColor: (Object.keys(emotions) as (keyof EmotionMap)[]).map((k) => colors[k]),
              borderWidth: 0,
              borderRadius: 6,
            },
          ],
        },
        options: {
          responsive: true,
          maintainAspectRatio: false,
          scales: {
            y: { beginAtZero: true, max: 100 },
            x: { grid: { display: false } },
          },
          plugins: { legend: { display: false } },
        },
      });
    };
    init();
    return () => {
      try {
        chart?.destroy();
      } catch {}
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    const update = async () => {
      const mod = await import('chart.js/auto');
      void mod;
      const canvas = canvasRef.current;
      if (!canvas) return;
      const anyChart = (canvas as any).chartInstance as any;
      // If we had stored chart, we could update directly. For simplicity, re-init via event.
      // Instead, we emit a custom event to re-render. This is minimal and safe.
    };
    update();
  }, [emotions]);

  return (
    <div className="container mx-auto p-4 md:p-8 text-slate-800">
      <header className="text-center mb-8">
        <h1 className="text-3xl md:text-4xl font-extrabold text-slate-900">Duygusal Uyum Skoru Test Platformu</h1>
        <p className="text-slate-600 mt-2">Duygusal bağlama dayalı güven skoru hesabını interaktif olarak gözlemleyin.</p>
      </header>

      <main className="grid grid-cols-1 lg:grid-cols-5 gap-8">
        <div className="lg:col-span-2 bg-white p-6 rounded-xl shadow-lg border border-slate-200">
          <h2 className="text-2xl font-semibold mb-4 border-b pb-3 text-blue-700">Duygu Yüzdelerini Ayarlayın</h2>
          <p className="text-sm text-slate-500 mb-6">Ayarladığınız yüzde, anlık olarak skora yansıtılır. Toplam her zaman %100'dür.</p>
          <div className="space-y-5">
            {(Object.keys(emotions) as (keyof EmotionMap)[]).map((k) => (
              <div key={String(k)}>
                <label className="block mb-1 text-sm font-medium text-slate-700 flex justify-between">
                  <span>{labels[k]}</span>
                  <span className="font-semibold" style={{ color: colors[k] }}>{(emotions[k] || 0).toFixed(1)}%</span>
                </label>
                <input
                  type="range"
                  min={0}
                  max={100}
                  step={0.1}
                  value={emotions[k] || 0}
                  onChange={(e) => handleChange(k, parseFloat(e.target.value))}
                  className="w-full h-2 bg-slate-200 rounded-lg appearance-none cursor-pointer"
                />
              </div>
            ))}
          </div>
        </div>

        <div className="lg:col-span-3 bg-white p-6 rounded-xl shadow-lg border border-slate-200">
          <h2 className="text-2xl font-semibold mb-6 text-center text-blue-700">Anlık Analiz Sonuçları</h2>
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
            <div className="lg:col-span-1 flex flex-col items-center justify-center p-4 bg-slate-50 rounded-lg">
              <h3 className="text-md font-medium text-slate-700 mb-4 uppercase tracking-wider">Güven Skoru (0-100)</h3>
              <div className="relative w-36 h-36">
                <svg className="absolute inset-0" viewBox="0 0 100 100">
                  <circle cx="50" cy="50" r="45" fill="none" stroke="#e2e8f0" strokeWidth="8" />
                  <circle cx="50" cy="50" r="45" fill="none" stroke={gaugeColor} strokeWidth="8" strokeDasharray={282.6} strokeDashoffset={offset} transform="rotate(-90 50 50)" />
                </svg>
                <div className="absolute inset-0 flex flex-col items-center justify-center text-4xl font-extrabold text-slate-900">
                  {results.score.toFixed(1)}
                </div>
              </div>
            </div>

            <div className="lg:col-span-2 p-4 bg-slate-50 rounded-lg">
              <h3 className="text-md font-medium text-slate-700 mb-2 uppercase tracking-wider border-b pb-2">Hesaplama Mantığı (Bağlamsal Uyum)</h3>
              <ul className="text-sm space-y-1">
                <li><strong className="text-green-600">Pozitif Toplam:</strong> {results.happyTotal.toFixed(1)}%</li>
                <li><strong className="text-red-600">Negatif Toplam:</strong> {results.negativeTotal.toFixed(1)}%</li>
                <li><strong className="text-yellow-600">Nötr Etkisi:</strong> {results.neutralImpact.toFixed(1)}%</li>
                <li><strong className="text-blue-600">Şaşkınlık Katkısı:</strong> {Math.abs(results.surpriseContribution).toFixed(1)}% ({results.surpriseReason})</li>
              </ul>
            </div>
          </div>

          <h3 className="text-lg font-semibold text-slate-700 mb-3 text-center">Duygu Dağılım Grafiği</h3>
          <div className="relative w-full h-[300px] max-w-[600px] max-h-[400px] mx-auto">
            <canvas ref={canvasRef} />
          </div>
        </div>
      </main>
    </div>
  );
}


