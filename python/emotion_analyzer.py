import sys
import json
import math
from deepface import DeepFace


def calculate_contextual_confidence(emotions):
    """
    Bağlamsal Güven Skoru Hesaplama
    
    Literatür Temeli:
    - Shannon (1948): Entropy ile belirsizlik ölçümü
    - Russell (1980): Valence (pozitif/negatif) modeli
    - Efklides (2008): Net duygusal durum → Yüksek metacognitive güven
    
    Mantık:
    1. Düşük belirsizlik (entropy) = Yüksek güven
    2. Pozitif duygu > Negatif duygu = Yüksek güven
    3. İkisini birleştir
    
    Args:
        emotions: DeepFace'den gelen duygu skorları (yüzde değerleri)
    
    Returns:
        dict: Güven skoru, kesinlik, ton ve açıklama ile tüm ara değerler
    """
    
    # 1. GİRDİ KONTROLÜ
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
    
    # 2. KESİNLİK HESABI (Entropy)
    # Shannon (1948): Düşük entropy = Net duygusal durum = Yüksek kesinlik
    entropy = 0
    for prob in emotions.values():
        p = prob / total  # Olasılık haline getir
        if p > 0:
            entropy -= p * math.log2(p)
    
    max_entropy = math.log2(7)  # 7 duygu var
    certainty = (1 - entropy / max_entropy) * 100  # 0-100
    
    # 3. DUYGUSAL TON (Valence)
    # Russell (1980): Pozitif vs Negatif dengesi
    happy = emotions.get('happy', 0)
    negative = (emotions.get('sad', 0) +
                emotions.get('fear', 0) +
                emotions.get('angry', 0) +
                emotions.get('disgust', 0))
    
    valence = happy - negative  # Negatif ile pozitif arası
    
    # 4. SURPRISE AYARLAMASI
    # Reisenzein (2000): Surprise valence-belirsiz, bağlama göre yorumlanır
    surprise = emotions.get('surprise', 0)
    adjusted_valence = valence
    surprise_contribution = 0
    surprise_reason = 'Nötr Etki'
    
    if surprise > 0.3 * total:  # Surprise önemliyse
        if valence > 0:
            # Pozitif bağlam: Surprise güçlendirir
            surprise_contribution = surprise * 0.5
            adjusted_valence += surprise_contribution
            surprise_reason = 'Pozitif (Mutluluk Baskın)'
        elif valence < 0:
            # Negatif bağlam: Surprise zayıflatır (şok etkisi)
            surprise_contribution = -surprise * 0.3
            adjusted_valence += surprise_contribution
            surprise_reason = 'Negatif (Olumsuz Duygular Baskın)'
        # Nötr bağlam: Surprise etkisiz
    
    # 5. NEUTRAL ETKİSİ
    # Yüksek neutral = Düşük bilişsel yük AMA düşük katılım olabilir
    # Orta neutral (0.3-0.6) optimal
    neutral = emotions.get('neutral', 0)
    neutral_penalty = 0
    
    if neutral > 0.7 * total:
        # Çok fazla neutral: İlgisizlik olabilir
        neutral_penalty = (neutral / total - 0.7) * 0.5
    
    # 6. FİNAL SKOR HESABI
    # Kesinlik (60%) + Duygusal Ton (40%)
    certainty_component = certainty / 100  # 0-1
    emotion_component = (adjusted_valence / total + 1) / 2  # 0-1'e normalize
    
    final_score = (certainty_component * 0.6 + emotion_component * 0.4) * 100
    final_score = max(0, min(100, final_score - neutral_penalty * 100))
    
    # 7. AÇIKLAMA OLUŞTUR
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


def main():
    if len(sys.argv) < 2:
        print(json.dumps({"error": "No image path provided"}))
        sys.exit(1)
    
    img_path = sys.argv[1]
    
    try:
        # Emotion analysis
        result = DeepFace.analyze(
            img_path=img_path,
            actions=['emotion'],
            enforce_detection=False
        )
        
        emotions = result[0]['emotion']
        
        # Convert np.float32 values to Python float
        emotions_float = {k: float(v) for k, v in emotions.items()}
        
        # Apply contextual confidence formula
        confidence_result = calculate_contextual_confidence(emotions_float)
        
        # Normalize emotions to percentages
        total = sum(emotions_float.values())
        emotions_percent = {k: round(v / total * 100, 1) for k, v in emotions_float.items()}
        
        # Create JSON output (same format as before)
        output_data = {
            "confidence_score": round(confidence_result['score'], 1),
            "details": confidence_result,
            "emotions": emotions_percent
        }
        
        # Print formatted JSON
        print(json.dumps(output_data, ensure_ascii=False))
        
    except Exception as e:
        print(json.dumps({"error": str(e)}))
        sys.exit(1)


if __name__ == "__main__":
    main()
