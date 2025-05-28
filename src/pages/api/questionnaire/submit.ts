import type { NextApiRequest, NextApiResponse } from 'next';
import { QuestionnaireResponse } from '@/types/questionnaire';
import { saveQuestionnaireResponse, getStoredSubmissions } from '@/lib/database';
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
        if (!response.questionId || !response.linkAUrl || !response.linkBUrl || !response.questionnaireId || !response.taskGroupId || !response.dimensionEvaluations || !response.overallWinner || !response.captchaResponse) {
            return res.status(400).json({
                success: false,
                message: 'Missing required fields'
            });
        }

        // Validate captcha token (simple verification)
        const isValidCaptcha = validateCaptcha(response.captchaResponse);
        if (!isValidCaptcha) {
            return res.status(400).json({
                success: false,
                message: 'Invalid captcha verification'
            });
        }

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
                // Log submission for demo purposes
                console.log(`New submission saved to database: ${submissionId}`, {
                    questionId: response.questionId,
                    overallWinner: response.overallWinner,
                    annotatorId,
                    dimensionEvaluations: response.dimensionEvaluations.length,
                    timestamp: format(new Date(), 'yyyy-MM-dd HH:mm:ss')
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