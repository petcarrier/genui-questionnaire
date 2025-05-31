import { QuestionnaireQuestion, EVALUATION_DIMENSIONS } from '@/types/questionnaire';
import { questionnaireGroups, questionnaireGroupQuestions } from '../schema';
import { eq, desc, and } from 'drizzle-orm';
import { db } from './index';
import { getScreenshotByUrl } from '@/data/questionnaireData';

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
                createdAt: new Date()
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
                linkAVerificationCode: question.linkA.verificationCode || null,
                linkBVerificationCode: question.linkB.verificationCode || null,
                userQuery: question.userQuery,
                isTrap: question.isTrap || false,
                createdAt: new Date()
            }));

            await tx.insert(questionnaireGroupQuestions).values(questionRecords);
        });

        console.log('Questionnaire group created successfully:', questionnaireId);
    } catch (error) {
        console.error('Error creating questionnaire group:', error);
        throw error;
    }
}

export async function getQuestionnaireGroupByAnnotatorId(annotatorId: string, questionnaireId: string): Promise<{
    questionnaireId: string;
    annotatorId: string;
    questions: QuestionnaireQuestion[];
    status: string;
    currentQuestionIndex: number;
    totalQuestions: number;
    createdAt: Date;
    completedAt?: Date;
} | null> {
    try {
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
                description: 'Please open or preview the page to view its content. Click either the "Preview" button or the "Open in New Tab" button. The system will record how long you spend viewing.',
                verificationCode: q.linkAVerificationCode || undefined,
                screenshotUrl: getScreenshotByUrl(q.linkAUrl)
            },
            linkB: {
                id: 'B',
                url: q.linkBUrl,
                title: 'Example B',
                description: 'Please open or preview the page to view its content. Click either the "Preview" button or the "Open in New Tab" button. The system will record how long you spend viewing.',
                verificationCode: q.linkBVerificationCode || undefined,
                screenshotUrl: getScreenshotByUrl(q.linkBUrl)
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
            createdAt: group.createdAt || new Date(),
            completedAt: group.completedAt || undefined
        };
    } catch (error) {
        console.error('Error getting questionnaire group by annotator ID:', error);
        throw error;
    }
}

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
                    .set({ completedAt: new Date() })
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

export async function completeQuestionnaireGroupByAnnotatorId(annotatorId: string, questionnaireId: string): Promise<void> {
    try {
        await db
            .update(questionnaireGroups)
            .set({
                status: 'completed',
                completedAt: new Date()
            })
            .where(and(eq(questionnaireGroups.annotatorId, annotatorId),
                eq(questionnaireGroups.questionnaireId, questionnaireId)));

        console.log('Questionnaire group completed by annotator ID:', annotatorId);
    } catch (error) {
        console.error('Error completing questionnaire group by annotator ID:', error);
        throw error;
    }
} 