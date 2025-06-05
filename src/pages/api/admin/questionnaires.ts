import type { NextApiRequest, NextApiResponse } from 'next';
import { getUserQuestionnaireDetails } from '@/lib/db/questionnaire-groups';
import { AdminApiResponse } from '@/types';
import { parseAdminApiParams, createSuccessResponse, createErrorResponse } from '@/utils/adminCommon';

interface QuestionnaireDetail {
    annotatorId: string;
    questionnaireId: string;
    status: string;
    currentQuestionIndex: number;
    totalQuestions: number;
    completionRate: number;
    createdAt: Date;
    completedAt?: Date;
    lastActivity: Date;
    questions: {
        questionId: string;
        questionIndex: number;
        userQuery: string;
        linkAUrl: string;
        linkBUrl: string;
        taskGroupId: string;
        isTrap: boolean;
        completedAt?: Date;
    }[];
}

interface QuestionnairesResponse {
    questionnaires: QuestionnaireDetail[];
    total: number;
    totalPages: number;
    currentPage: number;
    hasNextPage: boolean;
    hasPrevPage: boolean;
}

export default async function handler(
    req: NextApiRequest,
    res: NextApiResponse<AdminApiResponse<QuestionnairesResponse>>
) {
    if (req.method !== 'GET') {
        return res.status(405).json(createErrorResponse('Method not allowed'));
    }

    try {
        // 解析通用admin参数
        const params = parseAdminApiParams(req);

        // 解析分页参数
        const page = parseInt(req.query.page as string) || 1;
        const limit = parseInt(req.query.limit as string) || 10;
        const annotatorId = req.query.annotatorId as string | undefined;

        // 获取问卷详细列表
        const result = await getUserQuestionnaireDetails(
            annotatorId,
            params.calculatedStartDate ? new Date(params.calculatedStartDate) : undefined,
            params.calculatedEndDate ? new Date(params.calculatedEndDate) : undefined,
            page,
            limit
        );

        const response: QuestionnairesResponse = {
            questionnaires: result.questionnaires,
            total: result.total,
            totalPages: result.totalPages,
            currentPage: result.currentPage,
            hasNextPage: result.currentPage < result.totalPages,
            hasPrevPage: result.currentPage > 1
        };

        return res.status(200).json(createSuccessResponse(response, params.timeRange));

    } catch (error) {
        console.error('Error fetching questionnaires:', error);
        return res.status(500).json(createErrorResponse('Failed to fetch questionnaires'));
    }
} 