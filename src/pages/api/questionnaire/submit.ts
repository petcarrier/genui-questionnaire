import type { NextApiRequest, NextApiResponse } from 'next';
import { QuestionnaireResponse } from '@/types/questionnaire';

interface SubmissionData {
    response: QuestionnaireResponse;
}

interface ApiResponse {
    success: boolean;
    message: string;
    submissionId?: string;
}

// Simple in-memory storage for demo purposes
// In production, you would use a proper database
const submissions: QuestionnaireResponse[] = [];

// 导出存储的提交数据供导出API使用
export function getStoredSubmissions(): QuestionnaireResponse[] {
    return submissions;
}

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
        if (!response.questionId || !response.dimensionEvaluations || !response.overallWinner || !response.captchaResponse) {
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

        // 生成标注者ID（在实际应用中，这应该从认证系统获取）
        const annotatorId = response.annotatorId || `annotator_${Date.now()}_${Math.random().toString(36).substr(2, 6)}`;

        // Store the submission
        submissions.push({
            ...response,
            annotatorId,
            submittedAt: new Date()
        });

        // Generate submission ID
        const submissionId = `sub_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

        // Log submission for demo purposes
        console.log(`New submission received: ${submissionId}`, {
            questionId: response.questionId,
            overallWinner: response.overallWinner,
            annotatorId,
            dimensionEvaluations: response.dimensionEvaluations.length,
            timestamp: new Date().toISOString()
        });

        return res.status(200).json({
            success: true,
            message: 'Questionnaire submitted successfully',
            submissionId
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