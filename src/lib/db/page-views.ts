import { QuestionnaireResponse } from '@/types/questionnaire';
import { pageViews } from '../schema';
import { eq } from 'drizzle-orm';
import { db } from './index';

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
        let totalDuration = 0;
        let totalVisitCount = 0;

        views.forEach((view) => {
            viewsByLink[view.linkId] = (viewsByLink[view.linkId] || 0) + 1;
            totalDuration += view.totalViewTime || 0;
            totalVisitCount += view.visitCount || 0;
        });

        return {
            totalViews: views.length,
            viewsByLink,
            averageDuration: views.length > 0 ? Math.round(totalDuration / views.length) : 0,
            totalDuration,
            averageVisitCount: views.length > 0 ? Math.round(totalVisitCount / views.length) : 0,
            totalVisitCount
        };
    } catch (error) {
        console.error('Error getting page view stats:', error);
        throw error;
    }
} 