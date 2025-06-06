import { questionnaireDrafts } from './schema';
import { eq, and } from 'drizzle-orm';
import { db } from './index';
import { DimensionEvaluation, PageVisitStatus, VerificationCodeStatus } from '@/types/questionnaire';

export interface QuestionnaireDraft {
    annotatorId: string;
    questionId: string;
    questionnaireId: string;
    taskGroupId: string;
    dimensionEvaluations?: DimensionEvaluation[];
    overallWinner?: 'A' | 'B' | 'tie';
    pageVisitStatus?: PageVisitStatus;
    verificationCodeStatus?: VerificationCodeStatus;
}

// 保存草稿
export async function saveDraft(draft: QuestionnaireDraft): Promise<void> {
    try {
        const existingDraft = await db
            .select()
            .from(questionnaireDrafts)
            .where(
                and(
                    eq(questionnaireDrafts.annotatorId, draft.annotatorId),
                    eq(questionnaireDrafts.questionId, draft.questionId),
                    eq(questionnaireDrafts.questionnaireId, draft.questionnaireId)
                )
            )
            .limit(1);

        const draftData = {
            annotatorId: draft.annotatorId,
            questionId: draft.questionId,
            questionnaireId: draft.questionnaireId,
            taskGroupId: draft.taskGroupId,
            dimensionEvaluations: draft.dimensionEvaluations ? JSON.stringify(draft.dimensionEvaluations) : null,
            overallWinner: draft.overallWinner || null,
            pageVisitStatus: draft.pageVisitStatus ? JSON.stringify(draft.pageVisitStatus) : null,
            verificationCodeStatus: draft.verificationCodeStatus ? JSON.stringify(draft.verificationCodeStatus) : null,
            lastSavedAt: new Date()
        };

        if (existingDraft.length > 0) {
            // 更新现有草稿
            await db
                .update(questionnaireDrafts)
                .set(draftData)
                .where(eq(questionnaireDrafts.id, existingDraft[0].id));
        } else {
            // 创建新草稿
            await db.insert(questionnaireDrafts).values({
                ...draftData,
                createdAt: new Date()
            });
        }

        console.log('Draft saved successfully');
    } catch (error) {
        console.error('Error saving draft:', error);
        throw error;
    }
}

// 获取草稿
export async function getDraft(
    annotatorId: string,
    questionId: string,
    questionnaireId: string
): Promise<QuestionnaireDraft | null> {
    try {
        const result = await db
            .select()
            .from(questionnaireDrafts)
            .where(
                and(
                    eq(questionnaireDrafts.annotatorId, annotatorId),
                    eq(questionnaireDrafts.questionId, questionId),
                    eq(questionnaireDrafts.questionnaireId, questionnaireId)
                )
            )
            .limit(1);

        if (result.length === 0) {
            return null;
        }

        const draft = result[0];
        return {
            annotatorId: draft.annotatorId,
            questionId: draft.questionId,
            questionnaireId: draft.questionnaireId,
            taskGroupId: draft.taskGroupId,
            dimensionEvaluations: draft.dimensionEvaluations ? JSON.parse(draft.dimensionEvaluations) : undefined,
            overallWinner: draft.overallWinner as 'A' | 'B' | 'tie' | undefined,
            pageVisitStatus: draft.pageVisitStatus ? JSON.parse(draft.pageVisitStatus) : undefined,
            verificationCodeStatus: draft.verificationCodeStatus ? JSON.parse(draft.verificationCodeStatus) : undefined
        };
    } catch (error) {
        console.error('Error getting draft:', error);
        throw error;
    }
}

// 删除草稿（提交后调用）
export async function deleteDraft(
    annotatorId: string,
    questionId: string,
    questionnaireId: string
): Promise<void> {
    try {
        await db
            .delete(questionnaireDrafts)
            .where(
                and(
                    eq(questionnaireDrafts.annotatorId, annotatorId),
                    eq(questionnaireDrafts.questionId, questionId),
                    eq(questionnaireDrafts.questionnaireId, questionnaireId)
                )
            );

        console.log('Draft deleted successfully');
    } catch (error) {
        console.error('Error deleting draft:', error);
        throw error;
    }
}

// 清理旧草稿（可选：清理超过一定时间的草稿）
export async function cleanupOldDrafts(daysOld: number = 7): Promise<void> {
    try {
        const cutoffDate = new Date();
        cutoffDate.setDate(cutoffDate.getDate() - daysOld);

        await db
            .delete(questionnaireDrafts)
            .where(
                // 使用sql函数进行日期比较
                // 这里假设lastSavedAt字段存在
                eq(questionnaireDrafts.lastSavedAt, cutoffDate)
            );

        console.log('Old drafts cleaned up successfully');
    } catch (error) {
        console.error('Error cleaning up old drafts:', error);
        throw error;
    }
} 