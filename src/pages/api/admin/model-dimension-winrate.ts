import { NextApiRequest, NextApiResponse } from 'next';
import { getModelDimensionWinRateData } from '@/db';
import type { ModelDimensionWinRateAnalysis } from '@/types/admin';
import { calculateTimeRange } from '@/utils/timeRangeUtils';
import type { TimeRange } from '@/types';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
    if (req.method !== 'GET') {
        return res.status(405).json({ success: false, message: 'Method not allowed' });
    }

    try {
        const {
            timeRange,
            startDate,
            endDate,
            excludeTraps,
            excludeIncomplete
        } = req.query;

        // Build date filter using time range utility
        const { startDate: calcStartDate, endDate: calcEndDate } = calculateTimeRange(
            timeRange as TimeRange,
            startDate as string,
            endDate as string
        );

        // Call database function to get model dimension win rate data
        const response: ModelDimensionWinRateAnalysis = await getModelDimensionWinRateData({
            startDate: new Date(calcStartDate),
            endDate: new Date(calcEndDate),
            excludeTraps: excludeTraps === 'true',
            excludeIncomplete: excludeIncomplete === 'true'
        });

        res.status(200).json({
            success: true,
            data: response
        });

    } catch (error) {
        console.error('Model dimension win rate analysis error:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to analyze model dimension win rates'
        });
    }
} 