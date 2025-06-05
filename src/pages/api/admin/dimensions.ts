import type { NextApiRequest, NextApiResponse } from 'next';
import { getStoredSubmissions } from '@/lib/db/submissions';
import { DimensionsAnalyticsData, AdminApiResponse, TimeRange, DimensionAnalysis, DimensionComparisonData, DimensionWinnerStats } from '@/types/admin';
import { EVALUATION_DIMENSIONS } from '@/types/questionnaire';
import { subDays } from 'date-fns';
import { calculateTimeRange } from '@/utils/timeRangeUtils';

export default async function handler(
    req: NextApiRequest,
    res: NextApiResponse<AdminApiResponse<DimensionsAnalyticsData>>
) {
    if (req.method !== 'GET') {
        return res.status(405).json({
            success: false,
            message: 'Method not allowed'
        });
    }

    try {
        const {
            timeRange = '30d',
            startDate,
            endDate,
            excludeTraps = 'false',
            excludeIncomplete = 'false'
        } = req.query;

        const validTimeRange = timeRange as TimeRange;
        const shouldExcludeTraps = excludeTraps === 'true';
        const shouldExcludeIncomplete = excludeIncomplete === 'true';

        // 计算时间范围
        const { startDate: calculatedStartDate, endDate: calculatedEndDate } = calculateTimeRange(
            validTimeRange,
            startDate as string,
            endDate as string
        );

        // 获取过滤后的提交数据
        const submissions = await getStoredSubmissions(shouldExcludeTraps, calculatedStartDate, calculatedEndDate, shouldExcludeIncomplete);

        // 计算维度分析数据
        const dimensionsData = calculateDimensionsAnalytics(submissions, validTimeRange);

        return res.status(200).json({
            success: true,
            data: dimensionsData,
            timeRange: validTimeRange
        });

    } catch (error) {
        console.error('Error generating dimensions analytics:', error);
        return res.status(500).json({
            success: false,
            message: 'Failed to generate dimensions analytics'
        });
    }
}

function calculateDimensionsAnalytics(
    submissions: any[],
    timeRange: TimeRange
): DimensionsAnalyticsData {
    const now = new Date();
    const days = timeRange === '7d' ? 7 : timeRange === '30d' ? 30 : 90;
    const startDate = subDays(now, days);

    // 过滤时间范围内的数据
    const filteredSubmissions = submissions.filter(s =>
        new Date(s.submittedAt) >= startDate
    );

    // 为每个维度创建分析
    const dimensionAnalyses: DimensionAnalysis[] = EVALUATION_DIMENSIONS.map(dimension => {
        return analyzeDimension(dimension.id, dimension.label, filteredSubmissions);
    });

    // 计算维度比较数据
    const dimensionComparisons: DimensionComparisonData[] = EVALUATION_DIMENSIONS.map(dimension => {
        return calculateDimensionComparison(dimension.id, dimension.label, filteredSubmissions);
    });

    // 找出最有争议和最具决定性的维度
    const mostContentiousDimension = dimensionComparisons.reduce((prev, current) =>
        current.controversyScore > prev.controversyScore ? current : prev
    ).dimensionId;

    const mostDecisiveDimension = dimensionComparisons.reduce((prev, current) =>
        current.preferenceStrength > prev.preferenceStrength ? current : prev
    ).dimensionId;

    // 计算趋势数据
    const trends = calculateDimensionTrends(filteredSubmissions);

    // 计算相关性（简化版本）
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
    // 收集该维度的所有评估
    const dimensionEvaluations = submissions.flatMap(submission =>
        submission.dimensionEvaluations?.filter((de: any) => de.dimensionId === dimensionId) || []
    );

    // 统计胜者分布
    const winnerStats: DimensionWinnerStats = { A: 0, B: 0, tie: 0, empty: 0 };

    dimensionEvaluations.forEach((evaluation: any) => {
        const winner = evaluation.winner;
        if (winner === 'A') winnerStats.A++;
        else if (winner === 'B') winnerStats.B++;
        else if (winner === 'tie') winnerStats.tie++;
        else winnerStats.empty++;
    });

    const total = dimensionEvaluations.length;

    // 计算百分比
    const winnerPercentages = {
        A: total > 0 ? Math.round((winnerStats.A / total) * 100) : 0,
        B: total > 0 ? Math.round((winnerStats.B / total) * 100) : 0,
        tie: total > 0 ? Math.round((winnerStats.tie / total) * 100) : 0,
        empty: total > 0 ? Math.round((winnerStats.empty / total) * 100) : 0
    };

    // 分析备注
    const evaluationsWithNotes = dimensionEvaluations.filter((de: any) => de.notes && de.notes.trim().length > 0);
    const totalNoteLength = evaluationsWithNotes.reduce((sum: number, de: any) => sum + (de.notes?.length || 0), 0);

    // 提取常见关键词（简化版本）
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

function calculateDimensionComparison(dimensionId: string, dimensionLabel: string, submissions: any[]): DimensionComparisonData {
    const dimensionEvaluations = submissions.flatMap(submission =>
        submission.dimensionEvaluations?.filter((de: any) => de.dimensionId === dimensionId) || []
    );

    const total = dimensionEvaluations.length;
    if (total === 0) {
        return {
            dimensionId,
            dimensionLabel,
            preferenceStrength: 0,
            consistencyScore: 0,
            controversyScore: 0
        };
    }

    const aCount = dimensionEvaluations.filter((de: any) => de.winner === 'A').length;
    const bCount = dimensionEvaluations.filter((de: any) => de.winner === 'B').length;
    const tieCount = dimensionEvaluations.filter((de: any) => de.winner === 'tie').length;

    // 偏好强度：A和B选择差异的绝对值百分比
    const preferenceStrength = Math.abs(aCount - bCount) / total * 100;

    // 一致性分数：有明确选择(非tie)的比例
    const consistencyScore = ((aCount + bCount) / total) * 100;

    // 争议程度：tie的比例
    const controversyScore = (tieCount / total) * 100;

    return {
        dimensionId,
        dimensionLabel,
        preferenceStrength: Math.round(preferenceStrength),
        consistencyScore: Math.round(consistencyScore),
        controversyScore: Math.round(controversyScore)
    };
}

function calculateDimensionTrends(submissions: any[]) {
    // 按日期分组统计各维度的选择趋势
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

            // 计算两个维度选择结果的相关性
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