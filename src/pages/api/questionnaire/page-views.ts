import type { NextApiRequest, NextApiResponse } from 'next';
import { db } from '@/lib/db/index';
import { pageViews } from '@/lib/schema';
import { eq, desc } from 'drizzle-orm';

interface PageViewData {
    id: number;
    submissionId: string;
    questionId: string;
    annotatorId: string;
    questionnaireId: string;
    linkId: string;
    linkUrl: string;
    viewType: string;

    // 观看状态详细信息
    visited: boolean;
    duration: number;
    lastVisited: Date | null;
    visitCount: number;
    startTime: Date | null;
    isCurrentlyViewing: boolean;

    // 系统记录信息
    sessionStartTime: Date | null;
    sessionEndTime: Date | null;
    totalViewTime: number;

    createdAt: Date;
    updatedAt: Date;
}

interface PageViewResponse {
    success: boolean;
    message: string;
    data?: PageViewData[];
}

export default async function handler(
    req: NextApiRequest,
    res: NextApiResponse<PageViewResponse>
) {
    if (req.method !== 'GET') {
        return res.status(405).json({
            success: false,
            message: 'Method not allowed'
        });
    }

    try {
        const { submissionId, questionId, annotatorId } = req.query;

        let views;

        // Apply filters based on query parameters
        if (typeof submissionId === 'string') {
            views = await db
                .select()
                .from(pageViews)
                .where(eq(pageViews.submissionId, submissionId))
                .orderBy(desc(pageViews.createdAt));
        } else if (typeof questionId === 'string') {
            views = await db
                .select()
                .from(pageViews)
                .where(eq(pageViews.questionId, questionId))
                .orderBy(desc(pageViews.createdAt));
        } else if (typeof annotatorId === 'string') {
            views = await db
                .select()
                .from(pageViews)
                .where(eq(pageViews.annotatorId, annotatorId))
                .orderBy(desc(pageViews.createdAt));
        } else {
            views = await db
                .select()
                .from(pageViews)
                .orderBy(desc(pageViews.createdAt));
        }

        return res.status(200).json({
            success: true,
            message: 'Page views retrieved successfully',
            data: views.map(view => ({
                id: view.id,
                submissionId: view.submissionId,
                questionId: view.questionId,
                annotatorId: view.annotatorId,
                questionnaireId: view.questionnaireId,
                linkId: view.linkId,
                linkUrl: view.linkUrl,
                viewType: view.viewType,

                // 观看状态详细信息
                visited: view.visited || false,
                duration: view.duration || 0,
                lastVisited: view.lastVisited,
                visitCount: view.visitCount || 0,
                startTime: view.startTime,
                isCurrentlyViewing: view.isCurrentlyViewing || false,

                // 系统记录信息
                sessionStartTime: view.sessionStartTime,
                sessionEndTime: view.sessionEndTime,
                totalViewTime: view.totalViewTime || 0,

                createdAt: view.createdAt || new Date(),
                updatedAt: view.updatedAt || new Date()
            }))
        });

    } catch (error) {
        console.error('Error retrieving page views:', error);
        return res.status(500).json({
            success: false,
            message: 'Failed to retrieve page views'
        });
    }
} 