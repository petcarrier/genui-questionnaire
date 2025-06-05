import type { NextApiRequest, NextApiResponse } from 'next';
import { getStoredSubmissions, getSubmissionStats } from '@/lib/db/submissions';
import { getPageViewStats } from '@/lib/db/page-views';
import {
    UserData,
    UsersResponse,
    UserSortBy,
    SortOrder,
    TimeRange,
    AdminApiResponse
} from '@/types';

export default async function handler(
    req: NextApiRequest,
    res: NextApiResponse<AdminApiResponse<UsersResponse>>
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
        let calculatedStartDate: string | undefined;
        let calculatedEndDate: string | undefined;

        if (validTimeRange === 'custom') {
            calculatedStartDate = startDate as string;
            calculatedEndDate = endDate as string;
        } else {
            const now = new Date();
            const days = validTimeRange === '7d' ? 7 : validTimeRange === '30d' ? 30 : timeRange === 'custom' ? 30 : 90;
            calculatedStartDate = new Date(now.getTime() - days * 24 * 60 * 60 * 1000).toISOString();
            calculatedEndDate = now.toISOString();
        }

        // 获取数据
        const [submissions, submissionStats, pageViewStats] = await Promise.all([
            getStoredSubmissions(shouldExcludeTraps, calculatedStartDate, calculatedEndDate, shouldExcludeIncomplete),
            getSubmissionStats(shouldExcludeTraps, calculatedStartDate, calculatedEndDate, shouldExcludeIncomplete),
            getPageViewStats()
        ]);

        // 分析用户数据
        const usersData = analyzeUsers(submissions, pageViewStats, validTimeRange);

        return res.status(200).json({
            success: true,
            data: usersData,
            timeRange: validTimeRange
        });

    } catch (error) {
        console.error('Error generating user stats:', error);
        return res.status(500).json({
            success: false,
            message: 'Failed to generate user statistics'
        });
    }
}

function analyzeUsers(submissions: any[], pageViewStats: any, timeRange: TimeRange) {
    const now = new Date();
    const days = timeRange === '7d' ? 7 : timeRange === '30d' ? 30 : timeRange === 'custom' ? 30 : 90;
    const startDate = new Date(now.getTime() - days * 24 * 60 * 60 * 1000);
    const oneWeekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);

    // 按用户分组提交
    const userGroups: { [userId: string]: any[] } = {};
    submissions.forEach(submission => {
        const userId = submission.annotatorId || 'anonymous';
        if (!userGroups[userId]) userGroups[userId] = [];
        userGroups[userId].push(submission);
    });

    // 分析每个用户
    const users: UserData[] = Object.entries(userGroups).map(([userId, userSubmissions]) => {
        // 过滤时间范围内的提交
        const filteredSubmissions = userSubmissions.filter(s =>
            new Date(s.submittedAt) >= startDate
        );

        if (filteredSubmissions.length === 0) {
            return null;
        }

        const submissionDates = filteredSubmissions.map(s => new Date(s.submittedAt));
        const questionsAnswered = [...new Set(filteredSubmissions.map(s => s.questionId))];

        // 计算响应时间（假设有duration字段）
        const durations = filteredSubmissions.map(s => s.duration || 60);
        const avgResponseTime = durations.reduce((a, b) => a + b, 0) / durations.length;

        // 计算一致性分数
        const consistency = calculateUserConsistency(filteredSubmissions);

        // 计算完成率（已完成的维度评估 / 总维度评估）
        let totalDimensions = 0;
        let completedDimensions = 0;
        filteredSubmissions.forEach(submission => {
            if (submission.dimensionEvaluations) {
                totalDimensions += submission.dimensionEvaluations.length;
                completedDimensions += submission.dimensionEvaluations.filter((d: any) => d.winner).length;
            }
        });
        const completionRate = totalDimensions > 0 ? (completedDimensions / totalDimensions) * 100 : 0;

        return {
            userId,
            submissionCount: filteredSubmissions.length,
            firstSubmission: submissionDates.sort((a, b) => a.getTime() - b.getTime())[0].toISOString(),
            lastSubmission: submissionDates.sort((a, b) => b.getTime() - a.getTime())[0].toISOString(),
            avgResponseTime,
            questionsAnswered,
            consistency,
            completionRate
        };
    }).filter(user => user !== null) as UserData[];

    // 计算摘要统计
    const totalUsers = users.length;
    const activeUsers = users.filter(user =>
        new Date(user.lastSubmission) >= oneWeekAgo
    ).length;

    const totalSubmissions = users.reduce((sum, user) => sum + user.submissionCount, 0);
    const averageSubmissionsPerUser = totalUsers > 0 ? totalSubmissions / totalUsers : 0;

    const topContributors = [...users]
        .sort((a, b) => b.submissionCount - a.submissionCount)
        .slice(0, 5);

    return {
        users,
        summary: {
            totalUsers,
            activeUsers,
            averageSubmissionsPerUser,
            topContributors
        }
    };
}

function calculateUserConsistency(submissions: any[]): number {
    if (submissions.length <= 1) return 100;

    // 检查用户在相同问题上的一致性
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
            totalConsistency += consistency;
            questionCount++;
        }
    });

    if (questionCount === 0) {
        // 如果没有重复问题，检查维度一致性
        let dimensionConsistency = 0;
        let dimensionCount = 0;

        const allDimensions = new Set<string>();
        submissions.forEach(submission => {
            if (submission.dimensionEvaluations) {
                submission.dimensionEvaluations.forEach((d: any) => {
                    allDimensions.add(d.dimensionId);
                });
            }
        });

        allDimensions.forEach(dimId => {
            const dimResults = submissions.flatMap(s =>
                s.dimensionEvaluations?.filter((d: any) => d.dimensionId === dimId) || []
            );

            if (dimResults.length > 1) {
                const winners = dimResults.map(d => d.winner).filter(w => w);
                const uniqueWinners = new Set(winners);
                const consistency = winners.length > 0 ? 1 - (uniqueWinners.size - 1) / winners.length : 0;
                dimensionConsistency += consistency;
                dimensionCount++;
            }
        });

        return dimensionCount > 0 ? (dimensionConsistency / dimensionCount) * 100 : 100;
    }

    return (totalConsistency / questionCount) * 100;
}

function sortUsers(users: UserData[], sortBy: UserSortBy, order: SortOrder): UserData[] {
    const sortedUsers = [...users];

    sortedUsers.sort((a, b) => {
        let comparison = 0;

        switch (sortBy) {
            case 'submissions':
                comparison = a.submissionCount - b.submissionCount;
                break;
            case 'lastActivity':
                comparison = new Date(a.lastSubmission).getTime() - new Date(b.lastSubmission).getTime();
                break;
            case 'consistency':
                comparison = a.consistency - b.consistency;
                break;
            case 'completionRate':
                comparison = a.completionRate - b.completionRate;
                break;
            case 'responseTime':
                comparison = a.avgResponseTime - b.avgResponseTime;
                break;
            default:
                comparison = a.submissionCount - b.submissionCount;
        }

        return order === 'desc' ? -comparison : comparison;
    });

    return sortedUsers;
} 