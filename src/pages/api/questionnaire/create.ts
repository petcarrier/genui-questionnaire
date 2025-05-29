import type { NextApiRequest, NextApiResponse } from 'next';
import { createQuestionnaireGroup as dbCreateQuestionnaireGroup } from '@/lib/database';
import { createQuestionnaireGroup } from '@/data/questionnaireData';

interface CreateQuestionnaireRequest {
    annotatorId: string;
    questionnaireId?: string;
}

interface ApiResponse {
    success: boolean;
    message: string;
    questionnaireId?: string;
    firstQuestionId?: string;
    error?: string;
}

export default async function handler(
    req: NextApiRequest,
    res: NextApiResponse<ApiResponse>
) {
    if (req.method !== 'POST') {
        return res.status(405).json({
            success: false,
            message: 'Method not allowed',
            error: 'Only POST requests are allowed'
        });
    }

    try {
        const request: CreateQuestionnaireRequest = req.body;

        if (!request.annotatorId) {
            return res.status(400).json({
                success: false,
                message: 'Invalid request',
                error: 'Annotator ID is required'
            });
        }

        // 创建问卷组
        const { questionnaireId, questions } = createQuestionnaireGroup(request.questionnaireId);

        // 将问卷组存储到数据库
        await dbCreateQuestionnaireGroup(questionnaireId, questions, request.annotatorId);

        return res.status(200).json({
            success: true,
            message: 'Questionnaire group created successfully',
            questionnaireId,
            firstQuestionId: questions.length > 0 ? questions[0].id : undefined
        });

    } catch (error) {
        console.error('Error creating questionnaire group:', error);
        return res.status(500).json({
            success: false,
            message: 'Failed to create questionnaire group',
            error: error instanceof Error ? error.message : 'Unknown error occurred'
        });
    }
} 