import type { NextApiRequest, NextApiResponse } from 'next';
import { getStoredSubmissions, getSubmissionStats } from '@/lib/db/submissions';
import { getPageViewStats } from '@/lib/db/page-views';
import { getAllUsersQuestionnaireStats } from '@/lib/db/questionnaire-groups';
import {
    UserData,
    UsersResponse,
    UserSortBy,
    SortOrder,
    TimeRange,
    AdminApiResponse
} from '@/types';
import { subDays } from 'date-fns';
import {
    parseAdminApiParams,
    createSuccessResponse,
    createErrorResponse
} from '@/utils/adminCommon';

export default async function handler(
    req: NextApiRequest,
    res: NextApiResponse<AdminApiResponse<UsersResponse>>
) {
    if (req.method !== 'GET') {
        return res.status(405).json(createErrorResponse('Method not allowed'));
    }

    try {
        // 解析通用admin参数
        const params = parseAdminApiParams(req);

        // 获取数据
        const [submissions, submissionStats, questionnaireStats] = await Promise.all([
            getStoredSubmissions(
                params.shouldExcludeTraps,
                params.calculatedStartDate,
                params.calculatedEndDate,
                params.shouldExcludeIncomplete
            ),
            getSubmissionStats(
                params.shouldExcludeTraps,
                params.calculatedStartDate,
                params.calculatedEndDate,
                params.shouldExcludeIncomplete
            ),
            getAllUsersQuestionnaireStats(
                params.calculatedStartDate ? new Date(params.calculatedStartDate) : undefined,
                params.calculatedEndDate ? new Date(params.calculatedEndDate) : undefined
            )
        ]);

        // 分析用户数据
        const usersData = analyzeUsers(submissions, questionnaireStats, params.timeRange);

        return res.status(200).json(createSuccessResponse(usersData, params.timeRange));

    } catch (error) {
        console.error('Error generating user stats:', error);
        return res.status(500).json(createErrorResponse('Failed to generate user statistics'));
    }
}

function analyzeUsers(
    submissions: any[],
    questionnaireStats: any[],
    timeRange: TimeRange
) {
    const now = new Date();
    const days = timeRange === '7d' ? 7 : timeRange === '30d' ? 30 : timeRange === 'custom' ? 30 : 90;
    const startDate = subDays(now, days);
    const oneWeekAgo = subDays(now, 7);

    // 创建问卷用户映射
    const questionnaireUserMap = new Map<string, any>();
    questionnaireStats.forEach(stat => {
        questionnaireUserMap.set(stat.annotatorId, stat);
    });

    // 按用户分组提交
    const userGroups: { [userId: string]: any[] } = {};
    submissions.forEach(submission => {
        const userId = submission.annotatorId || 'anonymous';
        if (!userGroups[userId]) userGroups[userId] = [];
        userGroups[userId].push(submission);
    });

    // 合并问卷用户和提交用户
    const allUserIds = new Set([
        ...Object.keys(userGroups),
        ...questionnaireStats.map(stat => stat.annotatorId)
    ]);

    // 分析每个用户
    const users: UserData[] = Array.from(allUserIds).map(userId => {
        const userSubmissions = userGroups[userId] || [];
        const questionnaireData = questionnaireUserMap.get(userId);

        // 过滤时间范围内的提交
        const filteredSubmissions = userSubmissions.filter(s =>
            new Date(s.submittedAt) >= startDate
        );

        // 如果用户既没有提交也没有问卷数据，跳过
        if (filteredSubmissions.length === 0 && !questionnaireData) {
            return null;
        }

        let submissionDates: Date[] = [];
        let questionsAnswered: string[] = [];
        let avgResponseTime = 0;
        let consistency = 100;
        let completionRate = 0;

        // 处理提交数据
        if (filteredSubmissions.length > 0) {
            submissionDates = filteredSubmissions.map(s => new Date(s.submittedAt));
            questionsAnswered = [...new Set(filteredSubmissions.map(s => s.questionId))];

            // 计算响应时间
            const durations = filteredSubmissions.map(s => s.duration || 60);
            avgResponseTime = durations.reduce((a, b) => a + b, 0) / durations.length;

            // 计算一致性分数
            consistency = calculateUserConsistency(filteredSubmissions);

            // 计算完成率（基于维度评估）
            let totalDimensions = 0;
            let completedDimensions = 0;
            filteredSubmissions.forEach(submission => {
                if (submission.dimensionEvaluations) {
                    totalDimensions += submission.dimensionEvaluations.length;
                    completedDimensions += submission.dimensionEvaluations.filter((d: any) => d.winner).length;
                }
            });
            completionRate = totalDimensions > 0 ? (completedDimensions / totalDimensions) * 100 : 0;
        }

        // 处理问卷数据
        let questionnaireCompletionRate = 0;
        let totalQuestionnaires = 0;
        let completedQuestionnaires = 0;
        let activeQuestionnaires = 0;
        let totalQuestions = 0;
        let currentProgress = 0;
        let firstQuestionnaireCreated = '';
        let lastQuestionnaireActivity = '';

        if (questionnaireData) {
            totalQuestionnaires = questionnaireData.totalQuestionnaires;
            completedQuestionnaires = questionnaireData.completedQuestionnaires;
            activeQuestionnaires = questionnaireData.activeQuestionnaires;
            questionnaireCompletionRate = questionnaireData.avgCompletionRate;
            totalQuestions = questionnaireData.totalQuestions;
            currentProgress = questionnaireData.currentProgress;
            firstQuestionnaireCreated = questionnaireData.firstCreated.toISOString();
            lastQuestionnaireActivity = questionnaireData.lastActivity.toISOString();
        }

        // 确定首次和最后活动时间
        const allDates = [
            ...submissionDates,
            ...(questionnaireData ? [questionnaireData.firstCreated, questionnaireData.lastActivity] : [])
        ].filter(date => date);

        const firstSubmission = allDates.length > 0 ?
            allDates.sort((a, b) => a.getTime() - b.getTime())[0].toISOString() :
            (questionnaireData ? firstQuestionnaireCreated : new Date().toISOString());

        const lastSubmission = allDates.length > 0 ?
            allDates.sort((a, b) => b.getTime() - a.getTime())[0].toISOString() :
            (questionnaireData ? lastQuestionnaireActivity : new Date().toISOString());

        return {
            userId,
            submissionCount: filteredSubmissions.length,
            firstSubmission,
            lastSubmission,
            avgResponseTime,
            questionsAnswered,
            consistency,
            completionRate,
            // 问卷相关统计
            totalQuestionnaires,
            completedQuestionnaires,
            activeQuestionnaires,
            questionnaireCompletionRate,
            totalQuestions,
            currentProgress,
            firstQuestionnaireCreated,
            lastQuestionnaireActivity
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