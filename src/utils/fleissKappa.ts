/**
 * Fleiss' Kappa Calculator for Inter-rater Reliability
 * Used to calculate agreement between multiple raters on categorical data
 */

export interface RatingData {
    questionId: string;
    dimensionId: string;
    annotatorId: string;
    winner: 'A' | 'B' | 'tie';
}

export interface KappaResult {
    kappa: number;
    interpretation: 'poor' | 'slight' | 'fair' | 'moderate' | 'substantial' | 'almost_perfect';
    raters: number;
    subjects: number;
    categories: {
        A: number;
        B: number;
        tie: number;
    };
}

export interface QuestionKappaResult extends KappaResult {
    questionId: string;
}

export interface DimensionKappaResult {
    dimensionId: string;
    avgKappa: number;
    questionResults: QuestionKappaResult[];
    interpretation: 'poor' | 'slight' | 'fair' | 'moderate' | 'substantial' | 'almost_perfect';
}

/**
 * Interpret Fleiss' kappa value according to simplified classification
 */
export function interpretKappa(kappa: number): 'poor' | 'slight' | 'fair' | 'moderate' | 'substantial' | 'almost_perfect' {
    if (kappa >= 0.8) return 'almost_perfect'; // High Agreement
    if (kappa >= 0.6) return 'substantial'; // Moderate Agreement  
    return 'poor'; // Low Agreement (covers all < 0.6)
}

/**
 * Calculate Fleiss' kappa for a single question across multiple raters
 * @param ratings Array of ratings for a specific question and dimension
 * @returns KappaResult object with kappa score and related metrics
 */
export function calculateQuestionKappa(ratings: RatingData[]): QuestionKappaResult {
    if (ratings.length === 0) {
        return {
            questionId: '',
            kappa: 0,
            interpretation: 'poor',
            raters: 0,
            subjects: 0,
            categories: { A: 0, B: 0, tie: 0 }
        };
    }

    const questionId = ratings[0].questionId;
    const categories = ['A', 'B', 'tie'] as const;
    const raters = new Set(ratings.map(r => r.annotatorId)).size;
    const subjects = 1; // For a single question

    // Count ratings for each category
    const categoryCounts = {
        A: ratings.filter(r => r.winner === 'A').length,
        B: ratings.filter(r => r.winner === 'B').length,
        tie: ratings.filter(r => r.winner === 'tie').length
    };

    // Total ratings should equal number of raters
    const totalRatings = Object.values(categoryCounts).reduce((sum, count) => sum + count, 0);

    if (totalRatings !== raters || raters < 2) {
        return {
            questionId,
            kappa: 0,
            interpretation: 'poor',
            raters,
            subjects,
            categories: categoryCounts
        };
    }

    // Calculate Po (observed agreement)
    // For a single subject with multiple raters: Po = (sum of ri*(ri-1)) / (n*(n-1))
    // where ri is the number of raters choosing category i, n is total number of raters
    let numerator = 0;
    for (const category of categories) {
        const ri = categoryCounts[category];
        numerator += ri * (ri - 1);
    }
    const Po = numerator / (raters * (raters - 1));

    // Calculate Pe (expected agreement)
    // Pe = sum of pi^2, where pi is the proportion of all ratings in category i
    let Pe = 0;
    for (const category of categories) {
        const pi = categoryCounts[category] / raters;
        Pe += pi * pi;
    }

    // Calculate Fleiss' kappa
    const kappa = Pe === 1 ? 1 : (Po - Pe) / (1 - Pe);

    return {
        questionId,
        kappa: isNaN(kappa) || !isFinite(kappa) ? 0 : Math.max(-1, Math.min(1, kappa)), // Clamp between -1 and 1, handle NaN
        interpretation: interpretKappa(isNaN(kappa) || !isFinite(kappa) ? 0 : kappa),
        raters,
        subjects,
        categories: categoryCounts
    };
}

/**
 * Calculate average Fleiss' kappa for a dimension across multiple questions
 * @param ratingsByQuestion Array of rating arrays, one for each question
 * @returns DimensionKappaResult with average kappa and individual question results
 */
export function calculateDimensionKappa(
    dimensionId: string,
    ratingsByQuestion: RatingData[][]
): DimensionKappaResult {
    if (ratingsByQuestion.length === 0) {
        return {
            dimensionId,
            avgKappa: 0,
            questionResults: [],
            interpretation: 'poor'
        };
    }

    // Calculate kappa for each question
    const questionResults = ratingsByQuestion.map(questionRatings =>
        calculateQuestionKappa(questionRatings)
    );

    // Calculate unweighted average kappa across all questions
    const validResults = questionResults.filter(result =>
        result.raters >= 2 && !isNaN(result.kappa) && isFinite(result.kappa)
    );

    if (validResults.length === 0) {
        return {
            dimensionId,
            avgKappa: 0,
            questionResults,
            interpretation: 'poor'
        };
    }

    const avgKappa = validResults.reduce((sum, result) => sum + result.kappa, 0) / validResults.length;

    return {
        dimensionId,
        avgKappa: isNaN(avgKappa) || !isFinite(avgKappa) ? 0 : Math.max(-1, Math.min(1, avgKappa)), // Clamp between -1 and 1, handle NaN
        questionResults,
        interpretation: interpretKappa(isNaN(avgKappa) || !isFinite(avgKappa) ? 0 : avgKappa)
    };
}

/**
 * Group rating data by question and dimension for kappa calculation
 * @param ratings Array of all rating data
 * @returns Map with dimension -> question -> ratings structure
 */
export function groupRatingsForKappa(ratings: RatingData[]): Map<string, Map<string, RatingData[]>> {
    const grouped = new Map<string, Map<string, RatingData[]>>();

    for (const rating of ratings) {
        if (!grouped.has(rating.dimensionId)) {
            grouped.set(rating.dimensionId, new Map());
        }

        const dimensionMap = grouped.get(rating.dimensionId)!;
        if (!dimensionMap.has(rating.questionId)) {
            dimensionMap.set(rating.questionId, []);
        }

        dimensionMap.get(rating.questionId)!.push(rating);
    }

    return grouped;
} 