import { QuestionnaireResponse } from '@/types/questionnaire';
import { pageViews } from './schema';
import { eq, and, sql } from 'drizzle-orm';
import { db } from './index';
import { isBefore } from 'date-fns';

// 保存页面观看数据
export async function savePageViewData(
    submissionId: string,
    response: QuestionnaireResponse
): Promise<void> {
    try {
        if (!response.metadata?.pageVisitStatus) {
            return;
        }

        const pageVisitStatus = response.metadata.pageVisitStatus;
        const pageViewRecords = [];

        // 为每个链接创建一条完整的观看状态记录
        for (const [linkId, visitInfo] of Object.entries(pageVisitStatus)) {
            const linkUrl = linkId === 'A' ? response.linkAUrl : response.linkBUrl;

            // 计算总观看时间
            let totalDuration = visitInfo.duration || 0;
            if (visitInfo.isCurrentlyViewing && visitInfo.startTime) {
                totalDuration += Date.now() - visitInfo.startTime;
            }

            pageViewRecords.push({
                submissionId,
                questionId: response.questionId,
                annotatorId: response.annotatorId,
                questionnaireId: response.questionnaireId,
                linkId,
                linkUrl,
                viewType: 'preview', // 可以从前端传递更详细的信息

                // 观看状态详细信息
                visited: visitInfo.visited || false,
                duration: visitInfo.duration || 0,
                lastVisited: visitInfo.lastVisited ? new Date(visitInfo.lastVisited) : null,
                visitCount: visitInfo.visitCount || 0,
                startTime: visitInfo.startTime ? new Date(visitInfo.startTime) : null,
                isCurrentlyViewing: visitInfo.isCurrentlyViewing || false,

                // 系统记录信息
                sessionStartTime: visitInfo.sessionStartTime ? new Date(visitInfo.sessionStartTime) : null,
                sessionEndTime: visitInfo.lastVisited ? new Date(visitInfo.lastVisited) : null,
                totalViewTime: totalDuration,

                createdAt: new Date(),
                updatedAt: new Date()
            });
        }

        if (pageViewRecords.length > 0) {
            await db.insert(pageViews).values(pageViewRecords);
            console.log(`Saved ${pageViewRecords.length} complete page view status records for submission ${submissionId}`);
        }
    } catch (error) {
        console.error('Error saving page view data:', error);
        throw error;
    }
}

// 获取页面观看统计数据
export async function getPageViewStats(submissionId?: string): Promise<{
    totalViews: number;
    viewsByLink: { [linkId: string]: number };
    averageDuration: number;
    totalDuration: number;
    averageVisitCount: number;
    totalVisitCount: number;
    // 新增统计指标
    uniqueSubmissions: number;
    completedSubmissions: number; // 两个链接都访问过的submission数量
    averageViewsPerSubmission: number;
    linkAViewRate: number; // 链接A的访问率
    linkBViewRate: number; // 链接B的访问率
}> {
    try {
        let views;

        if (submissionId) {
            views = await db
                .select()
                .from(pageViews)
                .where(eq(pageViews.submissionId, submissionId));
        } else {
            views = await db.select().from(pageViews);
        }

        const viewsByLink: { [linkId: string]: number } = {};
        const submissionViews: { [submissionId: string]: Set<string> } = {}; // 记录每个submission访问的链接
        let totalDuration = 0;
        let totalVisitCount = 0;

        views.forEach((view) => {
            viewsByLink[view.linkId] = (viewsByLink[view.linkId] || 0) + 1;
            totalDuration += view.totalViewTime || 0;
            totalVisitCount += view.visitCount || 0;

            // 记录submission的链接访问情况
            if (!submissionViews[view.submissionId]) {
                submissionViews[view.submissionId] = new Set();
            }
            submissionViews[view.submissionId].add(view.linkId);
        });

        const uniqueSubmissions = Object.keys(submissionViews).length;
        const completedSubmissions = Object.values(submissionViews)
            .filter(linkSet => linkSet.has('A') && linkSet.has('B')).length;

        const linkAViews = viewsByLink['A'] || 0;
        const linkBViews = viewsByLink['B'] || 0;

        return {
            totalViews: views.length,
            viewsByLink,
            averageDuration: views.length > 0 ? Math.round(totalDuration / views.length) : 0,
            totalDuration,
            averageVisitCount: views.length > 0 ? Math.round(totalVisitCount / views.length) : 0,
            totalVisitCount,
            // 新增统计指标
            uniqueSubmissions,
            completedSubmissions,
            averageViewsPerSubmission: uniqueSubmissions > 0 ? Math.round(views.length / uniqueSubmissions * 100) / 100 : 0,
            linkAViewRate: uniqueSubmissions > 0 ? Math.round(linkAViews / uniqueSubmissions * 100 * 100) / 100 : 0,
            linkBViewRate: uniqueSubmissions > 0 ? Math.round(linkBViews / uniqueSubmissions * 100 * 100) / 100 : 0
        };
    } catch (error) {
        console.error('Error getting page view stats:', error);
        throw error;
    }
}

// 根据时间范围获取页面观看统计数据
export async function getPageViewStatsByTimeRange(
    startDate?: string,
    endDate?: string
): Promise<{
    totalViews: number;
    viewsByLink: { [linkId: string]: number };
    averageDuration: number;
    totalDuration: number;
    averageVisitCount: number;
    totalVisitCount: number;
    // 新增统计指标
    uniqueSubmissions: number;
    completedSubmissions: number; // 两个链接都访问过的submission数量
    averageViewsPerSubmission: number;
    linkAViewRate: number; // 链接A的访问率
    linkBViewRate: number; // 链接B的访问率
}> {
    try {
        let views;

        // 构建查询条件
        const conditions = [];
        if (startDate) {
            conditions.push(sql`${pageViews.createdAt} >= ${startDate}`);
        }
        if (endDate) {
            conditions.push(sql`${pageViews.createdAt} <= ${endDate}`);
        }

        if (conditions.length > 0) {
            views = await db
                .select()
                .from(pageViews)
                .where(and(...conditions));
        } else {
            views = await db.select().from(pageViews);
        }

        const viewsByLink: { [linkId: string]: number } = {};
        const submissionViews: { [submissionId: string]: Set<string> } = {}; // 记录每个submission访问的链接
        let totalDuration = 0;
        let totalVisitCount = 0;

        views.forEach((view) => {
            viewsByLink[view.linkId] = (viewsByLink[view.linkId] || 0) + 1;
            totalDuration += view.totalViewTime || 0;
            totalVisitCount += view.visitCount || 0;

            // 记录submission的链接访问情况
            if (!submissionViews[view.submissionId]) {
                submissionViews[view.submissionId] = new Set();
            }
            submissionViews[view.submissionId].add(view.linkId);
        });

        const uniqueSubmissions = Object.keys(submissionViews).length;
        const completedSubmissions = Object.values(submissionViews)
            .filter(linkSet => linkSet.has('A') && linkSet.has('B')).length;

        const linkAViews = viewsByLink['A'] || 0;
        const linkBViews = viewsByLink['B'] || 0;

        return {
            totalViews: views.length,
            viewsByLink,
            averageDuration: views.length > 0 ? Math.round(totalDuration / views.length) : 0,
            totalDuration,
            averageVisitCount: views.length > 0 ? Math.round(totalVisitCount / views.length) : 0,
            totalVisitCount,
            // 新增统计指标
            uniqueSubmissions,
            completedSubmissions,
            averageViewsPerSubmission: uniqueSubmissions > 0 ? Math.round(views.length / uniqueSubmissions * 100) / 100 : 0,
            linkAViewRate: uniqueSubmissions > 0 ? Math.round(linkAViews / uniqueSubmissions * 100 * 100) / 100 : 0,
            linkBViewRate: uniqueSubmissions > 0 ? Math.round(linkBViews / uniqueSubmissions * 100 * 100) / 100 : 0
        };
    } catch (error) {
        console.error('Error getting page view stats by time range:', error);
        throw error;
    }
}

// 新增：获取提交完成情况的详细统计
export async function getSubmissionCompletionStats(): Promise<{
    totalStarted: number; // 开始评估的submission数量（至少访问一个链接）
    totalCompleted: number; // 完成评估的submission数量（访问了两个链接）
    completionRate: number; // 完成率
    averageTimeToComplete: number; // 平均完成时间
    linkPreferences: { // 用户偏好分析
        linkAFirst: number; // 先访问A链接的数量
        linkBFirst: number; // 先访问B链接的数量
    };
}> {
    try {
        const views = await db.select().from(pageViews);

        const submissionData: {
            [submissionId: string]: {
                links: Set<string>;
                firstView: { linkId: string; timestamp: Date } | null;
                totalTime: number;
            }
        } = {};

        views.forEach((view) => {
            if (!submissionData[view.submissionId]) {
                submissionData[view.submissionId] = {
                    links: new Set(),
                    firstView: null,
                    totalTime: 0
                };
            }

            const data = submissionData[view.submissionId];
            data.links.add(view.linkId);
            data.totalTime += view.totalViewTime || 0;

            if (!data.firstView || (view.createdAt && isBefore(view.createdAt, data.firstView.timestamp))) {
                data.firstView = {
                    linkId: view.linkId,
                    timestamp: view.createdAt || new Date()
                };
            }
        });

        const submissionValues = Object.values(submissionData);
        const totalStarted = submissionValues.length;
        const totalCompleted = submissionValues.filter(data => data.links.has('A') && data.links.has('B')).length;
        const completionRate = totalStarted > 0 ? (totalCompleted / totalStarted) * 100 : 0;

        const averageTimeToComplete = totalCompleted > 0
            ? submissionValues
                .filter(data => data.links.has('A') && data.links.has('B'))
                .reduce((sum, data) => sum + data.totalTime, 0) / totalCompleted
            : 0;

        const linkAFirst = submissionValues.filter(data => data.firstView?.linkId === 'A').length;
        const linkBFirst = submissionValues.filter(data => data.firstView?.linkId === 'B').length;

        return {
            totalStarted,
            totalCompleted,
            completionRate,
            averageTimeToComplete,
            linkPreferences: {
                linkAFirst,
                linkBFirst
            }
        };
    } catch (error) {
        console.error('Error getting submission completion stats:', error);
        throw error;
    }
} 