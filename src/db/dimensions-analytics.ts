import { getStoredSubmissions } from './submissions';
import type { DimensionsAnalyticsData, DimensionAnalysis, DimensionWinnerStats, DimensionComparisonData, DimensionsAnalyticsFilters } from '@/types/admin';
import { EVALUATION_DIMENSIONS } from '@/types/questionnaire';
import { subDays } from 'date-fns';
import { processDimensionEvaluations, RawDimensionEvaluation } from '@/utils/dimensionAnalytics';

export async function getDimensionsAnalyticsData(filters: DimensionsAnalyticsFilters): Promise<DimensionsAnalyticsData> {
    // Get filtered submission data
    const submissions = await getStoredSubmissions(
        filters.excludeTraps,
        filters.startDate,
        filters.endDate,
        filters.excludeIncomplete
    );

    // Calculate dimension analytics data
    return calculateDimensionsAnalytics(submissions, filters.timeRange);
}

function calculateDimensionsAnalytics(
    submissions: any[],
    timeRange: string
): DimensionsAnalyticsData {
    const now = new Date();
    const days = timeRange === '7d' ? 7 : timeRange === '30d' ? 30 : 90;
    const startDate = subDays(now, days);

    // Filter submissions within time range
    const filteredSubmissions = submissions.filter(s =>
        new Date(s.submittedAt) >= startDate
    );

    // Create dimension analyses for each dimension
    const dimensionAnalyses: DimensionAnalysis[] = EVALUATION_DIMENSIONS.map(dimension => {
        return analyzeDimension(dimension.id, dimension.label, filteredSubmissions);
    });

    // Convert submissions to raw dimension evaluations format
    const rawEvaluations: RawDimensionEvaluation[] = filteredSubmissions.flatMap((submission, submissionIndex) =>
        (submission.dimensionEvaluations || []).map((de: any, evaluationIndex: number) => ({
            id: submissionIndex * 1000 + evaluationIndex, // Generate unique ID for processing
            annotatorId: submission.annotatorId || 'unknown',
            questionId: submission.questionId || 'unknown',
            submissionId: submission.submissionId || submission.id || `sub_${submissionIndex}`,
            dimensionId: de.dimensionId,
            winner: de.winner,
            notes: de.notes || null,
            createdAt: new Date(submission.submittedAt)
        }))
    ).filter(evaluation =>
        // Filter out invalid evaluations
        evaluation.dimensionId &&
        evaluation.winner &&
        ['A', 'B', 'tie'].includes(evaluation.winner)
    );

    // Calculate Fleiss' kappa metrics using the new system
    const dimensionComparisons = rawEvaluations.length > 0
        ? processDimensionEvaluations(rawEvaluations)
        : EVALUATION_DIMENSIONS.map(dimension => ({
            dimensionId: dimension.id,
            dimensionLabel: dimension.label,
            preferenceStrength: 0,
            fleissKappa: 0,
            avgKappaPerQuestion: 0,
            kappaInterpretation: 'poor' as const,
            questionKappaScores: []
        }));

    // Find most decisive dimension (with fallback)
    const mostDecisiveDimension = dimensionComparisons.length > 0
        ? dimensionComparisons.reduce((prev, current) =>
            current.preferenceStrength > prev.preferenceStrength ? current : prev
        ).dimensionId
        : '';

    // Find most contentious dimension based on lowest kappa (lowest agreement)
    const mostContentiousDimension = dimensionComparisons.length > 0
        ? dimensionComparisons.reduce((prev, current) =>
            current.fleissKappa < prev.fleissKappa ? current : prev
        ).dimensionId
        : '';

    // Calculate trend data
    const trends = calculateDimensionTrends(filteredSubmissions);

    // Calculate correlations (simplified version)
    const correlations = calculateDimensionCorrelations(filteredSubmissions);

    return {
        overview: {
            totalDimensions: EVALUATION_DIMENSIONS.length,
            totalEvaluations: dimensionAnalyses.reduce((sum, d) => sum + d.totalEvaluations, 0),
            averageEvaluationsPerDimension: dimensionAnalyses.length > 0
                ? Math.round(dimensionAnalyses.reduce((sum, d) => sum + d.totalEvaluations, 0) / dimensionAnalyses.length)
                : 0,
            mostContentiousDimension,
            mostDecisiveDimension
        },
        dimensionAnalyses,
        dimensionComparisons,
        trends,
        correlations
    };
}

function analyzeDimension(dimensionId: string, dimensionLabel: string, submissions: any[]): DimensionAnalysis {
    // Collect all evaluations for this dimension
    const dimensionEvaluations = submissions.flatMap(submission =>
        submission.dimensionEvaluations?.filter((de: any) => de.dimensionId === dimensionId) || []
    );

    // Count winner distribution
    const winnerStats: DimensionWinnerStats = { A: 0, B: 0, tie: 0, empty: 0 };

    dimensionEvaluations.forEach((evaluation: any) => {
        const winner = evaluation.winner;
        if (winner === 'A') winnerStats.A++;
        else if (winner === 'B') winnerStats.B++;
        else if (winner === 'tie') winnerStats.tie++;
        else winnerStats.empty++;
    });

    const total = dimensionEvaluations.length;

    // Calculate percentages
    const winnerPercentages = {
        A: total > 0 ? Math.round((winnerStats.A / total) * 100) : 0,
        B: total > 0 ? Math.round((winnerStats.B / total) * 100) : 0,
        tie: total > 0 ? Math.round((winnerStats.tie / total) * 100) : 0,
        empty: total > 0 ? Math.round((winnerStats.empty / total) * 100) : 0
    };

    // Analyze notes
    const evaluationsWithNotes = dimensionEvaluations.filter((de: any) => de.notes && de.notes.trim().length > 0);
    const totalNoteLength = evaluationsWithNotes.reduce((sum: number, de: any) => sum + (de.notes?.length || 0), 0);

    // Extract common keywords (simplified version)
    const allNotes = evaluationsWithNotes.map((de: any) => de.notes?.toLowerCase() || '').join(' ');
    const words = allNotes.split(/\s+/).filter(word => word.length > 3);
    const wordCount: { [word: string]: number } = {};
    words.forEach(word => {
        wordCount[word] = (wordCount[word] || 0) + 1;
    });
    const commonKeywords = Object.entries(wordCount)
        .sort(([, a], [, b]) => b - a)
        .slice(0, 5)
        .map(([word]) => word);

    return {
        dimensionId,
        dimensionLabel,
        totalEvaluations: total,
        winnerStats,
        winnerPercentages,
        notes: {
            totalWithNotes: evaluationsWithNotes.length,
            averageNoteLength: evaluationsWithNotes.length > 0
                ? Math.round(totalNoteLength / evaluationsWithNotes.length)
                : 0,
            commonKeywords: commonKeywords.length > 0 ? commonKeywords : undefined
        }
    };
}

function calculateDimensionTrends(submissions: any[]) {
    // Group statistics by date for each dimension's choice trends
    const dateGroups: { [date: string]: any[] } = {};

    submissions.forEach(submission => {
        const date = new Date(submission.submittedAt).toISOString().split('T')[0];
        if (!dateGroups[date]) dateGroups[date] = [];
        dateGroups[date].push(submission);
    });

    const dimensionPopularity: { [dimensionId: string]: number[] } = {};
    const winnerTrends: { [dimensionId: string]: { date: string; A: number; B: number; tie: number; }[] } = {};

    EVALUATION_DIMENSIONS.forEach(dimension => {
        dimensionPopularity[dimension.id] = [];
        winnerTrends[dimension.id] = [];

        Object.entries(dateGroups).sort(([a], [b]) => a.localeCompare(b)).forEach(([date, daySubmissions]) => {
            const dimensionEvaluations = daySubmissions.flatMap(s =>
                s.dimensionEvaluations?.filter((de: any) => de.dimensionId === dimension.id) || []
            );

            dimensionPopularity[dimension.id].push(dimensionEvaluations.length);

            const aCount = dimensionEvaluations.filter((de: any) => de.winner === 'A').length;
            const bCount = dimensionEvaluations.filter((de: any) => de.winner === 'B').length;
            const tieCount = dimensionEvaluations.filter((de: any) => de.winner === 'tie').length;

            winnerTrends[dimension.id].push({ date, A: aCount, B: bCount, tie: tieCount });
        });
    });

    return { dimensionPopularity, winnerTrends };
}

function calculateDimensionCorrelations(submissions: any[]): { [dimensionId: string]: { [otherDimensionId: string]: number } } {
    const correlations: { [dimensionId: string]: { [otherDimensionId: string]: number } } = {};

    EVALUATION_DIMENSIONS.forEach(dimension1 => {
        correlations[dimension1.id] = {};

        EVALUATION_DIMENSIONS.forEach(dimension2 => {
            if (dimension1.id === dimension2.id) {
                correlations[dimension1.id][dimension2.id] = 1;
                return;
            }

            // Calculate correlation between two dimensions' choice results
            let agreements = 0;
            let total = 0;

            submissions.forEach(submission => {
                const eval1 = submission.dimensionEvaluations?.find((de: any) => de.dimensionId === dimension1.id);
                const eval2 = submission.dimensionEvaluations?.find((de: any) => de.dimensionId === dimension2.id);

                if (eval1 && eval2 && eval1.winner && eval2.winner) {
                    total++;
                    if (eval1.winner === eval2.winner) {
                        agreements++;
                    }
                }
            });

            correlations[dimension1.id][dimension2.id] = total > 0 ? Math.round((agreements / total) * 100) / 100 : 0;
        });
    });

    return correlations;
} 