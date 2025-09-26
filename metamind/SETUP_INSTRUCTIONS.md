# MetaMind Quiz Uygulaması - Kurulum Talimatları

## ✅ Düzeltilen Tutarsızlıklar

### 1. **Environment Variables**
- `.env.local` dosyası oluşturulması gerekiyor
- Supabase URL ve API key'leri eksik

### 2. **Quiz Data Yapısı**
- ✅ İngilizce soru Türkçe'ye çevrildi
- ✅ Tüm sorular tutarlı dilde
- ✅ Correct answer indeksleri düzeltildi

### 3. **Database Schema**
- ✅ `selected_answer` alanı nullable yapıldı (text-based cevaplar için)
- ✅ `confidence_percentage` alanı eklendi
- ✅ `answer_type` alanı eklendi
- ✅ Yeni indeksler eklendi

### 4. **API Routes**
- ✅ Data mapping tutarsızlıkları düzeltildi
- ✅ Confidence percentage desteği eklendi
- ✅ Null handling iyileştirildi

## 🚀 Kurulum Adımları

### 1. Environment Variables Ayarlama
```bash
# Proje kök dizininde .env.local dosyası oluşturun
NEXT_PUBLIC_SUPABASE_URL=https://your-project-id.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key-here
```

### 2. Supabase Projesi Kurulumu
1. [Supabase](https://supabase.com) hesabı oluşturun
2. Yeni proje oluşturun
3. Settings → API'den URL ve key'leri alın
4. `.env.local` dosyasına ekleyin

### 3. Database Schema Kurulumu
```sql
-- Supabase SQL Editor'da çalıştırın
-- supabase-schema.sql dosyasının içeriğini kopyalayın
```

### 4. Mevcut Database Migration (Eğer varsa)
```sql
-- database-migration.sql dosyasını çalıştırın
```

### 5. Storage Bucket Kurulumu
1. Supabase Dashboard → Storage
2. "confidence-photos" bucket'ı oluşturun
3. Public olarak ayarlayın
4. RLS politikalarını ayarlayın (FIX_STORAGE_PERMISSIONS.md'ye bakın)

### 6. Uygulamayı Çalıştırma
```bash
npm install
npm run dev
```

## 📊 Veri Yapısı

### Quiz Results
- `quiz_session_id`: Benzersiz oturum ID'si
- `total_questions`: Toplam soru sayısı
- `correct_answers`: Doğru cevap sayısı
- `score_percentage`: Başarı yüzdesi

### Quiz Answers
- `question_id`: Soru ID'si
- `selected_answer_text`: Kullanıcının text cevabı
- `confidence_photo_url`: Güven fotoğrafı URL'si
- `confidence_percentage`: Güven yüzdesi (0-100)
- `answer_type`: Cevap tipi (text/multiple_choice)
- `is_correct`: Doğruluk durumu

## 🔧 Sorun Giderme

### Storage Upload Hatası
- RLS politikalarını kontrol edin
- Bucket'ın public olduğundan emin olun
- FIX_STORAGE_PERMISSIONS.md'ye bakın

### Database Connection Hatası
- Environment variables'ları kontrol edin
- Supabase projesinin aktif olduğundan emin olun

### Quiz Data Hatası
- quizData.ts dosyasında soru yapısını kontrol edin
- Correct answer indekslerinin 0-3 arasında olduğundan emin olun

## 📝 Notlar

- Uygulama şu anda text-based cevaplar kullanıyor
- Gelecekte multiple choice desteği eklenebilir
- Confidence tracking fotoğraf ve yüzde bazlı çalışıyor
- Tüm veriler Supabase'de güvenli şekilde saklanıyor
