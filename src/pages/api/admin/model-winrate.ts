import { NextApiRequest, NextApiResponse } from 'next';
import { getModelWinRateData } from '@/db';
import type { ModelWinRateAnalysis } from '@/types/admin';
import {
    parseAdminApiParams,
    createSuccessResponse,
    createErrorResponse
} from '@/utils/adminCommon';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
    if (req.method !== 'GET') {
        return res.status(405).json(createErrorResponse('Method not allowed'));
    }

    try {
        // Parse common admin parameters
        const params = parseAdminApiParams(req);

        // Call database function to get model win rate data
        const response: ModelWinRateAnalysis = await getModelWinRateData({
            startDate: new Date(params.calculatedStartDate),
            endDate: new Date(params.calculatedEndDate),
            excludeTraps: params.shouldExcludeTraps,
            excludeIncomplete: params.shouldExcludeIncomplete
        });

        return res.status(200).json(createSuccessResponse(response, params.timeRange));

    } catch (error) {
        console.error('Model win rate analysis error:', error);
        return res.status(500).json(createErrorResponse('Failed to analyze model win rates'));
    }
} 