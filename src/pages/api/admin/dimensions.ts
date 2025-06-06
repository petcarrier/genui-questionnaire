import type { NextApiRequest, NextApiResponse } from 'next';
import { getDimensionsAnalyticsData } from '@/db';
import type { DimensionsAnalyticsData, AdminApiResponse, TimeRange } from '@/types/admin';
import { calculateTimeRange } from '@/utils/timeRangeUtils';

export default async function handler(
    req: NextApiRequest,
    res: NextApiResponse<AdminApiResponse<DimensionsAnalyticsData>>
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

        // Calculate time range
        const { startDate: calculatedStartDate, endDate: calculatedEndDate } = calculateTimeRange(
            validTimeRange,
            startDate as string,
            endDate as string
        );

        // Call database function to get dimensions analytics data
        const dimensionsData = await getDimensionsAnalyticsData({
            timeRange: validTimeRange,
            startDate: calculatedStartDate,
            endDate: calculatedEndDate,
            excludeTraps: shouldExcludeTraps,
            excludeIncomplete: shouldExcludeIncomplete
        });

        return res.status(200).json({
            success: true,
            data: dimensionsData,
            timeRange: validTimeRange
        });

    } catch (error) {
        console.error('Error generating dimensions analytics:', error);
        return res.status(500).json({
            success: false,
            message: 'Failed to generate dimensions analytics'
        });
    }
} 