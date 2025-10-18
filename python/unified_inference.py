#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
Unified Inference - mBART + MT5 Consensus Model
Kişiselleştirilmiş feedback sistemi ile
"""

import sys
import io
import json
import torch
import logging
import random
from pathlib import Path
from transformers import MBartForConditionalGeneration, MBartTokenizer
from transformers import MT5ForConditionalGeneration, MT5Tokenizer

# Windows için encoding ayarı
if sys.platform == 'win32':
    sys.stdout = io.TextIOWrapper(sys.stdout.buffer, encoding='utf-8', errors='replace')
    sys.stderr = io.TextIOWrapper(sys.stderr.buffer, encoding='utf-8', errors='replace')

# Logging
logging.basicConfig(level=logging.INFO, format='%(asctime)s - %(levelname)s - %(message)s')
logger = logging.getLogger(__name__)

class UnifiedInference:
    def __init__(self):
        """Initialize unified inference system"""
        logger.info("🚀 Unified Inference başlatılıyor...")
        
        # Device
        self.device = "cuda" if torch.cuda.is_available() else "cpu"
        logger.info(f"🖥️  Cihaz: {self.device}")
        
        # Model paths - Hugging Face'ten yükle
        self.mbart_path = "Ozget/MetaMind_Nlp_MBART_2"
        self.mt5_path = "Ozget/MetaMind_Nlp_MT5_2"
        
        logger.info(f"📂 mBART model: {self.mbart_path}")
        logger.info(f"📂 MT5 model: {self.mt5_path}")
        
        # Models
        self.mbart_model = None
        self.mbart_tokenizer = None
        self.mt5_model = None
        self.mt5_tokenizer = None
        
        # Label mapping
        self.label_map = ['Yanlış', 'Kısmen Doğru', 'Çok Benzer', 'Tam Doğru']
        
    def load_models(self):
        """Tüm modelleri yükle"""
        try:
            logger.info("📦 Modeller Hugging Face'ten yükleniyor...")
            
            # mBART yükle
            try:
                logger.info(f"📥 mBART yükleniyor: {self.mbart_path}")
                self.mbart_tokenizer = MBartTokenizer.from_pretrained(self.mbart_path)
                self.mbart_model = MBartForConditionalGeneration.from_pretrained(self.mbart_path)
                self.mbart_model.to(self.device)
                self.mbart_model.eval()
                logger.info("✅ mBART hazır!")
            except Exception as e:
                logger.warning(f"⚠️ mBART yüklenemedi: {e}")
            
            # MT5 yükle
            try:
                logger.info(f"📥 MT5 yükleniyor: {self.mt5_path}")
                self.mt5_tokenizer = MT5Tokenizer.from_pretrained(self.mt5_path)
                self.mt5_model = MT5ForConditionalGeneration.from_pretrained(self.mt5_path)
                self.mt5_model.to(self.device)
                self.mt5_model.eval()
                logger.info("✅ MT5 hazır!")
            except Exception as e:
                logger.warning(f"⚠️ MT5 yüklenemedi: {e}")
            
            # En az bir model yüklenmeli
            if not self.mbart_model and not self.mt5_model:
                raise Exception("Hiçbir model yüklenemedi!")
            
            logger.info("🎉 Tüm modeller yüklendi!")
            
            # Modellerin hazır olduğunu bildir
            print(json.dumps({
                "status": "models_loaded",
                "success": True,
                "mbart_loaded": self.mbart_model is not None,
                "mt5_loaded": self.mt5_model is not None
            }, ensure_ascii=False), flush=True)
            
        except Exception as e:
            logger.error(f"❌ Model yükleme hatası: {e}")
            print(json.dumps({
                "status": "models_failed",
                "success": False,
                "error": str(e)
            }, ensure_ascii=False), flush=True)
            raise
    
    def predict_with_mbart(self, question: str, student_answer: str, correct_answer: str) -> dict:
        """mBART ile tahmin - Her seferinde UNIQUE çıktı"""
        if not self.mbart_model:
            return None
        
        try:
            # mBART için farklı prompt varyasyonları
            prompt_variants = [
                f"Soru: {question} Öğrenci Cevabı: {student_answer} Hedef Cevap: {correct_answer}",
                f"Quiz: {question}\nCevap: {student_answer}\nDoğru: {correct_answer}",
                f"Değerlendirme: '{question}' sorusuna '{student_answer}' cevabı. Beklenen: '{correct_answer}'",
                f"Analiz: Soru='{question}', Verilen='{student_answer}', Hedef='{correct_answer}'",
            ]
            input_text = random.choice(prompt_variants)
            
            inputs = self.mbart_tokenizer(
                input_text,
                max_length=256,
                padding='max_length',
                truncation=True,
                return_tensors='pt'
            ).to(self.device)
            
            # UNIQUE generation parametreleri
            with torch.no_grad():
                outputs = self.mbart_model.generate(
                    input_ids=inputs['input_ids'],
                    attention_mask=inputs['attention_mask'],
                    max_length=256,
                    do_sample=True,  # Sampling aktif - her seferinde farklı
                    temperature=0.8,  # Yaratıcılık
                    top_p=0.92,  # Nucleus sampling
                    top_k=50,  # Top-K sampling
                    repetition_penalty=1.2,  # Tekrarları azalt
                    no_repeat_ngram_size=3  # 3-gram tekrarı engelle
                )
            
            prediction = self.mbart_tokenizer.decode(outputs[0], skip_special_tokens=True)
            label, feedback = self.parse_output(prediction)
            label_code = self.get_label_code(label)
            
            return {
                "model": "mBART",
                "raw_output": prediction,
                "label": label,
                "label_code": label_code,
                "feedback": feedback,
                "confidence": 85
            }
        except Exception as e:
            logger.error(f"mBART prediction error: {e}")
            return None
    
    def predict_with_mt5(self, question: str, student_answer: str, correct_answer: str) -> dict:
        """MT5 ile tahmin - Her seferinde UNIQUE çıktı"""
        if not self.mt5_model:
            return None
        
        try:
            # MT5 için farklı prompt varyasyonları
            prompt_variants = [
                f"Soru: {question}\nCevap: {student_answer}\nDoğru: {correct_answer}\nPuanla ve yorum yap:",
                f"Öğrenci Değerlendirme:\nSoru: {question}\nVerilen Cevap: {student_answer}\nBeklenen: {correct_answer}",
                f"Quiz Analizi:\n'{question}' sorusuna '{student_answer}' cevabı verildi. Doğrusu '{correct_answer}'. Değerlendir:",
                f"Akademik Değerlendirme:\nSoru: {question}\nÖğrencinin Yorumu: {student_answer}\nStandart Cevap: {correct_answer}\nFeedback:",
            ]
            input_text = random.choice(prompt_variants)
            
            inputs = self.mt5_tokenizer(
                input_text,
                max_length=256,
                padding='max_length',
                truncation=True,
                return_tensors='pt'
            ).to(self.device)
            
            # UNIQUE generation parametreleri - MT5 için biraz daha yaratıcı
            with torch.no_grad():
                outputs = self.mt5_model.generate(
                    input_ids=inputs['input_ids'],
                    attention_mask=inputs['attention_mask'],
                    max_length=256,
                    do_sample=True,  # Sampling aktif
                    temperature=0.85,  # MT5 için biraz daha yaratıcı
                    top_p=0.9,  # Nucleus sampling
                    top_k=40,  # Top-K sampling
                    repetition_penalty=1.3,  # Tekrarları daha fazla azalt
                    no_repeat_ngram_size=3  # 3-gram tekrarı engelle
                )
            
            prediction = self.mt5_tokenizer.decode(outputs[0], skip_special_tokens=True)
            label, feedback = self.parse_output(prediction)
            label_code = self.get_label_code(label)
            
            return {
                "model": "MT5",
                "raw_output": prediction,
                "label": label,
                "label_code": label_code,
                "feedback": feedback,
                "confidence": 82
            }
        except Exception as e:
            logger.error(f"MT5 prediction error: {e}")
            return None
    
    def get_label_code(self, label: str) -> int:
        """Label'ı sayısal koda çevir"""
        label_codes = {
            'Yanlış': 0,
            'Kısmen Doğru': 1,
            'Çok Benzer': 2,
            'Tam Doğru': 3
        }
        return label_codes.get(label, 0)
    
    def parse_output(self, output: str) -> tuple:
        """Model output'unu parse et"""
        try:
            label = "Yanlış"
            feedback = "Cevabınızı gözden geçirin."
            
            if "Etiket:" in output:
                parts = output.split("Geri Bildirim:")
                
                label_part = parts[0].replace("Etiket:", "").strip()
                for lbl in self.label_map:
                    if lbl.lower() in label_part.lower():
                        label = lbl
                        break
                
                if len(parts) > 1:
                    feedback = parts[1].strip()
            else:
                for lbl in self.label_map:
                    if lbl.lower() in output.lower():
                        label = lbl
                        break
                feedback = output.strip()
            
            return label, feedback
            
        except Exception as e:
            logger.error(f"Parse error: {e}")
            return "Yanlış", output
    
    def create_personalized_feedback(self, label: str, student_answer: str, correct_answer: str, 
                                     student_confidence: int, topic: str, question: str) -> str:
        """Konuyu ve güven skorunu içeren özel feedback oluştur"""
        
        # Güven skoru analizi
        conf_text = ""
        if student_confidence is not None:
            if student_confidence >= 80:
                conf_text = f"Cevabınıza %{student_confidence} güvenle yaklaştınız. "
            elif student_confidence >= 60:
                conf_text = f"Cevabınıza orta düzeyde (%{student_confidence}) güvendiniz. "
            elif student_confidence >= 40:
                conf_text = f"Cevabınıza %{student_confidence} güvenle yaklaştınız, bu da tereddütleriniz olduğunu gösteriyor. "
            else:
                conf_text = f"Cevabınıza çok az (%{student_confidence}) güvendiniz. "
        
        # Konu bilgisi
        topic_text = f"{topic} konusunda " if topic else ""
        
        # Label'a göre özel mesajlar
        if label == "Tam Doğru":
            messages = [
                f"🎯 Mükemmel! {topic_text}'{correct_answer}' cevabını tam doğru verdiniz. {conf_text}Bilginiz ve farkındalığınız harika!",
                f"✨ Harika! {topic_text}cevabınız tamamen doğru. {conf_text}Bu konuda kendinize güvenebilirsiniz!",
                f"🌟 Süper! {topic_text}'{student_answer}' cevabı kesinlikle doğru. {conf_text}Tebrikler!",
                f"💯 Mükemmel performans! {topic_text}cevabınız birebir doğru. {conf_text}Böyle devam edin!"
            ]
        elif label == "Çok Benzer":
            messages = [
                f"👍 İyi! {topic_text}cevabınız çok yakın. {conf_text}Doğru yoldasınız, küçük detaylara dikkat ederseniz mükemmel olacak!",
                f"📌 Güzel! {topic_text}cevabınız doğruya çok benziyor. {conf_text}Biraz daha kesinlik kazanırsanız tam puan!",
                f"✅ Yaklaştınız! {topic_text}'{student_answer}' cevabınız doğruya oldukça yakın. {conf_text}İyi gidiyorsunuz!",
                f"🎯 Neredeyse! {topic_text}cevabınız çok iyi. {conf_text}Küçük bir ince ayar ile mükemmel olacak!"
            ]
        elif label == "Kısmen Doğru":
            messages = [
                f"📚 {topic_text}cevabınız kısmen doğru. {conf_text}Konuyu biraz daha pekiştirmenizi öneririm. Doğru cevap: '{correct_answer}'",
                f"💪 {topic_text}yoldasınız ama tam değil. {conf_text}'{correct_answer}' şeklinde olması gerekiyordu. Biraz daha çalışma ile başarırsınız!",
                f"🔄 {topic_text}cevabınızda doğrular var. {conf_text}Ama tam değil. Doğrusu '{correct_answer}'. Bu konuyu gözden geçirin!",
                f"📖 {topic_text}yaklaştınız. {conf_text}Ancak '{correct_answer}' olması gerekiyordu. Bu konuda biraz daha pratik yapın!"
            ]
        else:  # Yanlış
            messages = [
                f"❌ {topic_text}cevabınız yanlış. {conf_text}Doğru cevap '{correct_answer}'. Bu konuyu tekrar çalışmanızı öneririm.",
                f"🔴 {topic_text}maalesef doğru değil. {conf_text}'{correct_answer}' olması gerekiyordu. Bu konuya daha fazla zaman ayırın!",
                f"📕 {topic_text}'{student_answer}' cevabı yanlış. {conf_text}Doğrusu '{correct_answer}'. Bu konuyu gözden geçirin!",
                f"⚠️ {topic_text}cevabınız hatalı. {conf_text}Doğru cevap '{correct_answer}'. Konu tekrarı yapmanız faydalı olacak!"
            ]
        
        return random.choice(messages)
    
    def get_consensus_result(self, mbart_result: dict, mt5_result: dict) -> dict:
        """İki modelin sonucunu birleştir"""
        
        label_scores = {
            'Tam Doğru': 3,
            'Çok Benzer': 2,
            'Kısmen Doğru': 1,
            'Yanlış': 0
        }
        
        # Her iki model de çalışmadıysa
        if not mbart_result and not mt5_result:
            return {
                "final_label": "Yanlış",
                "final_feedback": "Model analizi başarısız oldu.",
                "confidence": 0
            }
        
        # Sadece bir model çalıştıysa
        if not mbart_result:
            return {
                "final_label": mt5_result['label'],
                "final_feedback": mt5_result['feedback'],
                "confidence": mt5_result['confidence'] / 100
            }
        if not mt5_result:
            return {
                "final_label": mbart_result['label'],
                "final_feedback": mbart_result['feedback'],
                "confidence": mbart_result['confidence'] / 100
            }
        
        # Her iki model de çalışıyorsa - konsensüs
        mbart_score = label_scores.get(mbart_result['label'], 0)
        mt5_score = label_scores.get(mt5_result['label'], 0)
        
        # Ortalama skor
        avg_score = (mbart_score + mt5_score) / 2
        
        # En yakın label'ı bul
        final_label = "Yanlış"
        for label, score in label_scores.items():
            if abs(score - avg_score) < 0.6:
                final_label = label
                break
        
        # Feedback - daha detaylı olanı seç
        final_feedback = mbart_result['feedback'] if len(mbart_result['feedback']) > len(mt5_result['feedback']) else mt5_result['feedback']
        
        # Confidence - ortalama
        confidence = (mbart_result['confidence'] + mt5_result['confidence']) / 200  # Normalize to 0-1
        
        return {
            "final_label": final_label,
            "final_feedback": final_feedback,
            "confidence": confidence
        }
    
    def analyze(self, question: str, student_answer: str, correct_answer: str, student_confidence: int = None, topic: str = None) -> dict:
        """Ana analiz fonksiyonu"""
        try:
            logger.info(f"📝 Analiz başlıyor...")
            logger.info(f"Soru: {question[:50]}...")
            logger.info(f"Öğrenci: {student_answer[:50]}...")
            
            mbart_result = self.predict_with_mbart(question, student_answer, correct_answer)
            mt5_result = self.predict_with_mt5(question, student_answer, correct_answer)
            
            consensus = self.get_consensus_result(mbart_result, mt5_result)
            
            # Özel feedback - konuyu ve güven skorunu içeren
            personalized_feedback = self.create_personalized_feedback(
                consensus['final_label'],
                student_answer,
                correct_answer,
                student_confidence,
                topic,
                question
            )
            
            agent_result = {
                "chosen_model": "mBART + MT5 Consensus",
                "label": consensus['final_label'],
                "feedback": personalized_feedback,
                "confidence": consensus['confidence'],
                "reasoning": f"mBART ve MT5 modellerinin ortak kararı. İki model birlikte '{consensus['final_label']}' sonucuna vardı."
            }
            
            result = {
                "success": True,
                "models": {
                    "mbart": mbart_result if mbart_result else {"label": "Analiz başarısız", "label_code": 0, "feedback": "Model yüklenmedi", "confidence": 0},
                    "mt5": mt5_result if mt5_result else {"label": "Analiz başarısız", "label_code": 0, "feedback": "Model yüklenmedi", "confidence": 0},
                    "agent": agent_result
                },
                "consensus": consensus,
                "label": consensus['final_label'],
                "feedback": personalized_feedback,
                "confidence": consensus['confidence']
            }
            
            logger.info(f"✅ Analiz tamamlandı: {consensus['final_label']}")
            return result
            
        except Exception as e:
            logger.error(f"❌ Analiz hatası: {e}")
            return {
                "success": False,
                "error": str(e),
                "label": "Yanlış",
                "feedback": "Analiz sırasında hata oluştu.",
                "models": {
                    "mbart": {"label": "Hata", "label_code": 0, "feedback": str(e), "confidence": 0},
                    "mt5": {"label": "Hata", "label_code": 0, "feedback": str(e), "confidence": 0},
                    "agent": {"chosen_model": "None", "label": "Hata", "feedback": str(e), "confidence": 0, "reasoning": "Hata oluştu"}
                }
            }

def main():
    """Ana fonksiyon - stdin'den JSON al, stdout'a JSON yaz"""
    
    inferencer = UnifiedInference()
    inferencer.load_models()
    
    logger.info("🎧 İstekler bekleniyor (stdin)...")
    
    for line in sys.stdin:
        try:
            line = line.strip()
            if not line:
                continue
                
            data = json.loads(line)
            question = data.get('question', '')
            student_answer = data.get('student_answer', '')
            correct_answer = data.get('correct_answer', '')
            student_confidence = data.get('student_confidence', None)  # Yeni
            topic = data.get('topic', None)  # Yeni
            
            result = inferencer.analyze(question, student_answer, correct_answer, student_confidence, topic)
            
            print(json.dumps(result, ensure_ascii=False), flush=True)
                
        except json.JSONDecodeError as e:
            logger.error(f"JSON parse hatası: {e}")
            print(json.dumps({
                "success": False,
                "error": f"Invalid JSON: {e}"
            }), flush=True)
        except Exception as e:
            logger.error(f"İşlem hatası: {e}")
            print(json.dumps({
                "success": False,
                "error": str(e)
            }), flush=True)

if __name__ == "__main__":
    main()

