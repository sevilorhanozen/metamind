import sys
import json
import math
from deepface import DeepFace
import os

# Model'i başlangıçta yükle
print("Loading model...", file=sys.stderr, flush=True)
try:
    DeepFace.build_model("Emotion")
    print("Model loaded successfully", file=sys.stderr, flush=True)
except Exception as e:
    print(f"Model load error: {e}", file=sys.stderr, flush=True)


def calculate_contextual_confidence(emotions):
    """
    Bağlamsal Güven Skoru Hesaplama
    """
    total = sum(emotions.values())
    
    if total == 0:
        return {
            'score': 50.0,
            'certainty': 0.0,
            'emotionalTone': 'belirsiz',
            'explanation': 'Duygu tespiti yapılamadı',
            'happy_total': 0,
            'negative_total': 0,
            'neutral_impact': 0,
            'surprise_contribution': 0,
            'valence': 0,
            'entropy': 0
        }
    
    # Entropy hesabı
    entropy = 0
    for prob in emotions.values():
        p = prob / total
        if p > 0:
            entropy -= p * math.log2(p)
    
    max_entropy = math.log2(7)
    certainty = (1 - entropy / max_entropy) * 100
    
    # Valence hesabı
    happy = emotions.get('happy', 0)
    negative = (emotions.get('sad', 0) +
                emotions.get('fear', 0) +
                emotions.get('angry', 0) +
                emotions.get('disgust', 0))
    
    valence = happy - negative
    
    # Surprise ayarlaması
    surprise = emotions.get('surprise', 0)
    adjusted_valence = valence
    surprise_contribution = 0
    surprise_reason = 'Nötr Etki'
    
    if surprise > 0.3 * total:
        if valence > 0:
            surprise_contribution = surprise * 0.5
            adjusted_valence += surprise_contribution
            surprise_reason = 'Pozitif (Mutluluk Baskın)'
        elif valence < 0:
            surprise_contribution = -surprise * 0.3
            adjusted_valence += surprise_contribution
            surprise_reason = 'Negatif (Olumsuz Duygular Baskın)'
    
    # Neutral etkisi
    neutral = emotions.get('neutral', 0)
    neutral_penalty = 0
    
    if neutral > 0.7 * total:
        neutral_penalty = (neutral / total - 0.7) * 0.5
    
    # Final skor
    certainty_component = certainty / 100
    emotion_component = (adjusted_valence / total + 1) / 2
    
    final_score = (certainty_component * 0.6 + emotion_component * 0.4) * 100
    final_score = max(0, min(100, final_score - neutral_penalty * 100))
    
    # Duygusal ton
    valence_normalized = adjusted_valence / total
    if valence_normalized > 0.2:
        emotional_tone = 'pozitif'
    elif valence_normalized < -0.2:
        emotional_tone = 'negatif'
    else:
        emotional_tone = 'nötr'
    
    if final_score > 70:
        explanation = f'Yüksek güven: Net {emotional_tone} duygusal durum'
    elif final_score > 50:
        explanation = f'Orta güven: {emotional_tone} ton, orta kesinlik'
    elif final_score > 30:
        explanation = f'Düşük güven: {"Karışık duygular" if certainty < 40 else "Negatif ton"}'
    else:
        explanation = 'Çok düşük güven: Belirsiz duygusal durum'
    
    return {
        'score': round(final_score, 2),
        'certainty': round(certainty, 2),
        'emotionalTone': emotional_tone,
        'explanation': explanation,
        'happy_total': round(happy, 2),
        'negative_total': round(negative, 2),
        'neutral_impact': round(neutral, 2),
        'surprise_contribution': round(surprise_contribution, 2),
        'surprise_reason': surprise_reason,
        'valence': round(valence, 2),
        'adjusted_valence': round(adjusted_valence, 2),
        'entropy': round(entropy, 4),
        'neutral_penalty': round(neutral_penalty, 4)
    }


def analyze_image(img_path):
    """Tek bir resmi analiz et"""
    try:
        result = DeepFace.analyze(
            img_path=img_path,
            actions=['emotion'],
            enforce_detection=False,
            detector_backend='opencv',
            silent=True
        )
        
        emotions = result[0]['emotion']
        emotions_float = {k: float(v) for k, v in emotions.items()}
        
        confidence_result = calculate_contextual_confidence(emotions_float)
        
        total = sum(emotions_float.values())
        emotions_percent = {k: round(v / total * 100, 1) for k, v in emotions_float.items()}
        
        return {
            "confidence_score": round(confidence_result['score'], 1),
            "details": confidence_result,
            "emotions": emotions_percent
        }
    except Exception as e:
        return {"error": str(e)}


def server_mode():
    """Server modu: stdin'den resim yolu oku, stdout'a JSON yaz"""
    # Hazır olduğunu bildir
    print("READY", flush=True)
    
    # Sonsuz döngü: her satır bir resim yolu
    for line in sys.stdin:
        img_path = line.strip()
        
        if not img_path:
            continue
        
        result = analyze_image(img_path)
        print(json.dumps(result, ensure_ascii=False), flush=True)


def single_mode():
    """Tek seferlik mod: komut satırı argümanı"""
    if len(sys.argv) < 2:
        print(json.dumps({"error": "No image path provided"}))
        sys.exit(1)
    
    img_path = sys.argv[1]
    result = analyze_image(img_path)
    print(json.dumps(result, ensure_ascii=False))


if __name__ == "__main__":
    # --server flag var mı kontrol et
    if len(sys.argv) > 1 and sys.argv[1] == '--server':
        server_mode()
    else:
        single_mode()
