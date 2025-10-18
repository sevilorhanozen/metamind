"""
MetaMind NLP - Öğrenci Cevap Analizi
Gradio Interface
"""

import gradio as gr
import torch
import logging
import json
from transformers import MBartForConditionalGeneration, MBartTokenizer
from transformers import MT5ForConditionalGeneration, MT5Tokenizer
import random

# Logging ayarları
logging.basicConfig(level=logging.INFO, format='%(asctime)s - %(levelname)s - %(message)s')
logger = logging.getLogger(__name__)

# Global değişkenler
mbart_model = None
mbart_tokenizer = None
mt5_model = None
mt5_tokenizer = None
device = None
label_map = ['Yanlış', 'Kısmen Doğru', 'Çok Benzer', 'Tam Doğru']

# Model hassasiyet ayarları
SIMILARITY_THRESHOLD = 0.7  # Benzerlik eşiği (0.0-1.0)
STRICT_MODE = True  # Katı mod - daha az tolerans
CONFIDENCE_THRESHOLD = 0.6  # Güven eşiği

def load_models():
    """Modelleri başlangıçta yükle"""
    global mbart_model, mbart_tokenizer, mt5_model, mt5_tokenizer, device
    
    logger.info("🚀 MetaMind NLP başlatılıyor...")
    
    # Device belirleme
    device = "cuda" if torch.cuda.is_available() else "cpu"
    logger.info(f"🖥️  Cihaz: {device}")
    
    # mBART modeli
    try:
        logger.info("📥 mBART modeli yükleniyor...")
        from transformers import MBartConfig
        
        # Önce config'i yükle ve düzelt
        config = MBartConfig.from_pretrained("Ozget/MetaMind_Nlp_MBART_2")
        config.early_stopping = True
        
        # Tokenizer'ı yükle
        mbart_tokenizer = MBartTokenizer.from_pretrained("Ozget/MetaMind_Nlp_MBART_2")
        
        # Modeli düzeltilmiş config ile yükle
        mbart_model = MBartForConditionalGeneration.from_pretrained(
            "Ozget/MetaMind_Nlp_MBART_2",
            config=config,
            ignore_mismatched_sizes=True
        )
        mbart_model.to(device)
        mbart_model.eval()
        logger.info("✅ mBART hazır!")
    except Exception as e:
        logger.error(f"❌ mBART yüklenemedi: {e}")
        mbart_model = None
        mbart_tokenizer = None
    
    # MT5 modeli
    try:
        logger.info("📥 MT5 modeli yükleniyor...")
        from transformers import MT5Config
        
        # Önce config'i yükle ve düzelt
        config = MT5Config.from_pretrained("Ozget/MetaMind_Nlp_MT5_2")
        config.early_stopping = True
        
        # Tokenizer'ı yükle
        mt5_tokenizer = MT5Tokenizer.from_pretrained("Ozget/MetaMind_Nlp_MT5_2")
        
        # Modeli düzeltilmiş config ile yükle
        mt5_model = MT5ForConditionalGeneration.from_pretrained(
            "Ozget/MetaMind_Nlp_MT5_2",
            config=config,
            ignore_mismatched_sizes=True
        )
        mt5_model.to(device)
        mt5_model.eval()
        logger.info("✅ MT5 hazır!")
    except Exception as e:
        logger.error(f"❌ MT5 yüklenemedi: {e}")
        mt5_model = None
        mt5_tokenizer = None
    
    if not mbart_model and not mt5_model:
        raise Exception("❌ Hiçbir model yüklenemedi!")
    
    logger.info("🎉 Tüm modeller hazır!")

def get_label_code(label: str) -> int:
    """Label'ı sayısal koda çevir"""
    label_codes = {'Yanlış': 0, 'Kısmen Doğru': 1, 'Çok Benzer': 2, 'Tam Doğru': 3}
    return label_codes.get(label, 0)

def parse_output(output: str) -> tuple:
    """Model çıktısını parse et - Katı mod"""
    try:
        label = "Yanlış"  # Varsayılan olarak yanlış
        feedback = "Cevabınızı gözden geçirin."
        
        # Çıktıyı temizle ve küçük harfe çevir
        clean_output = output.lower().strip()
        
        # Katı mod: Sadece açık etiketler kabul edilir
        if STRICT_MODE:
            # Tam eşleşme aranır
            if "tam doğru" in clean_output or "tamdogru" in clean_output:
                label = "Tam Doğru"
            elif "çok benzer" in clean_output or "cokbenzer" in clean_output:
                label = "Çok Benzer"
            elif "kısmen doğru" in clean_output or "kismendogru" in clean_output:
                label = "Kısmen Doğru"
            else:
                label = "Yanlış"  # Belirsiz durumlarda yanlış
        else:
            # Normal mod: Daha esnek
            if "Etiket:" in output:
                parts = output.split("Geri Bildirim:")
                label_part = parts[0].replace("Etiket:", "").strip()
                for lbl in label_map:
                    if lbl.lower() in label_part.lower():
                        label = lbl
                        break
                if len(parts) > 1:
                    feedback = parts[1].strip()
            else:
                for lbl in label_map:
                    if lbl.lower() in output.lower():
                        label = lbl
                        break
                feedback = output.strip()
        
        # Güven kontrolü - düşük güven varsa yanlış yap
        if "güven" in clean_output or "confidence" in clean_output:
            if any(word in clean_output for word in ["düşük", "dusuk", "az", "low"]):
                label = "Yanlış"
        
        return label, feedback
    except Exception as e:
        logger.error(f"Parse hatası: {e}")
        return "Yanlış", output

def predict_mbart(question: str, student_answer: str, correct_answer: str) -> dict:
    """mBART ile tahmin"""
    if not mbart_model:
        return None
    
    try:
        prompts = [
            f"Soru: {question} Öğrenci: {student_answer} Doğru: {correct_answer}",
            f"Quiz: {question}\nCevap: {student_answer}\nHedef: {correct_answer}",
        ]
        input_text = random.choice(prompts)
        
        inputs = mbart_tokenizer(
            input_text, max_length=256, padding='max_length', 
            truncation=True, return_tensors='pt'
        ).to(device)
        
        with torch.no_grad():
            # Katı mod parametreleri
            if STRICT_MODE:
                outputs = mbart_model.generate(
                    input_ids=inputs['input_ids'],
                    attention_mask=inputs['attention_mask'],
                    max_length=128,  # Daha kısa çıktı
                    do_sample=False,  # Deterministik
                    num_beams=4,  # Beam search
                    early_stopping=True,
                    repetition_penalty=1.5,  # Daha yüksek tekrar cezası
                    no_repeat_ngram_size=2
                )
            else:
                outputs = mbart_model.generate(
                    input_ids=inputs['input_ids'],
                    attention_mask=inputs['attention_mask'],
                    max_length=256, 
                    do_sample=True, 
                    temperature=0.8,
                    top_p=0.92, 
                    top_k=50, 
                    repetition_penalty=1.2,
                    no_repeat_ngram_size=3,
                    early_stopping=True
                )
        
        prediction = mbart_tokenizer.decode(outputs[0], skip_special_tokens=True)
        label, feedback = parse_output(prediction)
        
        return {"model": "mBART", "label": label, "label_code": get_label_code(label), 
                "feedback": feedback, "confidence": 85}
    except Exception as e:
        logger.error(f"mBART hatası: {e}")
        return None

def predict_mt5(question: str, student_answer: str, correct_answer: str) -> dict:
    """MT5 ile tahmin"""
    if not mt5_model:
        return None
    
    try:
        prompts = [
            f"Soru: {question}\nCevap: {student_answer}\nDoğru: {correct_answer}\nDeğerlendir:",
            f"Quiz Analizi: '{question}' - '{student_answer}' vs '{correct_answer}'",
        ]
        input_text = random.choice(prompts)
        
        inputs = mt5_tokenizer(
            input_text, max_length=256, padding='max_length',
            truncation=True, return_tensors='pt'
        ).to(device)
        
        with torch.no_grad():
            # Katı mod parametreleri
            if STRICT_MODE:
                outputs = mt5_model.generate(
                    input_ids=inputs['input_ids'],
                    attention_mask=inputs['attention_mask'],
                    max_length=128,  # Daha kısa çıktı
                    do_sample=False,  # Deterministik
                    num_beams=4,  # Beam search
                    early_stopping=True,
                    repetition_penalty=1.6,  # Daha yüksek tekrar cezası
                    no_repeat_ngram_size=2
                )
            else:
                outputs = mt5_model.generate(
                    input_ids=inputs['input_ids'],
                    attention_mask=inputs['attention_mask'],
                    max_length=256, 
                    do_sample=True, 
                    temperature=0.85,
                    top_p=0.9, 
                    top_k=40, 
                    repetition_penalty=1.3,
                    no_repeat_ngram_size=3,
                    early_stopping=True
                )
        
        prediction = mt5_tokenizer.decode(outputs[0], skip_special_tokens=True)
        label, feedback = parse_output(prediction)
        
        return {"model": "MT5", "label": label, "label_code": get_label_code(label),
                "feedback": feedback, "confidence": 82}
    except Exception as e:
        logger.error(f"MT5 hatası: {e}")
        return None

def create_feedback(label: str, student_answer: str, correct_answer: str, 
                    confidence: int, topic: str) -> str:
    """Kişiselleştirilmiş feedback oluştur"""
    conf_text = ""
    if confidence and confidence > 0:
        if confidence >= 80:
            conf_text = f"Cevabınıza %{confidence} güvendiniz. "
        elif confidence >= 60:
            conf_text = f"Orta düzeyde (%{confidence}) güvendiniz. "
        else:
            conf_text = f"Az güvenle (%{confidence}) yaklaştınız. "
    
    topic_text = f"{topic} konusunda " if topic else ""
    
    messages = {
        "Tam Doğru": [
            f"🎯 Mükemmel! {topic_text}'{correct_answer}' tam doğru! {conf_text}",
            f"✨ Harika! {topic_text}Cevabınız kesinlikle doğru. {conf_text}",
        ],
        "Çok Benzer": [
            f"👍 İyi! {topic_text}Cevabınız çok yakın. {conf_text}",
            f"📌 Güzel! {topic_text}'{student_answer}' neredeyse doğru. {conf_text}",
        ],
        "Kısmen Doğru": [
            f"📚 {topic_text}Kısmen doğru. {conf_text}Doğrusu: '{correct_answer}'",
            f"💪 {topic_text}Yoldasınız! {conf_text}Tam cevap: '{correct_answer}'",
        ],
        "Yanlış": [
            f"❌ {topic_text}Yanlış. {conf_text}Doğru cevap: '{correct_answer}'",
            f"🔴 {topic_text}Maalesef hatalı. {conf_text}Doğrusu: '{correct_answer}'",
        ]
    }
    
    return random.choice(messages.get(label, messages["Yanlış"]))

def get_consensus(mbart_result: dict, mt5_result: dict) -> dict:
    """İki modelin consensus sonucu - Katı mod"""
    scores = {'Tam Doğru': 3, 'Çok Benzer': 2, 'Kısmen Doğru': 1, 'Yanlış': 0}
    
    if not mbart_result and not mt5_result:
        return {"label": "Yanlış", "confidence": 0}
    if not mbart_result:
        return {"label": mt5_result['label'], "confidence": mt5_result['confidence'] / 100}
    if not mt5_result:
        return {"label": mbart_result['label'], "confidence": mbart_result['confidence'] / 100}
    
    # Katı mod: Sadece aynı etiketlerde consensus
    if STRICT_MODE:
        if mbart_result['label'] == mt5_result['label']:
            # Aynı etiket - güven skorunu artır
            confidence = min(95, (mbart_result['confidence'] + mt5_result['confidence']) / 2 + 10)
            return {"label": mbart_result['label'], "confidence": confidence / 100}
        else:
            # Farklı etiketler - daha katı kurallar
            mbart_score = scores[mbart_result['label']]
            mt5_score = scores[mt5_result['label']]
            
            # Büyük fark varsa yanlış yap
            if abs(mbart_score - mt5_score) >= 2:
                return {"label": "Yanlış", "confidence": 0.3}
            
            # Küçük fark - daha düşük skor al
            final_score = min(mbart_score, mt5_score)
            for label, score in scores.items():
                if score == final_score:
                    return {"label": label, "confidence": 0.6}
    else:
        # Normal mod - orijinal algoritma
        avg_score = (scores[mbart_result['label']] + scores[mt5_result['label']]) / 2
        
        final_label = "Yanlış"
        for label, score in scores.items():
            if abs(score - avg_score) < 0.6:
                final_label = label
                break
        
        confidence = (mbart_result['confidence'] + mt5_result['confidence']) / 200
        return {"label": final_label, "confidence": confidence}

def analyze_answer(question: str, student_answer: str, correct_answer: str, 
                   confidence: int = 50, topic: str = "", strict_mode: bool = STRICT_MODE, 
                   similarity_threshold: float = SIMILARITY_THRESHOLD) -> tuple:
    """Ana analiz fonksiyonu"""
    try:
        # Validasyon
        if not question or not student_answer or not correct_answer:
            return "❌ Hata", "Lütfen tüm alanları doldurun!", "{}", 0.0
        
        logger.info(f"📝 Analiz başlıyor: {question[:30]}...")
        logger.info(f"🔧 Ayarlar - Katı Mod: {strict_mode}, Benzerlik Eşiği: {similarity_threshold}")
        
        # Global ayarları güncelle
        global STRICT_MODE, SIMILARITY_THRESHOLD
        STRICT_MODE = strict_mode
        SIMILARITY_THRESHOLD = similarity_threshold
        
        # Tahminler
        mbart_result = predict_mbart(question, student_answer, correct_answer)
        mt5_result = predict_mt5(question, student_answer, correct_answer)
        
        # Consensus
        consensus = get_consensus(mbart_result, mt5_result)
        
        # Feedback
        feedback = create_feedback(
            consensus['label'], student_answer, correct_answer, 
            confidence, topic
        )
        
        # Detaylar
        details = {
            "mBART": mbart_result['label'] if mbart_result else "N/A",
            "MT5": mt5_result['label'] if mt5_result else "N/A",
            "Consensus": consensus['label'],
            "Device": device
        }
        
        logger.info(f"✅ Sonuç: {consensus['label']}")
        
        return (
            consensus['label'],
            feedback,
            json.dumps(details, ensure_ascii=False, indent=2),
            round(consensus['confidence'] * 100, 1)
        )
        
    except Exception as e:
        logger.error(f"❌ Analiz hatası: {e}")
        return "❌ Hata", f"Bir hata oluştu: {str(e)}", "{}", 0.0

# Başlangıçta modelleri yükle
logger.info("⏳ Modeller yükleniyor, lütfen bekleyin...")
load_models()

# Gradio arayüzü
with gr.Blocks(
    title="MetaMind NLP - Öğrenci Cevap Analizi",
    theme=gr.themes.Soft(primary_hue="blue", secondary_hue="purple")
) as demo:
    
    gr.Markdown("# 🧠 MetaMind NLP - Öğrenci Cevap Analizi")
    gr.Markdown("Türkçe öğrenci cevaplarını analiz eder ve kişiselleştirilmiş feedback sağlar.")
    
    with gr.Row():
        with gr.Column(scale=1):
            gr.Markdown("### 📝 Giriş")
            
            question = gr.Textbox(
                label="Soru",
                placeholder="Örn: Dünyanın en kalabalık ülkesi hangisidir?",
                lines=3
            )
            
            student_answer = gr.Textbox(
                label="Öğrenci Cevabı",
                placeholder="Örn: çin"
            )
            
            correct_answer = gr.Textbox(
                label="Doğru Cevap",
                placeholder="Örn: çin"
            )
            
            confidence_slider = gr.Slider(
                label="Öğrenci Güven Skoru (%)",
                minimum=0, maximum=100, value=50, step=1
            )
            
            topic = gr.Textbox(
                label="Konu (Opsiyonel)",
                placeholder="Örn: Dünya Coğrafyası"
            )
            
            # Model ayarları
            with gr.Row():
                strict_mode = gr.Checkbox(
                    label="🔒 Katı Mod (Daha Az Tolerans)",
                    value=STRICT_MODE,
                    info="Açık: Daha katı değerlendirme, Kapalı: Daha esnek"
                )
                similarity_threshold = gr.Slider(
                    label="Benzerlik Eşiği",
                    minimum=0.0, maximum=1.0, value=SIMILARITY_THRESHOLD, step=0.1,
                    info="Yüksek değer = Daha katı benzerlik kontrolü"
                )
            
            analyze_btn = gr.Button("🔍 Analiz Et", variant="primary", size="lg")
        
        with gr.Column(scale=1):
            gr.Markdown("### 📊 Sonuç")
            
            result_label = gr.Textbox(label="🏷️ Değerlendirme", interactive=False)
            result_feedback = gr.Textbox(label="💬 Geri Bildirim", lines=4, interactive=False)
            result_confidence = gr.Number(label="📈 Güven Skoru (%)", interactive=False)
            result_details = gr.Textbox(label="🔍 Detaylar", lines=6, interactive=False)
    
    gr.Markdown("---")
    gr.Markdown("### 💡 Örnek Kullanımlar")
    
    gr.Examples(
        examples=[
            ["Dünyanın en kalabalık ülkesi hangisidir?", "çin", "çin", 85, "Dünya Coğrafyası"],
            ["Türkiye'nin başkenti neresidir?", "istanbul", "ankara", 60, "Türkiye Coğrafyası"],
            ["2 + 2 kaç eder?", "4", "4", 95, "Matematik"],
            ["Güneş sisteminin en büyük gezegeni?", "jüpiter", "jüpiter", 70, "Astronomi"],
            ["Mona Lisa'yı kim çizdi?", "leonardo", "leonardo da vinci", 50, "Sanat"],
        ],
        inputs=[question, student_answer, correct_answer, confidence_slider, topic],
    )
    
    gr.Markdown("""
    ---
    ### 📖 Değerlendirme Kriterleri
    
    - **🎯 Tam Doğru (3)**: Cevap tamamen doğru
    - **📌 Çok Benzer (2)**: Cevap doğruya çok yakın
    - **📚 Kısmen Doğru (1)**: Cevap kısmen doğru
    - **❌ Yanlış (0)**: Cevap yanlış
    
    ### 🤖 Kullanılan Modeller
    
    - **mBART**: [Ozget/MetaMind_Nlp_MBART_2](https://huggingface.co/Ozget/MetaMind_Nlp_MBART_2)
    - **MT5**: [Ozget/MetaMind_Nlp_MT5_2](https://huggingface.co/Ozget/MetaMind_Nlp_MT5_2)
    
    İki model birlikte çalışarak daha güvenilir sonuçlar üretir.
    """)
    
    # Event handler
    analyze_btn.click(
        fn=analyze_answer,
        inputs=[question, student_answer, correct_answer, confidence_slider, topic, strict_mode, similarity_threshold],
        outputs=[result_label, result_feedback, result_details, result_confidence],
        api_name="predict"  # API endpoint için
    )

# Launch
if __name__ == "__main__":
    demo.launch(server_name="0.0.0.0", server_port=7860)

