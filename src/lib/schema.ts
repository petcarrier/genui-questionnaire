import { sqliteTable, text, integer } from 'drizzle-orm/sqlite-core';

// submissions 表
export const submissions = sqliteTable('submissions', {
    id: integer('id').primaryKey({ autoIncrement: true }),
    submissionId: text('submission_id').notNull().unique(),
    questionId: text('question_id').notNull(),
    linkAUrl: text('link_a_url').notNull(),
    linkBUrl: text('link_b_url').notNull(),
    questionnaireId: text('questionnaire_id').notNull(),
    taskGroupId: text('task_group_id').notNull(),
    overallWinner: text('overall_winner').notNull(),
    captchaResponse: text('captcha_response').notNull(),
    annotatorId: text('annotator_id').notNull(),
    isTrap: integer('is_trap', { mode: 'boolean' }).default(false),
    submittedAt: text('submitted_at').notNull(), // 存储为 ISO 字符串
    createdAt: text('created_at').default('CURRENT_TIMESTAMP')
});

// dimension_evaluations 表
export const dimensionEvaluations = sqliteTable('dimension_evaluations', {
    id: integer('id').primaryKey({ autoIncrement: true }),
    annotatorId: text('annotator_id').notNull(),
    questionId: text('question_id').notNull(),
    submissionId: text('submission_id').notNull(),
    dimensionId: text('dimension_id').notNull(),
    winner: text('winner').notNull(),
    notes: text('notes'),
    createdAt: text('created_at').default('CURRENT_TIMESTAMP')
});

// questionnaire_groups 表 - 存储问卷组信息
export const questionnaireGroups = sqliteTable('questionnaire_groups', {
    id: integer('id').primaryKey({ autoIncrement: true }),
    questionnaireId: text('questionnaire_id').notNull(),
    annotatorId: text('annotator_id').notNull(),
    status: text('status').notNull().default('active'), // active, completed
    currentQuestionIndex: integer('current_question_index').notNull().default(0),
    totalQuestions: integer('total_questions').notNull(),
    createdAt: text('created_at').default('CURRENT_TIMESTAMP'),
    completedAt: text('completed_at')
});

// questionnaire_group_questions 表 - 存储问卷组中的问题
export const questionnaireGroupQuestions = sqliteTable('questionnaire_group_questions', {
    id: integer('id').primaryKey({ autoIncrement: true }),
    annotatorId: text('annotator_id').notNull(),
    questionnaireId: text('questionnaire_id').notNull(),
    questionId: text('question_id').notNull(),
    questionIndex: integer('question_index').notNull(),
    taskGroupId: text('task_group_id').notNull(),
    linkAUrl: text('link_a_url').notNull(),
    linkBUrl: text('link_b_url').notNull(),
    userQuery: text('user_query').notNull(),
    isTrap: integer('is_trap', { mode: 'boolean' }).default(false),
    createdAt: text('created_at').default('CURRENT_TIMESTAMP'),
    completedAt: text('completed_at')
}); 
