---
title: MetaMind NLP Session
emoji: 🧠
colorFrom: blue
colorTo: purple
sdk: gradio
sdk_version: 4.44.0
app_file: app.py
pinned: false
---

# 🧠 MetaMind NLP - Öğrenci Cevap Analizi

Türkçe öğrenci quiz cevaplarını analiz eder ve kişiselleştirilmiş feedback sağlar.

## 🚀 Özellikler

- ✅ **Çift Model Sistemi**: mBART + MT5 consensus
- ✅ **Kişiselleştirilmiş Feedback**: Güven skoru ve konu bazlı
- ✅ **Türkçe Optimize**: Türkçe için özel eğitilmiş modeller
- ✅ **Web Arayüzü**: Gradio ile kolay kullanım
- ✅ **API Desteği**: REST API endpoint'leri

## 📊 Değerlendirme Seviyeleri

- **Tam Doğru (3)**: Cevap tamamen doğru
- **Çok Benzer (2)**: Cevap doğruya çok yakın  
- **Kısmen Doğru (1)**: Cevap kısmen doğru
- **Yanlış (0)**: Cevap yanlış

## 🤖 Modeller

- **mBART**: [Ozget/MetaMind_Nlp_MBART_2](https://huggingface.co/Ozget/MetaMind_Nlp_MBART_2)
- **MT5**: [Ozget/MetaMind_Nlp_MT5_2](https://huggingface.co/Ozget/MetaMind_Nlp_MT5_2)

## 💻 Kullanım

### Web Arayüzü

1. Soru, öğrenci cevabı ve doğru cevabı girin
2. Öğrenci güven skorunu ayarlayın (0-100)
3. Konu bilgisi ekleyin (opsiyonel)
4. "Analiz Et" butonuna tıklayın

### API Endpoint

```python
import requests

response = requests.post(
    "https://ozget-metamind-nlp-session.hf.space/api/predict",
    json={
        "data": [
            "Soru metni",
            "Öğrenci cevabı", 
            "Doğru cevap",
            75,  # güven skoru
            "Konu adı"
        ]
    }
)

result = response.json()
# result["data"][0] -> Label
# result["data"][1] -> Feedback
# result["data"][2] -> Detaylar (JSON)
# result["data"][3] -> Güven skoru
```

## 🎯 Örnek

**Soru**: "Dünyanın en kalabalık ülkesi hangisidir?"  
**Öğrenci**: "çin"  
**Doğru**: "çin"  
**Güven**: 85%  
**Konu**: "Dünya Coğrafyası"

**Sonuç**: 🎯 Tam Doğru  
**Feedback**: "Mükemmel! Dünya Coğrafyası konusunda 'çin' cevabını tam doğru verdiniz. Cevabınıza %85 güvendiniz."

## 🔧 Teknik Detaylar

- **Framework**: Gradio 4.44.0
- **Models**: Hugging Face Transformers
- **Device**: CUDA/CPU auto-detect
- **Language**: Turkish (Türkçe)

## 📖 Daha Fazla Bilgi

Bu sistem, öğrenci öğrenme analizi ve metacognition (üst biliş) araştırması için geliştirilmiştir.

---

**Geliştirici**: Ozget  
**License**: Apache 2.0  
**İletişim**: [Hugging Face](https://huggingface.co/Ozget)

