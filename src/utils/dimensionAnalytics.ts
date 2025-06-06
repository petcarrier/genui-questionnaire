import { DimensionComparisonData } from '@/types/admin';
import { EVALUATION_DIMENSIONS } from '@/types/questionnaire';
import {
    RatingData,
    calculateDimensionKappa,
    groupRatingsForKappa,
    interpretKappa
} from './fleissKappa';

/**
 * Interface representing raw dimension evaluation data from database
 */
export interface RawDimensionEvaluation {
    id: number;
    annotatorId: string;
    questionId: string;
    submissionId: string;
    dimensionId: string;
    winner: 'A' | 'B' | 'tie';
    notes?: string;
    createdAt: Date;
}

/**
 * Convert raw dimension evaluations to RatingData format for kappa calculation
 */
export function convertToRatingData(evaluations: RawDimensionEvaluation[]): RatingData[] {
    return evaluations.map(evaluation => ({
        questionId: evaluation.questionId,
        dimensionId: evaluation.dimensionId,
        annotatorId: evaluation.annotatorId,
        winner: evaluation.winner
    }));
}

/**
 * Calculate preference strength (absolute difference between A and B choices)
 */
function calculatePreferenceStrength(ratings: RatingData[]): number {
    if (ratings.length === 0) return 0;

    const aCount = ratings.filter(r => r.winner === 'A').length;
    const bCount = ratings.filter(r => r.winner === 'B').length;
    const total = ratings.length;

    const aPercentage = (aCount / total) * 100;
    const bPercentage = (bCount / total) * 100;

    return Math.abs(aPercentage - bPercentage);
}

/**
 * Process dimension evaluations and calculate Fleiss' kappa metrics
 * @param evaluations Array of raw dimension evaluation data from database
 * @returns Array of DimensionComparisonData with kappa metrics
 */
export function processDimensionEvaluations(
    evaluations: RawDimensionEvaluation[]
): DimensionComparisonData[] {
    // Convert to rating data format
    const ratingData = convertToRatingData(evaluations);

    // Group ratings by dimension and question
    const groupedRatings = groupRatingsForKappa(ratingData);

    const results: DimensionComparisonData[] = [];

    // Process each dimension
    for (const dimension of EVALUATION_DIMENSIONS) {
        const dimensionRatings = groupedRatings.get(dimension.id);

        if (!dimensionRatings || dimensionRatings.size === 0) {
            // No data for this dimension
            results.push({
                dimensionId: dimension.id,
                dimensionLabel: dimension.label,
                preferenceStrength: 0,
                fleissKappa: 0,
                avgKappaPerQuestion: 0,
                kappaInterpretation: 'poor',
                questionKappaScores: []
            });
            continue;
        }

        // Prepare data for kappa calculation
        const questionRatingsArray: RatingData[][] = [];
        const allDimensionRatings: RatingData[] = [];

        for (const [questionId, questionRatings] of dimensionRatings.entries()) {
            questionRatingsArray.push(questionRatings);
            allDimensionRatings.push(...questionRatings);
        }

        // Calculate dimension-level kappa
        const dimensionKappaResult = calculateDimensionKappa(dimension.id, questionRatingsArray);

        // Calculate additional metrics
        const preferenceStrength = calculatePreferenceStrength(allDimensionRatings);

        // Build question kappa scores array
        const questionKappaScores = dimensionKappaResult.questionResults.map(result => ({
            questionId: result.questionId,
            kappa: result.kappa,
            raters: result.raters,
            categories: result.categories
        }));

        results.push({
            dimensionId: dimension.id,
            dimensionLabel: dimension.label,
            preferenceStrength: Math.round(preferenceStrength),
            fleissKappa: dimensionKappaResult.avgKappa,
            avgKappaPerQuestion: dimensionKappaResult.avgKappa,
            kappaInterpretation: dimensionKappaResult.interpretation,
            questionKappaScores
        });
    }

    return results;
}

/**
 * Get summary statistics for dimension evaluations
 */
export function getDimensionEvaluationSummary(evaluations: RawDimensionEvaluation[]) {
    const uniqueQuestions = new Set(evaluations.map(e => e.questionId)).size;
    const uniqueAnnotators = new Set(evaluations.map(e => e.annotatorId)).size;
    const totalEvaluations = evaluations.length;

    // Calculate average evaluations per question
    const evaluationsPerQuestion = totalEvaluations / (uniqueQuestions || 1);

    // Find dimension with most evaluations
    const dimensionCounts = evaluations.reduce((acc, evaluation) => {
        acc[evaluation.dimensionId] = (acc[evaluation.dimensionId] || 0) + 1;
        return acc;
    }, {} as Record<string, number>);

    const mostEvaluatedDimension = Object.entries(dimensionCounts)
        .sort(([, a], [, b]) => b - a)[0]?.[0] || '';

    return {
        totalEvaluations,
        uniqueQuestions,
        uniqueAnnotators,
        evaluationsPerQuestion: Math.round(evaluationsPerQuestion * 100) / 100,
        mostEvaluatedDimension,
        dimensionCounts
    };
}

/**
 * Filter evaluations by various criteria
 */
export function filterEvaluations(
    evaluations: RawDimensionEvaluation[],
    filters: {
        dateRange?: { start: Date; end: Date };
        questionIds?: string[];
        dimensionIds?: string[];
        minRatersPerQuestion?: number;
    }
): RawDimensionEvaluation[] {
    let filtered = evaluations;

    // Filter by date range
    if (filters.dateRange) {
        filtered = filtered.filter(e =>
            e.createdAt >= filters.dateRange!.start &&
            e.createdAt <= filters.dateRange!.end
        );
    }

    // Filter by question IDs
    if (filters.questionIds && filters.questionIds.length > 0) {
        filtered = filtered.filter(e => filters.questionIds!.includes(e.questionId));
    }

    // Filter by dimension IDs
    if (filters.dimensionIds && filters.dimensionIds.length > 0) {
        filtered = filtered.filter(e => filters.dimensionIds!.includes(e.dimensionId));
    }

    // Filter by minimum raters per question
    if (filters.minRatersPerQuestion && filters.minRatersPerQuestion > 1) {
        const questionRaterCounts = filtered.reduce((acc, evaluation) => {
            const key = `${evaluation.questionId}-${evaluation.dimensionId}`;
            if (!acc[key]) {
                acc[key] = new Set();
            }
            acc[key].add(evaluation.annotatorId);
            return acc;
        }, {} as Record<string, Set<string>>);

        filtered = filtered.filter(evaluation => {
            const key = `${evaluation.questionId}-${evaluation.dimensionId}`;
            return questionRaterCounts[key]?.size >= filters.minRatersPerQuestion!;
        });
    }

    return filtered;
} 