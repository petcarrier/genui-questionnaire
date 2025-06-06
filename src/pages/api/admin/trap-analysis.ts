import type { NextApiRequest, NextApiResponse } from 'next';
import { getTrapAnalysisData } from '@/db';
import type { TrapAnalysisData } from '@/types/admin';
import { parseAdminApiParams, createSuccessResponse, createErrorResponse, AdminApiResponse } from '@/utils';

export default async function handler(
    req: NextApiRequest,
    res: NextApiResponse<AdminApiResponse<TrapAnalysisData>>
) {
    if (req.method !== 'GET') {
        return res.status(405).json(createErrorResponse('Method not allowed'));
    }

    try {
        // Parse parameters using utils function
        const {
            shouldExcludeIncomplete,
            calculatedStartDate,
            calculatedEndDate,
            timeRange
        } = parseAdminApiParams(req);

        // Call database function to get trap analysis data
        const result = await getTrapAnalysisData({
            startDate: calculatedStartDate,
            endDate: calculatedEndDate,
            excludeIncomplete: shouldExcludeIncomplete
        });

        // Use utils function to create success response
        return res.status(200).json(createSuccessResponse(result, timeRange));

    } catch (error) {
        console.error('Error fetching trap analysis data:', error);
        return res.status(500).json(createErrorResponse('Failed to fetch trap analysis data'));
    }
} 