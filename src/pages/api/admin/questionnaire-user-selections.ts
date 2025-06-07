import { NextApiRequest, NextApiResponse } from 'next';
import { getQuestionnaireUserSelectionsData } from '@/db';
import type { QuestionnaireUserSelectionsAnalytics, AdminApiResponse } from '@/types/admin';
import {
    parseAdminApiParams,
    createSuccessResponse,
    createErrorResponse
} from '@/utils/adminCommon';

export default async function handler(
    req: NextApiRequest,
    res: NextApiResponse<AdminApiResponse<QuestionnaireUserSelectionsAnalytics>>
) {
    if (req.method !== 'GET') {
        return res.status(405).json(createErrorResponse('Method not allowed'));
    }

    try {
        // Parse common admin parameters
        const params = parseAdminApiParams(req);

        // Call database function to get questionnaire user selections data
        const result = await getQuestionnaireUserSelectionsData({
            timeRange: params.timeRange,
            startDate: params.calculatedStartDate,
            endDate: params.calculatedEndDate,
            excludeTraps: params.shouldExcludeTraps,
            excludeIncomplete: params.shouldExcludeIncomplete
        });

        return res.status(200).json(createSuccessResponse(result, params.timeRange));

    } catch (error) {
        console.error('Error fetching questionnaire user selections:', error);
        return res.status(500).json(createErrorResponse('Failed to fetch questionnaire user selections'));
    }
} 