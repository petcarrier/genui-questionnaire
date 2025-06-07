import { db } from '@/db';
import { submissions, dimensionEvaluations, questionnaireGroups } from '@/db/schema';
import { eq, and, gte, lte } from 'drizzle-orm';
import type {
    QuestionnaireUserSelectionsAnalytics,
    QuestionnaireSelectionData,
    QuestionSelectionData,
    QuestionnaireUserSelectionResponse,
    QuestionnaireUserSelectionsFilters
} from '@/types/admin';

/**
 * 获取问卷用户选择分析数据
 */
export async function getQuestionnaireUserSelectionsData(
    filters: QuestionnaireUserSelectionsFilters
): Promise<QuestionnaireUserSelectionsAnalytics> {
    try {
        // Build query conditions
        const conditions = [];

        if (filters.excludeTraps) {
            conditions.push(eq(submissions.isTrap, false));
        }

        if (filters.startDate) {
            conditions.push(gte(submissions.submittedAt, new Date(filters.startDate)));
        }

        if (filters.endDate) {
            conditions.push(lte(submissions.submittedAt, new Date(filters.endDate)));
        }

        // Build the query - conditionally add JOIN based on excludeIncomplete filter
        let questionnairesQuery;

        if (filters.excludeIncomplete) {
            // JOIN with questionnaireGroups to filter by completion status
            questionnairesQuery = await db
                .select({
                    questionnaireId: submissions.questionnaireId,
                    questionId: submissions.questionId,
                    annotatorId: submissions.annotatorId,
                    overallWinner: submissions.overallWinner,
                    submittedAt: submissions.submittedAt
                })
                .from(submissions)
                .innerJoin(
                    questionnaireGroups,
                    and(
                        eq(submissions.questionnaireId, questionnaireGroups.questionnaireId),
                        eq(submissions.annotatorId, questionnaireGroups.annotatorId)
                    )
                )
                .where(
                    and(
                        eq(questionnaireGroups.status, 'completed'),
                        ...(conditions.length > 0 ? conditions : [])
                    )
                )
                .orderBy(submissions.questionnaireId, submissions.questionId, submissions.submittedAt);
        } else {
            // Query without completion status filter
            questionnairesQuery = await db
                .select({
                    questionnaireId: submissions.questionnaireId,
                    questionId: submissions.questionId,
                    annotatorId: submissions.annotatorId,
                    overallWinner: submissions.overallWinner,
                    submittedAt: submissions.submittedAt
                })
                .from(submissions)
                .where(conditions.length > 0 ? and(...conditions) : undefined)
                .orderBy(submissions.questionnaireId, submissions.questionId, submissions.submittedAt);
        }

        // Group data by questionnaire
        const questionnaireMap = new Map<string, {
            questionnaireId: string;
            questions: Map<string, {
                questionId: string;
                responses: QuestionnaireUserSelectionResponse[];
                distribution: { A: number; B: number; tie: number; total: number };
                consistency: number;
                userList: { A: string[]; B: string[]; tie: string[] };
            }>;
            totalQuestions: number;
            totalResponses: number;
            avgConsistency: number;
        }>();

        for (const submission of questionnairesQuery) {
            const { questionnaireId, questionId, annotatorId, overallWinner } = submission;

            if (!questionnaireMap.has(questionnaireId)) {
                questionnaireMap.set(questionnaireId, {
                    questionnaireId,
                    questions: new Map(),
                    totalQuestions: 0,
                    totalResponses: 0,
                    avgConsistency: 0
                });
            }

            const questionnaire = questionnaireMap.get(questionnaireId)!;

            if (!questionnaire.questions.has(questionId)) {
                questionnaire.questions.set(questionId, {
                    questionId,
                    responses: [],
                    distribution: { A: 0, B: 0, tie: 0, total: 0 },
                    consistency: 0,
                    userList: { A: [], B: [], tie: [] }
                });
            }

            const question = questionnaire.questions.get(questionId)!;
            question.responses.push({
                questionId,
                annotatorId,
                overallWinner: overallWinner as 'A' | 'B' | 'tie',
                dimensionChoices: {} // We can add dimension-specific choices later if needed
            });

            // Update distribution and user lists
            if (overallWinner === 'A') {
                question.distribution.A++;
                question.userList.A.push(annotatorId);
            } else if (overallWinner === 'B') {
                question.distribution.B++;
                question.userList.B.push(annotatorId);
            } else if (overallWinner === 'tie') {
                question.distribution.tie++;
                question.userList.tie.push(annotatorId);
            }

            question.distribution.total++;
        }

        // Calculate consistency scores and final statistics
        const questionnaires: QuestionnaireSelectionData[] = Array.from(questionnaireMap.values()).map(questionnaire => {
            const questions = Array.from(questionnaire.questions.values());

            // Calculate consistency for each question
            questions.forEach(question => {
                const { A, B, tie, total } = question.distribution;
                const maxChoice = Math.max(A, B, tie);
                question.consistency = total > 0 ? maxChoice / total : 0;
            });

            // Convert questions map to object
            const questionsObj: { [key: string]: QuestionSelectionData } = {};
            questions.forEach(question => {
                questionsObj[question.questionId] = question;
            });

            // Calculate overall statistics
            const totalQuestions = questions.length;
            const totalResponses = questions.reduce((sum, q) => sum + q.responses.length, 0);
            const avgConsistency = questions.length > 0
                ? questions.reduce((sum, q) => sum + q.consistency, 0) / questions.length
                : 0;

            return {
                questionnaireId: questionnaire.questionnaireId,
                questions: questionsObj,
                totalQuestions,
                totalResponses,
                avgConsistency
            };
        });

        // Sort by questionnaire ID
        questionnaires.sort((a, b) => a.questionnaireId.localeCompare(b.questionnaireId));

        // Calculate overall statistics
        const totalQuestionnaires = questionnaires.length;
        const totalQuestions = questionnaires.reduce((sum, q) => sum + q.totalQuestions, 0);
        const totalResponses = questionnaires.reduce((sum, q) => sum + q.totalResponses, 0);
        const overallAvgConsistency = questionnaires.length > 0
            ? questionnaires.reduce((sum, q) => sum + q.avgConsistency, 0) / questionnaires.length
            : 0;

        return {
            questionnaires,
            totalQuestionnaires,
            totalQuestions,
            totalResponses,
            overallAvgConsistency
        };

    } catch (error) {
        console.error('Error fetching questionnaire user selections data:', error);
        throw new Error('Failed to fetch questionnaire user selections data');
    }
} 