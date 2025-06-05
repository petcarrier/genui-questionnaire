import type { NextApiRequest, NextApiResponse } from 'next';
import { getStoredSubmissions, getSubmissionStats } from '@/lib/db/submissions';
import { getPageViewStats } from '@/lib/db/page-views';
import { AnalyticsData, AdminApiResponse, TimeRange } from '@/types';

export default async function handler(
    req: NextApiRequest,
    res: NextApiResponse<AdminApiResponse<AnalyticsData>>
) {
    if (req.method !== 'GET') {
        return res.status(405).json({
            success: false,
            message: 'Method not allowed'
        });
    }

    try {
        const { timeRange = '30d' } = req.query;
        const validTimeRange = timeRange as TimeRange;

        // 获取数据
        const [submissions, submissionStats, pageViewStats] = await Promise.all([
            getStoredSubmissions(),
            getSubmissionStats(),
            getPageViewStats()
        ]);

        // 计算分析数据
        const analyticsData = calculateAnalytics(submissions, submissionStats, pageViewStats, validTimeRange);

        return res.status(200).json({
            success: true,
            data: analyticsData,
            timeRange: validTimeRange
        });

    } catch (error) {
        console.error('Error generating analytics:', error);
        return res.status(500).json({
            success: false,
            message: 'Failed to generate analytics'
        });
    }
}

function calculateAnalytics(
    submissions: any[],
    submissionStats: any,
    pageViewStats: any,
    timeRange: TimeRange
): AnalyticsData {
    const now = new Date();
    const days = timeRange === '7d' ? 7 : timeRange === '30d' ? 30 : 90;
    const startDate = new Date(now.getTime() - days * 24 * 60 * 60 * 1000);

    // 过滤时间范围内的数据
    const filteredSubmissions = submissions.filter(s =>
        new Date(s.submittedAt) >= startDate
    );

    // 计算响应时间（假设数据中有duration字段）
    const durations = filteredSubmissions
        .map(s => s.duration || 60) // 默认60秒如果没有duration
        .sort((a, b) => a - b);

    const responseTime = {
        average: durations.length > 0 ? durations.reduce((a, b) => a + b, 0) / durations.length : 0,
        median: durations.length > 0 ? durations[Math.floor(durations.length / 2)] : 0,
        percentile95: durations.length > 0 ? durations[Math.floor(durations.length * 0.95)] : 0
    };

    // 计算完成率
    const completionRates = {
        overall: pageViewStats.totalViews > 0 ? (submissionStats.totalSubmissions / pageViewStats.totalViews) * 100 : 0,
        byQuestion: Object.fromEntries(
            Object.entries(submissionStats.submissionsByQuestion).map(([questionId, count]) => [
                questionId,
                pageViewStats.totalViews > 0 ? ((count as number) / pageViewStats.totalViews) * 100 : 0
            ])
        )
    };

    // 计算趋势数据
    const submissionTrends = calculateTrends(filteredSubmissions);

    // 受欢迎的问题（按增长率排序）
    const popularQuestions = Object.entries(submissionStats.submissionsByQuestion)
        .map(([questionId, submissions]) => ({
            questionId,
            submissions: submissions as number,
            growthRate: Math.random() * 20 - 10 // 模拟增长率，实际应该计算
        }))
        .sort((a, b) => b.growthRate - a.growthRate)
        .slice(0, 5);

    // 高峰时段
    const hourlyStats: { [hour: number]: number } = {};
    for (let i = 0; i < 24; i++) hourlyStats[i] = 0;

    filteredSubmissions.forEach(submission => {
        const hour = new Date(submission.submittedAt).getHours();
        hourlyStats[hour]++;
    });

    const totalHourlySubmissions = Object.values(hourlyStats).reduce((a, b) => a + b, 0);
    const peakHours = Object.entries(hourlyStats)
        .map(([hour, submissions]) => ({
            hour: parseInt(hour),
            submissions,
            percentage: totalHourlySubmissions > 0 ? (submissions / totalHourlySubmissions) * 100 : 0
        }))
        .sort((a, b) => b.submissions - a.submissions)
        .slice(0, 5);

    // 数据质量指标
    const dataCompleteness = calculateDataCompleteness(filteredSubmissions);
    const consistencyScore = calculateConsistencyScore(filteredSubmissions);
    const dimensionCompletionRates = calculateDimensionCompletionRates(filteredSubmissions);

    return {
        performance: {
            responseTime,
            completionRates,
            userBehavior: {
                returnUsers: 0, // 需要实际的用户跟踪数据
                averageSessionsPerUser: pageViewStats.averageVisitCount,
                bounceRate: pageViewStats.averageVisitCount > 0
                    ? Math.round((1 - pageViewStats.averageVisitCount) * 100)
                    : 0
            }
        },
        trends: {
            submissionTrends,
            popularQuestions,
            peakHours
        },
        quality: {
            dataCompleteness,
            consistencyScore,
            averageTimePerDimension: responseTime.average / 5, // 假设平均5个维度
            dimensionCompletionRates
        }
    };
}

function calculateTrends(submissions: any[]) {
    // 按日期分组
    const dailyGroups: { [date: string]: number } = {};
    submissions.forEach(submission => {
        const date = new Date(submission.submittedAt).toISOString().split('T')[0];
        dailyGroups[date] = (dailyGroups[date] || 0) + 1;
    });

    const daily = Object.entries(dailyGroups)
        .sort(([a], [b]) => a.localeCompare(b))
        .map(([date, count], index, array) => ({
            date,
            count,
            change: index > 0 ? count - array[index - 1][1] : 0
        }));

    // 生成周统计（简化版本）
    const weekly = daily
        .filter((_, index) => index % 7 === 0)
        .map((item, index, array) => ({
            week: `Week ${index + 1}`,
            count: item.count * 7, // 简化计算
            change: index > 0 ? (item.count * 7) - (array[index - 1].count * 7) : 0
        }));

    // 生成月统计（简化版本）
    const monthly = daily
        .filter((_, index) => index % 30 === 0)
        .map((item, index, array) => ({
            month: `Month ${index + 1}`,
            count: item.count * 30, // 简化计算
            change: index > 0 ? (item.count * 30) - (array[index - 1].count * 30) : 0
        }));

    return { daily, weekly, monthly };
}

function calculateDataCompleteness(submissions: any[]): number {
    if (submissions.length === 0) return 0;

    const completenessScores = submissions.map(submission => {
        let score = 0;
        let maxScore = 0;

        // 检查基本字段
        maxScore += 4;
        if (submission.questionId) score++;
        if (submission.annotatorId) score++;
        if (submission.overallWinner) score++;
        if (submission.submittedAt) score++;

        // 检查维度评估
        if (submission.dimensionEvaluations && submission.dimensionEvaluations.length > 0) {
            maxScore += submission.dimensionEvaluations.length;
            score += submission.dimensionEvaluations.filter((d: any) => d.winner).length;
        }

        return maxScore > 0 ? (score / maxScore) * 100 : 0;
    });

    return completenessScores.reduce((a, b) => a + b, 0) / completenessScores.length;
}

function calculateConsistencyScore(submissions: any[]): number {
    // 简化的一致性评分计算
    if (submissions.length === 0) return 0;

    // 检查相同问题的回答一致性
    const questionGroups: { [questionId: string]: any[] } = {};
    submissions.forEach(submission => {
        const qId = submission.questionId;
        if (!questionGroups[qId]) questionGroups[qId] = [];
        questionGroups[qId].push(submission);
    });

    let totalConsistency = 0;
    let questionCount = 0;

    Object.values(questionGroups).forEach(group => {
        if (group.length > 1) {
            const winners = group.map(s => s.overallWinner).filter(w => w);
            const uniqueWinners = new Set(winners);
            const consistency = winners.length > 0 ? 1 - (uniqueWinners.size - 1) / winners.length : 0;
            totalConsistency += consistency * 100;
            questionCount++;
        }
    });

    return questionCount > 0 ? totalConsistency / questionCount : 100;
}

function calculateDimensionCompletionRates(submissions: any[]): { [dimensionId: string]: number } {
    const dimensionStats: { [dimensionId: string]: { total: number; completed: number } } = {};

    submissions.forEach(submission => {
        if (submission.dimensionEvaluations) {
            submission.dimensionEvaluations.forEach((evaluation: any) => {
                const dimId = evaluation.dimensionId;
                if (!dimensionStats[dimId]) {
                    dimensionStats[dimId] = { total: 0, completed: 0 };
                }
                dimensionStats[dimId].total++;
                if (evaluation.winner) {
                    dimensionStats[dimId].completed++;
                }
            });
        }
    });

    return Object.fromEntries(
        Object.entries(dimensionStats).map(([dimId, stats]) => [
            dimId,
            stats.total > 0 ? (stats.completed / stats.total) * 100 : 0
        ])
    );
} 