import type { NextApiRequest, NextApiResponse } from 'next';
import { saveDraft, getDraft, deleteDraft, QuestionnaireDraft } from '@/db/drafts';

interface DraftApiResponse {
    success: boolean;
    message: string;
    draft?: QuestionnaireDraft;
}

export default async function handler(
    req: NextApiRequest,
    res: NextApiResponse<DraftApiResponse>
) {
    try {
        if (req.method === 'POST') {
            // 保存草稿
            const draftData: QuestionnaireDraft = req.body;

            if (!draftData.annotatorId || !draftData.questionId || !draftData.questionnaireId) {
                return res.status(400).json({
                    success: false,
                    message: 'Missing required fields: annotatorId, questionId, questionnaireId'
                });
            }

            await saveDraft(draftData);

            return res.status(200).json({
                success: true,
                message: 'Draft saved successfully'
            });

        } else if (req.method === 'GET') {
            // 获取草稿
            const { annotatorId, questionId, questionnaireId } = req.query;

            if (!annotatorId || !questionId || !questionnaireId) {
                return res.status(400).json({
                    success: false,
                    message: 'Missing required query parameters: annotatorId, questionId, questionnaireId'
                });
            }

            const draft = await getDraft(
                annotatorId as string,
                questionId as string,
                questionnaireId as string
            );

            return res.status(200).json({
                success: true,
                message: draft ? 'Draft found' : 'No draft found',
                draft: draft || undefined
            });

        } else if (req.method === 'DELETE') {
            // 删除草稿
            const { annotatorId, questionId, questionnaireId } = req.query;

            if (!annotatorId || !questionId || !questionnaireId) {
                return res.status(400).json({
                    success: false,
                    message: 'Missing required query parameters: annotatorId, questionId, questionnaireId'
                });
            }

            await deleteDraft(
                annotatorId as string,
                questionId as string,
                questionnaireId as string
            );

            return res.status(200).json({
                success: true,
                message: 'Draft deleted successfully'
            });

        } else {
            return res.status(405).json({
                success: false,
                message: 'Method not allowed'
            });
        }

    } catch (error) {
        console.error('Draft API error:', error);
        return res.status(500).json({
            success: false,
            message: 'Internal server error'
        });
    }
} 