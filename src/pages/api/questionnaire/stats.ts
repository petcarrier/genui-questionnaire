import type { NextApiRequest, NextApiResponse } from 'next';
import { getPageViewStats } from '@/lib/db/page-views';
import { getSubmissionStats } from '@/lib/db/submissions';

interface StatsResponse {
    success: boolean;
    message: string;
    data?: {
        submissions: {
            totalSubmissions: number;
            submissionsByQuestion: { [questionId: string]: number };
            submissionsByDate: { [date: string]: number };
        };
        pageViews: {
            totalViews: number;
            viewsByLink: { [linkId: string]: number };
            averageDuration: number;
            totalDuration: number;
            averageVisitCount: number;
            totalVisitCount: number;
        };
    };
}

export default async function handler(
    req: NextApiRequest,
    res: NextApiResponse<StatsResponse>
) {
    if (req.method !== 'GET') {
        return res.status(405).json({
            success: false,
            message: 'Method not allowed'
        });
    }

    try {
        const { submissionId } = req.query;

        // Get submission statistics
        const submissionStats = await getSubmissionStats();

        // Get page view statistics
        const pageViewStats = await getPageViewStats(
            typeof submissionId === 'string' ? submissionId : undefined
        );

        return res.status(200).json({
            success: true,
            message: 'Statistics retrieved successfully',
            data: {
                submissions: submissionStats,
                pageViews: pageViewStats
            }
        });

    } catch (error) {
        console.error('Error retrieving statistics:', error);
        return res.status(500).json({
            success: false,
            message: 'Failed to retrieve statistics'
        });
    }
} 