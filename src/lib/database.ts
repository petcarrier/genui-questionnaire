import { drizzle } from 'drizzle-orm/libsql';
import { createClient } from '@libsql/client';
import { QuestionnaireResponse, DimensionEvaluation, QuestionnaireQuestion, EVALUATION_DIMENSIONS } from '@/types/questionnaire';
import { submissions, dimensionEvaluations, questionnaireGroups, questionnaireGroupQuestions } from './schema';
import { eq, desc, sql, inArray, and } from 'drizzle-orm';
import path from 'path';
import fs from 'fs';
import { format } from 'date-fns';

// Database file path
const DB_PATH = process.env.DATABASE_URL!;

// Ensure database directory exists
const dataDir = path.dirname(DB_PATH);
if (!fs.existsSync(dataDir)) {
    fs.mkdirSync(dataDir, { recursive: true });
}

// Create libSQL client for local file
const client = createClient({
    url: `file:${DB_PATH}`
});

// Create Drizzle database connection
const db = drizzle({ client });

console.log('Database connected successfully:', DB_PATH);

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
                createdAt: format(new Date(), 'yyyy-MM-dd HH:mm:ss'),
                submittedAt: format(response.submittedAt, 'yyyy-MM-dd HH:mm:ss')
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
                        createdAt: format(new Date(), 'yyyy-MM-dd HH:mm:ss')
                    }))
                );
            }
        });

        console.log('Questionnaire response saved successfully');
    } catch (error) {
        console.error('Error saving questionnaire response:', error);
        throw error;
    }
}

// Get all submission records
export async function getStoredSubmissions(): Promise<QuestionnaireResponse[]> {
    try {
        // Query all submission records and corresponding dimension evaluations
        const submissionsData = await db
            .select()
            .from(submissions)
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
        const result: QuestionnaireResponse[] = submissionsData.map((submission) => {
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
                    dimensionId: evaluation.dimensionId,
                    winner: evaluation.winner as "A" | "B" | "tie",
                    notes: evaluation.notes || undefined
                }))
            };
        });

        return result;
    } catch (error) {
        console.error('Error getting stored submissions:', error);
        throw error;
    }
}

// Get submission statistics
export async function getSubmissionStats(): Promise<{
    totalSubmissions: number;
    submissionsByQuestion: { [questionId: string]: number };
    submissionsByDate: { [date: string]: number };
}> {
    try {
        const stats = await db
            .select({
                questionId: submissions.questionId,
                submissionDate: sql<string>`DATE(${submissions.submittedAt})`.as('submission_date'),
                count: sql<number>`COUNT(*)`.as('count')
            })
            .from(submissions)
            .groupBy(submissions.questionId, sql`DATE(${submissions.submittedAt})`)
            .orderBy(desc(sql`DATE(${submissions.submittedAt})`));

        const submissionsByQuestion: { [questionId: string]: number } = {};
        const submissionsByDate: { [date: string]: number } = {};
        let totalSubmissions = 0;

        stats.forEach((row) => {
            totalSubmissions += row.count;
            submissionsByQuestion[row.questionId] = (submissionsByQuestion[row.questionId] || 0) + row.count;
            submissionsByDate[row.submissionDate] = (submissionsByDate[row.submissionDate] || 0) + row.count;
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

// 创建问卷组
export async function createQuestionnaireGroup(
    questionnaireId: string,
    questions: QuestionnaireQuestion[],
    annotatorId: string
): Promise<void> {
    try {
        // 检查是否已经存在相同的问卷组
        const existingGroup = await db
            .select()
            .from(questionnaireGroups)
            .where(and(
                eq(questionnaireGroups.questionnaireId, questionnaireId),
                eq(questionnaireGroups.annotatorId, annotatorId)
            ))
            .limit(1);

        if (existingGroup.length > 0) {
            console.log('Questionnaire group already exists:', questionnaireId, annotatorId);
            return;
        }

        await db.transaction(async (tx) => {
            // 插入问卷组记录
            await tx.insert(questionnaireGroups).values({
                questionnaireId,
                annotatorId,
                status: 'active',
                currentQuestionIndex: 0,
                totalQuestions: questions.length,
                createdAt: format(new Date(), 'yyyy-MM-dd HH:mm:ss')
            });

            // 插入问卷组问题记录
            const questionRecords = questions.map((question, index) => ({
                questionnaireId,
                annotatorId,
                questionId: question.id,
                questionIndex: index,
                taskGroupId: question.taskGroupId,
                linkAUrl: question.linkA.url,
                linkBUrl: question.linkB.url,
                userQuery: question.userQuery,
                isTrap: question.isTrap || false,
                createdAt: format(new Date(), 'yyyy-MM-dd HH:mm:ss')
            }));

            await tx.insert(questionnaireGroupQuestions).values(questionRecords);
        });

        console.log('Questionnaire group created successfully:', questionnaireId);
    } catch (error) {
        console.error('Error creating questionnaire group:', error);
        throw error;
    }
}

// 根据annotatorId获取问卷组信息
export async function getQuestionnaireGroupByAnnotatorId(annotatorId: string, questionnaireId: string): Promise<{
    questionnaireId: string;
    annotatorId: string;
    questions: QuestionnaireQuestion[];
    status: string;
    currentQuestionIndex: number;
    totalQuestions: number;
    createdAt: string;
    completedAt?: string;
} | null> {
    try {
        // 获取问卷组基本信息
        const groupData = await db
            .select()
            .from(questionnaireGroups)
            .where(and(eq(questionnaireGroups.annotatorId, annotatorId),
                eq(questionnaireGroups.questionnaireId, questionnaireId)))
            .orderBy(desc(questionnaireGroups.createdAt))
            .limit(1);

        if (groupData.length === 0) {
            return null;
        }

        const group = groupData[0];

        // 获取问卷组问题
        const questionsData = await db
            .select()
            .from(questionnaireGroupQuestions)
            .where(and(eq(questionnaireGroupQuestions.annotatorId, annotatorId),
                eq(questionnaireGroupQuestions.questionnaireId, questionnaireId)))
            .orderBy(questionnaireGroupQuestions.questionIndex);

        // 转换为QuestionnaireQuestion格式
        const questions: QuestionnaireQuestion[] = questionsData.map(q => ({
            id: q.questionId,
            taskGroupId: q.taskGroupId,
            linkA: {
                id: 'A',
                url: q.linkAUrl,
                title: 'Example A',
                description: 'Open the link in browser. See UI and copy verification code'
            },
            linkB: {
                id: 'B',
                url: q.linkBUrl,
                title: 'Example B',
                description: 'Open the link in browser. See UI and copy verification code'
            },
            dimensions: EVALUATION_DIMENSIONS,
            userQuery: q.userQuery,
            isTrap: q.isTrap || false
        }));

        return {
            questionnaireId: group.questionnaireId,
            annotatorId: group.annotatorId,
            questions,
            status: group.status,
            currentQuestionIndex: group.currentQuestionIndex,
            totalQuestions: group.totalQuestions,
            createdAt: group.createdAt || format(new Date(), 'yyyy-MM-dd HH:mm:ss'),
            completedAt: group.completedAt || undefined
        };
    } catch (error) {
        console.error('Error getting questionnaire group by annotator ID:', error);
        throw error;
    }
}

// 根据annotatorId更新问卷组进度
export async function updateQuestionnaireGroupProgressByAnnotatorId(
    annotatorId: string,
    currentQuestionIndex: number,
    questionId: string,
    questionnaireId: string
): Promise<void> {
    try {
        await db.transaction(async (tx) => {
            // 更新问卷组进度
            await tx
                .update(questionnaireGroups)
                .set({ currentQuestionIndex })
                .where(and(eq(questionnaireGroups.annotatorId, annotatorId),
                    eq(questionnaireGroups.questionnaireId, questionnaireId)));

            // 更新对应问题明细的完成时间
            if (currentQuestionIndex > 0) {
                await tx
                    .update(questionnaireGroupQuestions)
                    .set({ completedAt: format(new Date(), 'yyyy-MM-dd HH:mm:ss') })
                    .where(
                        and(
                            eq(questionnaireGroupQuestions.annotatorId, annotatorId),
                            eq(questionnaireGroupQuestions.questionId, questionId),
                            eq(questionnaireGroupQuestions.questionnaireId, questionnaireId)
                        )
                    );
            }
        });

        console.log('Questionnaire group progress updated by annotator ID:', annotatorId, currentQuestionIndex);
    } catch (error) {
        console.error('Error updating questionnaire group progress by annotator ID:', error);
        throw error;
    }
}

// 根据annotatorId完成问卷组
export async function completeQuestionnaireGroupByAnnotatorId(annotatorId: string, questionnaireId: string): Promise<void> {
    try {
        await db
            .update(questionnaireGroups)
            .set({
                status: 'completed',
                completedAt: format(new Date(), 'yyyy-MM-dd HH:mm:ss')
            })
            .where(and(eq(questionnaireGroups.annotatorId, annotatorId),
                eq(questionnaireGroups.questionnaireId, questionnaireId)));

        console.log('Questionnaire group completed by annotator ID:', annotatorId);
    } catch (error) {
        console.error('Error completing questionnaire group by annotator ID:', error);
        throw error;
    }
}

export { db }; 