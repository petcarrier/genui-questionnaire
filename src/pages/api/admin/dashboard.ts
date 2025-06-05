import type { NextApiRequest, NextApiResponse } from 'next';
import { getStoredSubmissions, getSubmissionStats } from '@/lib/db/submissions';
import { getPageViewStats } from '@/lib/db/page-views';
import { DashboardData, AdminApiResponse } from '@/types';

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
        // 获取所有数据
        const [submissions, submissionStats, pageViewStats] = await Promise.all([
            getStoredSubmissions(),
            getSubmissionStats(),
            getPageViewStats()
        ]);

        // 计算更详细的统计信息
        const now = new Date();
        const oneWeekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);

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
            .sort(([, a], [, b]) => b - a)[0]?.[0] || '';

        // 计算完成率
        const completionRate = pageViewStats.totalViews > 0
            ? (submissionStats.totalSubmissions / pageViewStats.totalViews) * 100
            : 0;

        // 前5个最受欢迎的问题
        const topQuestions = Object.entries(submissionStats.submissionsByQuestion)
            .map(([questionId, count]) => ({ questionId, count }))
            .sort((a, b) => b.count - a.count)
            .slice(0, 5);

        const dashboardData: DashboardData = {
            summary: {
                totalSubmissions: submissionStats.totalSubmissions,
                totalQuestions: Object.keys(submissionStats.submissionsByQuestion).length,
                totalPageViews: pageViewStats.totalViews,
                averageCompletionTime: pageViewStats.averageDuration,
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
                    averageTimeSpent: pageViewStats.averageDuration,
                    bounceRate: pageViewStats.averageVisitCount > 0
                        ? Math.round((1 - pageViewStats.averageVisitCount) * 100)
                        : 0
                }
            }
        };

        return res.status(200).json({
            success: true,
            data: dashboardData
        });

    } catch (error) {
        console.error('Error fetching dashboard data:', error);
        return res.status(500).json({
            success: false,
            message: 'Failed to fetch dashboard data'
        });
    }
} 