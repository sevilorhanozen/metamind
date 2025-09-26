export type EmotionMap = {
	angry?: number;
	disgust?: number;
	fear?: number;
	happy?: number;
	sad?: number;
	surprise?: number;
	neutral?: number;
};

export type ConfidenceResult = {
	score: number;
	happyTotal: number;
	negativeTotal: number;
	neutralImpact: number;
	surpriseContribution: number;
	surpriseReason: string;
	baseCalculation: number;
};

export function calculateContextualConfidence(emotions: EmotionMap): ConfidenceResult {
	const emotionEntries = Object.entries(emotions as Record<string, number>);
	emotionEntries.sort((a, b) => (b[1] ?? 0) - (a[1] ?? 0));

	const dominantEmotion = emotionEntries.length ? emotionEntries[0][0] : 'neutral';

	const happyScore = emotions.happy || 0;
	const surpriseScore = emotions.surprise || 0;
	const neutralScore = emotions.neutral || 0;

	const negativeEmotions = ['sad', 'fear', 'angry', 'disgust'] as const;
	const negativeScore = negativeEmotions.reduce((sum, e) => sum + (emotions[e] || 0), 0);

	let finalScore = 0;
	let surpriseContribution = 0;
	let surpriseReason = 'Nötr Etki';

	// 1) Base score
	finalScore += happyScore - negativeScore - neutralScore;

	// 2) Surprise contribution depends on dominant emotion context
	if (dominantEmotion === 'happy') {
		surpriseContribution = surpriseScore;
		surpriseReason = 'Pozitif (Baskın Mutluluk)';
	} else if ((negativeEmotions as readonly string[]).includes(dominantEmotion)) {
		surpriseContribution = -surpriseScore;
		surpriseReason = 'Negatif (Baskın Olumsuz)';
	} else if (dominantEmotion === 'surprise') {
		if (happyScore > negativeScore) {
			surpriseContribution = surpriseScore;
			surpriseReason = 'Pozitif (Pozitifler Güçlü)';
		} else {
			surpriseContribution = -surpriseScore;
			surpriseReason = 'Negatif (Olumsuzlar Güçlü)';
		}
	}

	finalScore += surpriseContribution;

	// 3) Normalize to 0-100
	const normalizedScore = Math.max(0, Math.min(100, (finalScore + 100) / 2));

	return {
		score: normalizedScore,
		happyTotal: happyScore,
		negativeTotal: negativeScore,
		neutralImpact: neutralScore,
		surpriseContribution,
		surpriseReason,
		baseCalculation: finalScore,
	};
}


