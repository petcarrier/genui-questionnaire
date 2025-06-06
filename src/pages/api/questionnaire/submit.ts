import type { NextApiRequest, NextApiResponse } from 'next';
import { QuestionnaireResponse } from '@/types/questionnaire';
import { saveQuestionnaireResponse } from '@/db/submissions';
import { getStoredSubmissions } from '@/db/submissions';
import { deleteDraft } from '@/db/drafts';
import {
    getQuestionnaireGroupByAnnotatorId,
    updateQuestionnaireGroupProgressByAnnotatorId,
    completeQuestionnaireGroupByAnnotatorId
} from '@/db/questionnaire-groups';
import { format } from 'date-fns';
import { v4 as uuidv4 } from 'uuid';

interface SubmissionData {
    response: QuestionnaireResponse;
}

interface ApiResponse {
    success: boolean;
    message: string;
    submissionId?: string;
}

export { getStoredSubmissions };

export default function handler(
    req: NextApiRequest,
    res: NextApiResponse<ApiResponse>
) {
    if (req.method !== 'POST') {
        return res.status(405).json({
            success: false,
            message: 'Method not allowed'
        });
    }

    try {
        const { response }: SubmissionData = req.body;

        // Validate required fields
        if (!response.questionId || !response.linkAUrl || !response.linkBUrl || !response.questionnaireId || !response.taskGroupId || !response.dimensionEvaluations || !response.overallWinner) {
            return res.status(400).json({
                success: false,
                message: 'Missing required fields'
            });
        }

        // Validate captcha token (simple verification)
        // const isValidCaptcha = validateCaptcha(response.captchaResponse);
        // if (!isValidCaptcha) {
        //     return res.status(400).json({
        //         success: false,
        //         message: 'Invalid captcha verification'
        //     });
        // }

        // Validate dimension evaluations
        if (response.dimensionEvaluations.length !== 7) {
            return res.status(400).json({
                success: false,
                message: 'All 7 dimensions must be evaluated'
            });
        }

        const annotatorId = response.annotatorId || `annotator_${uuidv4()}`;

        // Generate submission ID
        const submissionId = `sub_${uuidv4()}`;

        // Store the submission in database
        const responseWithAnnotator = {
            ...response,
            annotatorId,
            submittedAt: new Date()
        };

        saveQuestionnaireResponse(responseWithAnnotator, submissionId)
            .then(() => {
                // 删除对应的草稿
                deleteDraft(annotatorId, response.questionId, response.questionnaireId)
                    .catch((error) => {
                        console.error('Error deleting draft (non-critical):', error);
                    });

                // Log submission for demo purposes
                console.log(`New submission saved to database: ${submissionId}`, {
                    questionId: response.questionId,
                    annotatorId,
                    questionnaireId: response.questionnaireId,
                    overallWinner: response.overallWinner,
                    dimensionEvaluations: response.dimensionEvaluations.length,
                    timestamp: format(new Date(), 'yyyy-MM-dd HH:mm:ss')
                });

                // Update questionnaire group progress
                getQuestionnaireGroupByAnnotatorId(annotatorId, response.questionnaireId)
                    .then((group) => {
                        if (group) {
                            // 找到当前问题在问卷组中的索引
                            const currentQuestionIndex = group.questions.findIndex(q => q.id === response.questionId);
                            if (currentQuestionIndex !== -1) {
                                const newIndex = currentQuestionIndex + 1;
                                updateQuestionnaireGroupProgressByAnnotatorId(annotatorId, newIndex, response.questionId, response.questionnaireId);

                                // 如果是最后一题，标记为完成
                                if (newIndex >= group.totalQuestions) {
                                    completeQuestionnaireGroupByAnnotatorId(annotatorId, response.questionnaireId);
                                }
                            }
                        }
                    })
                    .catch((error) => {
                        console.error('Error updating questionnaire group progress:', error);
                    });

                return res.status(200).json({
                    success: true,
                    message: 'Questionnaire submitted successfully',
                    submissionId
                });
            })
            .catch((error) => {
                console.error('Error saving submission to database:', error);
                return res.status(500).json({
                    success: false,
                    message: 'Failed to save submission to database'
                });
            });

    } catch (error) {
        console.error('Error processing submission:', error);
        return res.status(500).json({
            success: false,
            message: 'Internal server error'
        });
    }
}

function validateCaptcha(captchaResponse: string): boolean {
    try {
        // Decode the base64 token
        const decoded = atob(captchaResponse);
        const [equation, timestamp] = decoded.split(':');

        // Check if the equation format is correct
        const match = equation.match(/^(\d+)\+(\d+)=(\d+)$/);
        if (!match) return false;

        const [, num1, num2, result] = match;
        const expectedResult = parseInt(num1) + parseInt(num2);

        // Verify the math is correct
        if (parseInt(result) !== expectedResult) return false;

        // Check if token is not too old (5 minutes)
        const tokenTime = parseInt(timestamp);
        const now = Date.now();
        const fiveMinutes = 5 * 60 * 1000;

        return (now - tokenTime) < fiveMinutes;
    } catch {
        return false;
    }
} 