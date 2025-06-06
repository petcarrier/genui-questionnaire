import { QuestionnaireQuestion, EVALUATION_DIMENSIONS } from '@/types/questionnaire';
import { questionnaireGroups, questionnaireGroupQuestions } from './schema';
import { eq, desc, and, gte, lte } from 'drizzle-orm';
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

// 获取所有用户的问卷组统计信息（用于管理员面板）
export async function getAllUsersQuestionnaireStats(
    startDate?: Date,
    endDate?: Date
): Promise<{
    annotatorId: string;
    totalQuestionnaires: number;
    completedQuestionnaires: number;
    activeQuestionnaires: number;
    avgCompletionRate: number;
    firstCreated: Date;
    lastActivity: Date;
    totalQuestions: number;
    currentProgress: number;
}[]> {
    try {
        const whereConditions = [];

        if (startDate) {
            whereConditions.push(gte(questionnaireGroups.createdAt, startDate));
        }

        if (endDate) {
            whereConditions.push(lte(questionnaireGroups.createdAt, endDate));
        }

        // 获取所有问卷组数据
        const allGroups = await db
            .select()
            .from(questionnaireGroups)
            .where(whereConditions.length > 0 ? and(...whereConditions) : undefined)
            .orderBy(questionnaireGroups.createdAt);

        // 按用户分组统计
        const userStats = new Map<string, {
            annotatorId: string;
            totalQuestionnaires: number;
            completedQuestionnaires: number;
            activeQuestionnaires: number;
            totalQuestions: number;
            completedQuestions: number;
            firstCreated: Date;
            lastActivity: Date;
        }>();

        for (const group of allGroups) {
            const userId = group.annotatorId;

            if (!userStats.has(userId)) {
                userStats.set(userId, {
                    annotatorId: userId,
                    totalQuestionnaires: 0,
                    completedQuestionnaires: 0,
                    activeQuestionnaires: 0,
                    totalQuestions: 0,
                    completedQuestions: 0,
                    firstCreated: group.createdAt || new Date(),
                    lastActivity: group.createdAt || new Date()
                });
            }

            const stats = userStats.get(userId)!;
            stats.totalQuestionnaires++;
            stats.totalQuestions += group.totalQuestions;

            if (group.status === 'completed') {
                stats.completedQuestionnaires++;
                stats.completedQuestions += group.totalQuestions;
            } else {
                stats.activeQuestionnaires++;
                stats.completedQuestions += group.currentQuestionIndex;
            }

            // 更新活动时间
            const activityTime = group.completedAt || group.createdAt || new Date();
            if (activityTime > stats.lastActivity) {
                stats.lastActivity = activityTime;
            }
            if (group.createdAt && group.createdAt < stats.firstCreated) {
                stats.firstCreated = group.createdAt;
            }
        }

        // 转换为返回格式
        return Array.from(userStats.values()).map(stats => ({
            annotatorId: stats.annotatorId,
            totalQuestionnaires: stats.totalQuestionnaires,
            completedQuestionnaires: stats.completedQuestionnaires,
            activeQuestionnaires: stats.activeQuestionnaires,
            avgCompletionRate: stats.totalQuestions > 0 ?
                (stats.completedQuestions / stats.totalQuestions) * 100 : 0,
            firstCreated: stats.firstCreated,
            lastActivity: stats.lastActivity,
            totalQuestions: stats.totalQuestions,
            currentProgress: stats.completedQuestions
        }));
    } catch (error) {
        console.error('Error getting all users questionnaire stats:', error);
        throw error;
    }
}

// 获取用户问卷详细列表（支持分页）
export async function getUserQuestionnaireDetails(
    annotatorId?: string,
    startDate?: Date,
    endDate?: Date,
    page: number = 1,
    limit: number = 10
): Promise<{
    questionnaires: {
        annotatorId: string;
        questionnaireId: string;
        status: string;
        currentQuestionIndex: number;
        totalQuestions: number;
        completionRate: number;
        createdAt: Date;
        completedAt?: Date;
        lastActivity: Date;
        questions: {
            questionId: string;
            questionIndex: number;
            userQuery: string;
            linkAUrl: string;
            linkBUrl: string;
            taskGroupId: string;
            isTrap: boolean;
            completedAt?: Date;
        }[];
    }[];
    total: number;
    totalPages: number;
    currentPage: number;
}> {
    try {
        const whereConditions = [];

        if (annotatorId) {
            whereConditions.push(eq(questionnaireGroups.annotatorId, annotatorId));
        }

        if (startDate) {
            whereConditions.push(gte(questionnaireGroups.createdAt, startDate));
        }

        if (endDate) {
            whereConditions.push(lte(questionnaireGroups.createdAt, endDate));
        }

        // 获取总数
        const totalCountResult = await db
            .select()
            .from(questionnaireGroups)
            .where(whereConditions.length > 0 ? and(...whereConditions) : undefined);

        const total = totalCountResult.length;
        const totalPages = Math.ceil(total / limit);
        const offset = (page - 1) * limit;

        // 获取分页数据（按最后活动时间倒序）
        const groups = await db
            .select()
            .from(questionnaireGroups)
            .where(whereConditions.length > 0 ? and(...whereConditions) : undefined)
            .orderBy(desc(questionnaireGroups.createdAt))
            .limit(limit)
            .offset(offset);

        // 为每个问卷组获取详细的问题信息
        const questionnaires = await Promise.all(
            groups.map(async (group) => {
                const questions = await db
                    .select()
                    .from(questionnaireGroupQuestions)
                    .where(and(
                        eq(questionnaireGroupQuestions.annotatorId, group.annotatorId),
                        eq(questionnaireGroupQuestions.questionnaireId, group.questionnaireId)
                    ))
                    .orderBy(questionnaireGroupQuestions.questionIndex);

                const completionRate = group.totalQuestions > 0
                    ? (group.currentQuestionIndex / group.totalQuestions) * 100
                    : 0;

                const lastActivity = group.completedAt || group.createdAt || new Date();

                return {
                    annotatorId: group.annotatorId,
                    questionnaireId: group.questionnaireId,
                    status: group.status,
                    currentQuestionIndex: group.currentQuestionIndex,
                    totalQuestions: group.totalQuestions,
                    completionRate,
                    createdAt: group.createdAt || new Date(),
                    completedAt: group.completedAt || undefined,
                    lastActivity,
                    questions: questions.map(q => ({
                        questionId: q.questionId,
                        questionIndex: q.questionIndex,
                        userQuery: q.userQuery,
                        linkAUrl: q.linkAUrl,
                        linkBUrl: q.linkBUrl,
                        taskGroupId: q.taskGroupId,
                        isTrap: q.isTrap || false,
                        completedAt: q.completedAt || undefined
                    }))
                };
            })
        );

        return {
            questionnaires,
            total,
            totalPages,
            currentPage: page
        };
    } catch (error) {
        console.error('Error getting user questionnaire details:', error);
        throw error;
    }
} 