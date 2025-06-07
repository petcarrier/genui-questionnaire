/**
 * Fleiss' Kappa Calculator for Inter-rater Reliability
 * Used to calculate agreement between multiple raters on categorical data
 */

import { fleissKappa, interpretFleissKappa as interpretKappaCore, fleissKappaDetailed } from './fleissKappaCore';

export interface RatingData {
    questionId: string;
    dimensionId: string;
    annotatorId: string;
    winner: 'A' | 'B' | 'tie';
    questionnaireId?: string;
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
    questionnaireId: string;
    kappa: number;
    interpretation: 'poor' | 'slight' | 'fair' | 'moderate' | 'substantial' | 'almost_perfect';
    raters: number;
    subjects: number;
    questionResults?: QuestionKappaResult[];
}

/**
 * Convert RatingData to matrix format for fleissKappa calculation
 */
function convertRatingDataToMatrix(ratings: RatingData[]): {
    matrix: number[][];
    subjectKeys: string[];
    annotators: Set<string>;
} {
    // Group by subject (questionId + dimensionId)
    const subjectMap = new Map<string, RatingData[]>();
    const annotators = new Set<string>();

    for (const rating of ratings) {
        const subjectKey = `${rating.questionId}_${rating.dimensionId}`;
        if (!subjectMap.has(subjectKey)) {
            subjectMap.set(subjectKey, []);
        }
        subjectMap.get(subjectKey)!.push(rating);
        annotators.add(rating.annotatorId);
    }

    // Convert to matrix format
    const matrix: number[][] = [];
    const subjectKeys: string[] = [];

    for (const [subjectKey, subjectRatings] of subjectMap.entries()) {
        const row = [0, 0, 0]; // [A, B, tie]
        for (const rating of subjectRatings) {
            if (rating.winner === 'A') row[0]++;
            else if (rating.winner === 'B') row[1]++;
            else if (rating.winner === 'tie') row[2]++;
        }
        matrix.push(row);
        subjectKeys.push(subjectKey);
    }

    return { matrix, subjectKeys, annotators };
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
 * Calculate Fleiss' kappa for multiple questions (subjects) across multiple raters
 * @param ratings Array of ratings for multiple questions in a dimension
 * @returns KappaResult object with kappa score and related metrics
 */
export function calculateMultipleSubjectsKappa(ratings: RatingData[]): KappaResult {
    if (ratings.length === 0) {
        return {
            kappa: 0,
            interpretation: 'poor',
            raters: 0,
            subjects: 0,
            categories: { A: 0, B: 0, tie: 0 }
        };
    }

    // Convert to matrix format
    const { matrix, subjectKeys, annotators } = convertRatingDataToMatrix(ratings);
    const n = annotators.size; // number of raters
    const N = matrix.length; // number of subjects

    // 验证每个 Subject 的评分者数量
    const subjectRaterCheck = new Map<string, Set<string>>();
    for (const rating of ratings) {
        const subjectKey = `${rating.questionId}_${rating.dimensionId}`;
        if (!subjectRaterCheck.has(subjectKey)) {
            subjectRaterCheck.set(subjectKey, new Set());
        }
        subjectRaterCheck.get(subjectKey)!.add(rating.annotatorId);
    }

    let hasInconsistentRaters = false;
    for (const [subjectKey, raters] of subjectRaterCheck.entries()) {
        if (raters.size !== n) {
            hasInconsistentRaters = true;
            break;
        }
    }

    if (hasInconsistentRaters) {
        console.log('⚠️ 发现评分者数量不一致的 Subject，这可能影响 Kappa 计算的准确性');
    }

    if (n < 2 || N === 0) {
        console.log('⚠️ 数据不足，无法计算 Kappa（需要至少2个评分者）');
        return {
            kappa: 0,
            interpretation: 'poor',
            raters: n,
            subjects: N,
            categories: { A: 0, B: 0, tie: 0 }
        };
    }

    try {
        // Use the new core implementation
        const detailed = fleissKappaDetailed(matrix);

        // Count total ratings for each category
        const categoryCounts = { A: 0, B: 0, tie: 0 };
        for (const row of matrix) {
            categoryCounts.A += row[0];
            categoryCounts.B += row[1];
            categoryCounts.tie += row[2];
        }

        return {
            kappa: detailed.kappa,
            interpretation: interpretKappa(detailed.kappa),
            raters: detailed.raters,
            subjects: detailed.subjects,
            categories: categoryCounts
        };
    } catch (error) {
        console.error('⚠️ Kappa 计算出错:', error);
        return {
            kappa: 0,
            interpretation: 'poor',
            raters: n,
            subjects: N,
            categories: { A: 0, B: 0, tie: 0 }
        };
    }
}

/**
 * Calculate Fleiss' kappa for a questionnaire's dimension
 * @param questionnaireId The questionnaire ID
 * @param dimensionId The dimension ID
 * @param ratings Array of all ratings for this questionnaire and dimension
 * @returns DimensionKappaResult with kappa score and metrics
 */
export function calculateQuestionnaireDimensionKappa(
    questionnaireId: string,
    dimensionId: string,
    ratings: RatingData[]
): DimensionKappaResult {
    const kappaResult = calculateMultipleSubjectsKappa(ratings);

    return {
        dimensionId,
        questionnaireId,
        kappa: kappaResult.kappa,
        interpretation: kappaResult.interpretation,
        raters: kappaResult.raters,
        subjects: kappaResult.subjects
    };
}

/**
 * Group rating data by questionnaire and dimension for kappa calculation
 * @param ratings Array of all rating data
 * @returns Map with questionnaire -> dimension -> ratings structure
 */
export function groupRatingsByQuestionnaire(ratings: RatingData[]): Map<string, Map<string, RatingData[]>> {
    const grouped = new Map<string, Map<string, RatingData[]>>();

    for (const rating of ratings) {
        const questionnaireId = rating.questionnaireId || 'unknown';

        if (!grouped.has(questionnaireId)) {
            grouped.set(questionnaireId, new Map());
        }

        const dimensionMap = grouped.get(questionnaireId)!;
        if (!dimensionMap.has(rating.dimensionId)) {
            dimensionMap.set(rating.dimensionId, []);
        }

        dimensionMap.get(rating.dimensionId)!.push(rating);
    }

    return grouped;
}

// Keep old functions for backward compatibility but mark as deprecated
/**
 * @deprecated Use calculateMultipleSubjectsKappa instead
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

    try {
        // Create matrix for single subject
        const matrix = [[categoryCounts.A, categoryCounts.B, categoryCounts.tie]];
        const kappa = fleissKappa(matrix);

        return {
            questionId,
            kappa,
            interpretation: interpretKappa(kappa),
            raters,
            subjects,
            categories: categoryCounts
        };
    } catch (error) {
        return {
            questionId,
            kappa: 0,
            interpretation: 'poor',
            raters,
            subjects,
            categories: categoryCounts
        };
    }
}

/**
 * @deprecated Use calculateQuestionnaireDimensionKappa instead
 */
export function calculateDimensionKappa(
    dimensionId: string,
    ratingsByQuestion: RatingData[][]
): DimensionKappaResult {
    if (ratingsByQuestion.length === 0) {
        return {
            dimensionId,
            questionnaireId: 'unknown',
            kappa: 0,
            interpretation: 'poor',
            raters: 0,
            subjects: 0,
            questionResults: []
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
            questionnaireId: 'unknown',
            kappa: 0,
            interpretation: 'poor',
            raters: 0,
            subjects: validResults.length,
            questionResults
        };
    }

    const avgKappa = validResults.reduce((sum, result) => sum + result.kappa, 0) / validResults.length;

    return {
        dimensionId,
        questionnaireId: 'unknown',
        kappa: isNaN(avgKappa) || !isFinite(avgKappa) ? 0 : Math.max(-1, Math.min(1, avgKappa)),
        interpretation: interpretKappa(isNaN(avgKappa) || !isFinite(avgKappa) ? 0 : avgKappa),
        raters: validResults[0]?.raters || 0,
        subjects: validResults.length,
        questionResults
    };
}

/**
 * @deprecated Use groupRatingsByQuestionnaire instead
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

/**
 * Calculate Fleiss' kappa for an entire questionnaire (all dimensions combined)
 * @param questionnaireId The questionnaire ID
 * @param ratings Array of all ratings for this questionnaire across all dimensions
 * @returns KappaResult with kappa score and metrics
 */
export function calculateQuestionnaireOverallKappa(
    questionnaireId: string,
    ratings: RatingData[]
): { questionnaireId: string; kappa: number; interpretation: string; raters: number; subjects: number; totalRatings: number } {
    const kappaResult = calculateMultipleSubjectsKappa(ratings);

    return {
        questionnaireId,
        kappa: kappaResult.kappa,
        interpretation: kappaResult.interpretation,
        raters: kappaResult.raters,
        subjects: kappaResult.subjects,
        totalRatings: ratings.length
    };
}

/**
 * Group rating data by questionnaire only (combine all dimensions)
 * @param ratings Array of all rating data
 * @returns Map with questionnaire -> all ratings (regardless of dimension)
 */
export function groupRatingsByQuestionnaireOnly(ratings: RatingData[]): Map<string, RatingData[]> {
    const grouped = new Map<string, RatingData[]>();

    for (const rating of ratings) {
        const questionnaireId = rating.questionnaireId || 'unknown';

        if (!grouped.has(questionnaireId)) {
            grouped.set(questionnaireId, []);
        }

        grouped.get(questionnaireId)!.push(rating);
    }

    return grouped;
} 