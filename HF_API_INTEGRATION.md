# 🚀 Hugging Face API Entegrasyonu

Next.js uygulaması artık Hugging Face Spaces API'sini kullanıyor!

## ✅ Yapılan Değişiklikler

### 1. API Route Güncellendi

**Dosya:** `src/app/api/analyze-answers/route.ts`

- ❌ **Eski:** Local Python subprocess (child_process)
- ✅ **Yeni:** Hugging Face Spaces REST API

**Avantajlar:**
- 🚀 Daha hızlı (modeller zaten yüklü)
- 💰 Sunucu kaynaklarını kullanmıyor
- 🔧 Bakım gerektirmiyor
- 📈 Ölçeklenebilir (HF infrastructure)
- 🌍 Her yerden erişilebilir

### 2. Environment Variable

**Dosya:** `.env.local`

```bash
HF_API_URL=https://ozget-metamind-nlp-session.hf.space
```

## 🧪 Test Etme

### 1. Local Development

```bash
# Dependencies yükle
npm install

# Development server başlat
npm run dev
```

Tarayıcıda: http://localhost:3000

### 2. API Health Check

```bash
curl http://localhost:3000/api/analyze-answers/health
```

**Beklenen Response:**
```json
{
  "status": "ok",
  "hfApiUrl": "https://ozget-metamind-nlp-session.hf.space",
  "hfApiStatus": "running",
  "timestamp": "2025-10-18T..."
}
```

### 3. Quiz Test

1. Uygulamayı aç: http://localhost:3000
2. Quiz başlat
3. Sorulara cevap ver
4. Analiz sonuçlarını gör

## 📡 API Endpoint

### POST /api/analyze-answers

**Request:**
```json
{
  "question": "Dünyanın en kalabalık ülkesi hangisidir?",
  "studentAnswer": "çin",
  "correctAnswer": "çin",
  "student_confidence": 85,
  "topic": "Dünya Coğrafyası"
}
```

**Response:**
```json
{
  "success": true,
  "label": "Tam Doğru",
  "feedback": "🎯 Mükemmel! Dünya Coğrafyası konusunda...",
  "confidence": 0.85,
  "models": {
    "mbart": {
      "label": "Tam Doğru",
      "label_code": 3,
      "feedback": "...",
      "confidence": 85
    },
    "mt5": {
      "label": "Tam Doğru",
      "label_code": 3,
      "feedback": "...",
      "confidence": 82
    },
    "agent": {
      "chosen_model": "mBART + MT5 Consensus",
      "label": "Tam Doğru",
      "feedback": "...",
      "confidence": 0.85,
      "reasoning": "İki model birlikte 'Tam Doğru' sonucuna vardı."
    }
  }
}
```

## 🚀 Vercel'e Deploy

### 1. Environment Variable Ekle

Vercel Dashboard → Project → Settings → Environment Variables

```
HF_API_URL = https://ozget-metamind-nlp-session.hf.space
```

### 2. Deploy

```bash
# Vercel CLI ile
vercel --prod

# veya Git push (otomatik deploy)
git add .
git commit -m "Integrate Hugging Face API"
git push
```

## 🔧 Troubleshooting

### API Timeout

**Sorun:** Request 60 saniyede timeout oluyor

**Çözüm:** 
- İlk request'te HF Space sleep'ten uyanıyor (~30 saniye)
- Sonraki requestler hızlı olacak
- Production'da T4 GPU kullanımı önerilir

### CORS Hatası

**Sorun:** Browser'dan direkt Hugging Face API'ye erişilemiyor

**Çözüm:** 
- ✅ Next.js API route üzerinden çağırıyoruz (backend-to-backend)
- CORS sorunu yok

### Connection Refused

**Sorun:** Hugging Face Space'e bağlanılamıyor

**Çözüm:**
1. Space'in çalıştığını kontrol et: https://ozget-metamind-nlp-session.hf.space
2. Health check yap: `curl https://ozget-metamind-nlp-session.hf.space/`
3. Space logs'unu kontrol et

## 📊 Monitoring

### Health Endpoint

```bash
# Local
curl http://localhost:3000/api/analyze-answers/health

# Production
curl https://your-vercel-domain.vercel.app/api/analyze-answers/health
```

### Logs

**Development:**
```bash
npm run dev
# Console'da logları gör
```

**Production (Vercel):**
- Vercel Dashboard → Project → Logs
- Real-time log streaming

## 🎯 Performans

### Response Süreler

- İlk request (cold start): ~30-60 saniye
- Sonraki requestler: ~2-5 saniye
- Parallel requestler: ~3-6 saniye

### Optimizasyon İpuçları

1. **Loading State:** UI'da loading göster
2. **Timeout Handling:** Timeout için fallback mesajı
3. **Retry Logic:** Başarısız requestleri tekrar dene
4. **Caching:** Aynı soru-cevap çiftlerini cache'le

## 🔒 Güvenlik

### API Key

Şu an Hugging Face Space public. Private yapmak için:

1. HF Space → Settings → Private
2. HF Token oluştur
3. `.env.local`'e ekle:
```bash
HF_TOKEN=your_token_here
```

4. API route'da kullan:
```typescript
headers: {
  'Authorization': `Bearer ${process.env.HF_TOKEN}`,
  'Content-Type': 'application/json'
}
```

## 📝 Notlar

- Python subprocess kodu kaldırıldı
- `python/` klasörü artık gerekli değil (opsiyonel)
- Daha basit ve maintainable kod
- Production-ready! 🎉

## 🆘 Destek

Sorun yaşarsan:
1. Health endpoint'i kontrol et
2. Browser console loglarına bak
3. Vercel logs'unu kontrol et
4. HF Space logs'unu kontrol et

---

**Hazır! Artık production'a deploy edebilirsin!** 🚀

