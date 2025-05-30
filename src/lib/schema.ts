import { pgTable, text, integer, boolean, timestamp, serial } from 'drizzle-orm/pg-core';

export const submissions = pgTable('submissions', {
    id: serial('id').primaryKey(),
    submissionId: text('submission_id').notNull().unique(),
    questionId: text('question_id').notNull(),
    linkAUrl: text('link_a_url').notNull(),
    linkBUrl: text('link_b_url').notNull(),
    questionnaireId: text('questionnaire_id').notNull(),
    taskGroupId: text('task_group_id').notNull(),
    overallWinner: text('overall_winner').notNull(),
    captchaResponse: text('captcha_response').notNull(),
    annotatorId: text('annotator_id').notNull(),
    isTrap: boolean('is_trap').default(false),
    submittedAt: timestamp('submitted_at').notNull(),
    createdAt: timestamp('created_at').defaultNow()
});

export const dimensionEvaluations = pgTable('dimension_evaluations', {
    id: serial('id').primaryKey(),
    annotatorId: text('annotator_id').notNull(),
    questionId: text('question_id').notNull(),
    submissionId: text('submission_id').notNull(),
    dimensionId: text('dimension_id').notNull(),
    winner: text('winner').notNull(),
    notes: text('notes'),
    createdAt: timestamp('created_at').defaultNow()
});

export const questionnaireGroups = pgTable('questionnaire_groups', {
    id: serial('id').primaryKey(),
    questionnaireId: text('questionnaire_id').notNull(),
    annotatorId: text('annotator_id').notNull(),
    status: text('status').notNull().default('active'), // active, completed
    currentQuestionIndex: integer('current_question_index').notNull().default(0),
    totalQuestions: integer('total_questions').notNull(),
    createdAt: timestamp('created_at').defaultNow(),
    completedAt: timestamp('completed_at')
});

export const questionnaireGroupQuestions = pgTable('questionnaire_group_questions', {
    id: serial('id').primaryKey(),
    annotatorId: text('annotator_id').notNull(),
    questionnaireId: text('questionnaire_id').notNull(),
    questionId: text('question_id').notNull(),
    questionIndex: integer('question_index').notNull(),
    taskGroupId: text('task_group_id').notNull(),
    linkAUrl: text('link_a_url').notNull(),
    linkBUrl: text('link_b_url').notNull(),
    linkAVerificationCode: text('link_a_verification_code'),
    linkBVerificationCode: text('link_b_verification_code'),
    userQuery: text('user_query').notNull(),
    isTrap: boolean('is_trap').default(false),
    createdAt: timestamp('created_at').defaultNow(),
    completedAt: timestamp('completed_at')
}); 
