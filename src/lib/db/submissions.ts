import { QuestionnaireResponse } from '@/types/questionnaire';
import { submissions, dimensionEvaluations } from '../schema';
import { eq, desc, sql, inArray, and } from 'drizzle-orm';
import { db } from './index';
import { savePageViewData } from './page-views';

// Save questionnaire response
export async function saveQuestionnaireResponse(
    response: QuestionnaireResponse,
    submissionId: string
): Promise<void> {
    try {
        await db.transaction(async (tx) => {
            // Insert main submission record
            await tx.insert(submissions).values({
                submissionId,
                questionId: response.questionId,
                linkAUrl: response.linkAUrl,
                linkBUrl: response.linkBUrl,
                questionnaireId: response.questionnaireId,
                taskGroupId: response.taskGroupId,
                overallWinner: response.overallWinner,
                captchaResponse: response.captchaResponse,
                annotatorId: response.annotatorId,
                isTrap: response.isTrap || false,
                createdAt: new Date(),
                submittedAt: response.submittedAt
            });

            // Insert dimension evaluation records
            if (response.dimensionEvaluations.length > 0) {
                await tx.insert(dimensionEvaluations).values(
                    response.dimensionEvaluations.map((evaluation) => ({
                        submissionId,
                        questionId: response.questionId,
                        annotatorId: response.annotatorId,
                        dimensionId: evaluation.dimensionId,
                        winner: evaluation.winner,
                        notes: evaluation.notes || null,
                        createdAt: new Date()
                    }))
                );
            }
        });

        // 保存页面观看数据（在事务外执行，避免影响主要数据保存）
        try {
            await savePageViewData(submissionId, response);
        } catch (error) {
            console.error('Error saving page view data (non-critical):', error);
        }

        console.log('Questionnaire response saved successfully');
    } catch (error) {
        console.error('Error saving questionnaire response:', error);
        throw error;
    }
}

// Get all submission records
export async function getStoredSubmissions(
    excludeTraps: boolean = false,
    startDate?: string,
    endDate?: string,
    excludeIncomplete: boolean = false
): Promise<QuestionnaireResponse[]> {
    try {
        // Query all submission records with filters
        const submissionsData = await db
            .select()
            .from(submissions)
            .where(
                and(
                    excludeTraps ? sql`(${submissions.isTrap} = false OR ${submissions.isTrap} IS NULL)` : undefined,
                    startDate ? sql`${submissions.submittedAt} >= ${startDate}` : undefined,
                    endDate ? sql`${submissions.submittedAt} <= ${endDate}` : undefined
                )
            )
            .orderBy(desc(submissions.submittedAt));

        const submissionIds = submissionsData.map(s => s.submissionId);

        let evaluationsData: any[] = [];
        if (submissionIds.length > 0) {
            evaluationsData = await db
                .select()
                .from(dimensionEvaluations)
                .where(inArray(dimensionEvaluations.submissionId, submissionIds));
        }

        // Convert results to QuestionnaireResponse array
        let results: QuestionnaireResponse[] = submissionsData.map((submission) => {
            const relatedEvaluations = evaluationsData.filter(
                (evaluation) => evaluation.submissionId === submission.submissionId
            );

            return {
                questionId: submission.questionId,
                linkAUrl: submission.linkAUrl,
                linkBUrl: submission.linkBUrl,
                questionnaireId: submission.questionnaireId,
                taskGroupId: submission.taskGroupId,
                overallWinner: submission.overallWinner as "A" | "B" | "tie",
                captchaResponse: submission.captchaResponse,
                annotatorId: submission.annotatorId,
                isTrap: submission.isTrap || false,
                submittedAt: new Date(submission.submittedAt),
                dimensionEvaluations: relatedEvaluations.map((evaluation) => ({
                    dimensionId: evaluation.dimensionId!,
                    winner: evaluation.winner as "A" | "B" | "tie",
                    notes: evaluation.notes || ""
                }))
            };
        });

        // 如果需要排除未完成的提交
        if (excludeIncomplete) {
            results = results.filter(submission => {
                // 检查是否所有维度评估都有winner
                return submission.dimensionEvaluations.length > 0 &&
                    submission.dimensionEvaluations.every(evaluation => evaluation.winner);
            });
        }

        return results;
    } catch (error) {
        console.error('Error getting stored submissions:', error);
        throw error;
    }
}

// Get submission statistics
export async function getSubmissionStats(
    excludeTraps: boolean = true,
    startDate?: string,
    endDate?: string,
    excludeIncomplete: boolean = false
): Promise<{
    totalSubmissions: number;
    submissionsByQuestion: { [questionId: string]: number };
    submissionsByDate: { [date: string]: number };
}> {
    try {
        let filteredSubmissions = await getStoredSubmissions(excludeTraps, startDate, endDate, excludeIncomplete);

        const submissionsByQuestion: { [questionId: string]: number } = {};
        const submissionsByDate: { [date: string]: number } = {};
        let totalSubmissions = filteredSubmissions.length;

        filteredSubmissions.forEach((submission) => {
            submissionsByQuestion[submission.questionId] = (submissionsByQuestion[submission.questionId] || 0) + 1;

            const dateStr = submission.submittedAt.toISOString().split('T')[0];
            submissionsByDate[dateStr] = (submissionsByDate[dateStr] || 0) + 1;
        });

        return {
            totalSubmissions,
            submissionsByQuestion,
            submissionsByDate
        };
    } catch (error) {
        console.error('Error getting submission stats:', error);
        throw error;
    }
} 