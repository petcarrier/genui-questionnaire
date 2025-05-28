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
    annotatorId: text('annotator_id'),
    submittedAt: text('submitted_at').notNull(), // 存储为 ISO 字符串
    createdAt: text('created_at').default('CURRENT_TIMESTAMP')
});

// dimension_evaluations 表
export const dimensionEvaluations = sqliteTable('dimension_evaluations', {
    id: integer('id').primaryKey({ autoIncrement: true }),
    submissionId: text('submission_id').notNull(),
    dimensionId: text('dimension_id').notNull(),
    winner: text('winner').notNull(),
    notes: text('notes'),
    createdAt: text('created_at').default('CURRENT_TIMESTAMP')
}); 
