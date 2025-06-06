import {
    DimensionsAnalyticsData,
    SafeDimensionsAnalyticsData,
    DimensionComparisonData,
    SafeDimensionComparisonData,
    QuestionKappaScore,
    KappaInterpretation
} from '@/types/admin';

/**
 * Safe defaults for dimension comparison data
 */
export const createSafeDimensionComparison = (
    data: Partial<DimensionComparisonData> = {}
): SafeDimensionComparisonData => ({
    dimensionId: data.dimensionId || '',
    dimensionLabel: data.dimensionLabel || 'Unknown Dimension',
    preferenceStrength: data.preferenceStrength || 0,
    fleissKappa: data.fleissKappa || 0,
    avgKappaPerQuestion: data.avgKappaPerQuestion || 0,
    kappaInterpretation: data.kappaInterpretation || 'poor',
    questionKappaScores: Array.isArray(data.questionKappaScores) ? data.questionKappaScores : []
});

/**
 * Safe defaults for question kappa scores
 */
export const createSafeQuestionKappaScore = (
    data: Partial<QuestionKappaScore> = {}
): QuestionKappaScore => ({
    questionId: data.questionId || '',
    kappa: typeof data.kappa === 'number' && isFinite(data.kappa) ? data.kappa : 0,
    raters: data.raters || 0,
    categories: {
        A: data.categories?.A || 0,
        B: data.categories?.B || 0,
        tie: data.categories?.tie || 0
    }
});

/**
 * Convert DimensionsAnalyticsData to SafeDimensionsAnalyticsData
 */
export const createSafeDimensionsAnalytics = (
    data: Partial<DimensionsAnalyticsData> = {}
): SafeDimensionsAnalyticsData => {
    const safeDimensionComparisons = Array.isArray(data.dimensionComparisons)
        ? data.dimensionComparisons.map(createSafeDimensionComparison)
        : [];

    return {
        overview: {
            totalDimensions: data.overview?.totalDimensions || 0,
            totalEvaluations: data.overview?.totalEvaluations || 0,
            averageEvaluationsPerDimension: data.overview?.averageEvaluationsPerDimension || 0,
            mostContentiousDimension: data.overview?.mostContentiousDimension || '',
            mostDecisiveDimension: data.overview?.mostDecisiveDimension || ''
        },
        dimensionAnalyses: Array.isArray(data.dimensionAnalyses) ? data.dimensionAnalyses : [],
        dimensionComparisons: safeDimensionComparisons,
        trends: {
            dimensionPopularity: data.trends?.dimensionPopularity || {},
            winnerTrends: data.trends?.winnerTrends || {}
        },
        correlations: data.correlations || {}
    };
};

/**
 * Type guard to check if data has dimension comparisons
 */
export const hasDimensionComparisons = (
    data: any
): data is { dimensionComparisons: DimensionComparisonData[] } => {
    return data &&
        Array.isArray(data.dimensionComparisons) &&
        data.dimensionComparisons.length > 0;
};

/**
 * Type guard to check if comparison has valid kappa scores
 */
export const hasValidKappaScores = (
    comparison: any
): comparison is { questionKappaScores: QuestionKappaScore[] } => {
    return comparison &&
        Array.isArray(comparison.questionKappaScores) &&
        comparison.questionKappaScores.length > 0;
};

/**
 * Safe number formatter that handles undefined/null/NaN
 */
export const safeToFixed = (value: any, digits: number = 3): string => {
    if (typeof value !== 'number' || isNaN(value) || !isFinite(value)) {
        return 'N/A';
    }
    return value.toFixed(digits);
};

/**
 * Safe array length getter
 */
export const safeLength = (arr: any): number => {
    return Array.isArray(arr) ? arr.length : 0;
};

/**
 * Validate kappa interpretation
 */
export const isValidKappaInterpretation = (value: any): value is KappaInterpretation => {
    const validInterpretations: KappaInterpretation[] = [
        'poor', 'slight', 'fair', 'moderate', 'substantial', 'almost_perfect'
    ];
    return typeof value === 'string' && validInterpretations.includes(value as KappaInterpretation);
};

/**
 * Get safe kappa interpretation
 */
export const getSafeKappaInterpretation = (interpretation: any): KappaInterpretation => {
    return isValidKappaInterpretation(interpretation) ? interpretation : 'poor';
}; 