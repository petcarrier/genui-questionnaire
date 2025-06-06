import { QuestionnaireResponse } from '@/types/questionnaire';
import { submissions, dimensionEvaluations, questionnaireGroups } from './schema';
import { eq, desc, sql, inArray, and } from 'drizzle-orm';
import { db } from './index';
import { savePageViewData } from './page-views';
import { format } from 'date-fns';
import { isTrapQuestion } from '@/utils';

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
                isTrap: isTrapQuestion(response.questionId),
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
        // Build conditions for the base query
        let whereConditions = [];

        if (excludeTraps) {
            whereConditions.push(sql`(${submissions.isTrap} = false OR ${submissions.isTrap} IS NULL)`);
        }

        if (startDate) {
            whereConditions.push(sql`${submissions.submittedAt} >= ${startDate}`);
        }

        if (endDate) {
            whereConditions.push(sql`${submissions.submittedAt} <= ${endDate}`);
        }

        // If excludeIncomplete is true, join with questionnaireGroups and filter by status
        let submissionsData;
        if (excludeIncomplete) {
            submissionsData = await db
                .select({
                    // Select all submissions fields
                    id: submissions.id,
                    submissionId: submissions.submissionId,
                    questionId: submissions.questionId,
                    linkAUrl: submissions.linkAUrl,
                    linkBUrl: submissions.linkBUrl,
                    questionnaireId: submissions.questionnaireId,
                    taskGroupId: submissions.taskGroupId,
                    overallWinner: submissions.overallWinner,
                    captchaResponse: submissions.captchaResponse,
                    annotatorId: submissions.annotatorId,
                    isTrap: submissions.isTrap,
                    submittedAt: submissions.submittedAt,
                    createdAt: submissions.createdAt
                })
                .from(submissions)
                .innerJoin(
                    questionnaireGroups,
                    and(
                        eq(submissions.annotatorId, questionnaireGroups.annotatorId),
                        eq(submissions.questionnaireId, questionnaireGroups.questionnaireId)
                    )
                )
                .where(
                    and(
                        eq(questionnaireGroups.status, 'completed'),
                        ...whereConditions
                    )
                )
                .orderBy(desc(submissions.submittedAt));
        } else {
            // Original query without join
            submissionsData = await db
                .select()
                .from(submissions)
                .where(whereConditions.length > 0 ? and(...whereConditions) : undefined)
                .orderBy(desc(submissions.submittedAt));
        }

        const submissionIds = submissionsData.map(s => s.submissionId);

        let evaluationsData: any[] = [];
        if (submissionIds.length > 0) {
            evaluationsData = await db
                .select()
                .from(dimensionEvaluations)
                .where(inArray(dimensionEvaluations.submissionId, submissionIds));
        }

        // Convert results to QuestionnaireResponse array
        const results: QuestionnaireResponse[] = submissionsData.map((submission) => {
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

            const dateStr = format(submission.submittedAt, 'yyyy-MM-dd');
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