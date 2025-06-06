import type { NextApiRequest, NextApiResponse } from 'next';
import { getStoredSubmissions, getSubmissionStats } from '@/db/submissions';
import { getPageViewStats } from '@/db/page-views';
import { DashboardData, AdminApiResponse, TimeRange } from '@/types';
import { subDays } from 'date-fns';
import { calculateTimeRange } from '@/utils/timeRangeUtils';

export default async function handler(
    req: NextApiRequest,
    res: NextApiResponse<AdminApiResponse<DashboardData>>
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

        // 获取数据
        const [submissions, submissionStats, pageViewStats] = await Promise.all([
            getStoredSubmissions(shouldExcludeTraps, calculatedStartDate, calculatedEndDate, shouldExcludeIncomplete),
            getSubmissionStats(shouldExcludeTraps, calculatedStartDate, calculatedEndDate, shouldExcludeIncomplete),
            getPageViewStats()
        ]);

        // 生成仪表板数据
        const dashboardData = generateDashboardData(submissions, submissionStats, pageViewStats, validTimeRange);

        return res.status(200).json({
            success: true,
            data: dashboardData,
            timeRange: validTimeRange
        });

    } catch (error) {
        console.error('Error generating dashboard data:', error);
        return res.status(500).json({
            success: false,
            message: 'Failed to generate dashboard data'
        });
    }
}

function generateDashboardData(
    submissions: any[],
    submissionStats: any,
    pageViewStats: any,
    timeRange: TimeRange
): DashboardData {
    // 计算更详细的统计信息
    const now = new Date();
    const oneWeekAgo = subDays(now, 7);

    const recentSubmissions = submissions.filter(s =>
        new Date(s.submittedAt) >= oneWeekAgo
    );

    // 按小时统计
    const submissionsByHour: { [hour: string]: number } = {};
    for (let i = 0; i < 24; i++) {
        submissionsByHour[i.toString().padStart(2, '0')] = 0;
    }

    submissions.forEach(submission => {
        const hour = new Date(submission.submittedAt).getHours();
        submissionsByHour[hour.toString().padStart(2, '0')]++;
    });

    // 按星期统计
    const weekdays = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
    const submissionsByWeekday: { [weekday: string]: number } = {};
    weekdays.forEach(day => submissionsByWeekday[day] = 0);

    submissions.forEach(submission => {
        const weekday = weekdays[new Date(submission.submittedAt).getDay()];
        submissionsByWeekday[weekday]++;
    });

    // 找出最活跃的一天
    const mostActiveDay = Object.entries(submissionStats.submissionsByDate)
        .sort(([, a], [, b]) => (b as number) - (a as number))[0]?.[0] || '';

    // 修正完成率计算：基于实际的submission数据
    // 使用新的pageViewStats.uniqueSubmissions和completedSubmissions字段
    const completionRate = pageViewStats.uniqueSubmissions > 0
        ? (submissionStats.totalSubmissions / pageViewStats.uniqueSubmissions) * 100
        : 0;

    // 计算页面访问完成率（两个链接都访问的比率）
    const pageViewCompletionRate = pageViewStats.uniqueSubmissions > 0
        ? (pageViewStats.completedSubmissions / pageViewStats.uniqueSubmissions) * 100
        : 0;

    // 计算链接访问平衡度（A和B访问率的差异）
    const linkAccessBalance = Math.abs(pageViewStats.linkAViewRate - pageViewStats.linkBViewRate);

    // 前5个最受欢迎的问题
    const topQuestions = Object.entries(submissionStats.submissionsByQuestion)
        .map(([questionId, count]) => ({ questionId, count: count as number }))
        .sort((a, b) => b.count - a.count)
        .slice(0, 5);

    // 计算用户参与度指标
    const averagePageViewTimePerLink = pageViewStats.averageDuration; // 每个链接的平均观看时长
    const averageVisitsPerLink = pageViewStats.averageVisitCount; // 每个链接的平均访问次数

    // 基于链接访问率计算用户行为指标
    const userEngagementScore = Math.min(100,
        (pageViewCompletionRate * 0.6) + // 60% 权重给页面完成率
        ((100 - linkAccessBalance) * 0.4) // 40% 权重给访问平衡度
    );

    const dashboardData: DashboardData = {
        summary: {
            totalSubmissions: submissionStats.totalSubmissions,
            totalQuestions: Object.keys(submissionStats.submissionsByQuestion).length,
            pageViewCompletionRate: Math.round(pageViewCompletionRate * 100) / 100,
            linkAccessBalance: Math.round(linkAccessBalance * 100) / 100,
            mostActiveDay,
            recentSubmissions: recentSubmissions.length
        },
        submissions: {
            ...submissionStats,
            submissionsByHour,
            submissionsByWeekday
        },
        pageViews: pageViewStats,
        recentActivity: {
            recentSubmissions: submissions
                .sort((a, b) => new Date(b.submittedAt).getTime() - new Date(a.submittedAt).getTime())
                .slice(0, 10),
            topQuestions,
            userEngagement: {
                completionRate: Math.round(completionRate * 100) / 100,
                averageTimeSpent: averagePageViewTimePerLink, // 每个链接的平均观看时长
                bounceRate: pageViewCompletionRate > 0
                    ? Math.max(0, Math.round(100 - pageViewCompletionRate)) // 基于页面访问完成率计算跳出率
                    : 100 // 如果没有完成数据，默认100%跳出率
            }
        }
    };

    return dashboardData;
} 