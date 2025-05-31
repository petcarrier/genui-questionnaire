import type { NextApiRequest, NextApiResponse } from 'next';
import { getQuestionnaireGroupByAnnotatorId } from '@/lib/database';
import { QuestionnaireQuestion } from '@/types/questionnaire';

interface ApiResponse {
    success: boolean;
    message: string;
    data?: {
        questionnaireId: string;
        annotatorId: string;
        questions: QuestionnaireQuestion[];
        status: string;
        currentQuestionIndex: number;
        totalQuestions: number;
        createdAt: Date;
        completedAt?: Date;
    };
}

export default async function handler(
    req: NextApiRequest,
    res: NextApiResponse<ApiResponse>
) {
    if (req.method !== 'GET') {
        return res.status(405).json({
            success: false,
            message: 'Method not allowed'
        });
    }

    try {
        const { annotatorId, questionnaireId } = req.query;

        if (!annotatorId || typeof annotatorId !== 'string') {
            return res.status(400).json({
                success: false,
                message: 'Valid annotator ID is required'
            });
        }

        if (!questionnaireId || typeof questionnaireId !== 'string') {
            return res.status(400).json({
                success: false,
                message: 'Valid questionnaire ID is required'
            });
        }

        const questionnaireGroup = await getQuestionnaireGroupByAnnotatorId(annotatorId, questionnaireId);

        if (!questionnaireGroup) {
            return res.status(404).json({
                success: false,
                message: 'Questionnaire group not found for this annotator and questionnaire combination'
            });
        }

        return res.status(200).json({
            success: true,
            message: 'Questionnaire group retrieved successfully',
            data: questionnaireGroup
        });

    } catch (error) {
        console.error('Error getting questionnaire group by annotator ID:', error);
        return res.status(500).json({
            success: false,
            message: 'Failed to get questionnaire group'
        });
    }
} 