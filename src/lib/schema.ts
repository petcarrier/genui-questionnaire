import { pgTable, text, integer, boolean, timestamp, serial, unique } from 'drizzle-orm/pg-core';

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

// 页面观看记录表
export const pageViews = pgTable('page_views', {
    id: serial('id').primaryKey(),
    submissionId: text('submission_id').notNull(),
    questionId: text('question_id').notNull(),
    annotatorId: text('annotator_id').notNull(),
    questionnaireId: text('questionnaire_id').notNull(),
    linkId: text('link_id').notNull(), // 'A' or 'B'
    linkUrl: text('link_url').notNull(),
    viewType: text('view_type').notNull(), // 'preview' or 'new_tab'

    // 观看状态详细信息
    visited: boolean('visited').notNull().default(false),
    duration: integer('duration').notNull().default(0), // 观看时长，单位：毫秒
    lastVisited: timestamp('last_visited'), // 最后访问时间
    visitCount: integer('visit_count').notNull().default(0), // 访问次数
    startTime: timestamp('start_time'), // 开始观看时间
    isCurrentlyViewing: boolean('is_currently_viewing').default(false), // 是否正在观看

    // 系统记录信息
    sessionStartTime: timestamp('session_start_time'), // 当前会话开始时间
    sessionEndTime: timestamp('session_end_time'), // 当前会话结束时间
    totalViewTime: integer('total_view_time').notNull().default(0), // 总观看时间

    createdAt: timestamp('created_at').defaultNow(),
    updatedAt: timestamp('updated_at').defaultNow()
});

// 草稿保存表 - 用于即时保存功能
export const questionnaireDrafts = pgTable('questionnaire_drafts', {
    id: serial('id').primaryKey(),
    annotatorId: text('annotator_id').notNull(),
    questionId: text('question_id').notNull(),
    questionnaireId: text('questionnaire_id').notNull(),
    taskGroupId: text('task_group_id').notNull(),

    // 评估数据 (JSON格式存储)
    dimensionEvaluations: text('dimension_evaluations'), // JSON string
    overallWinner: text('overall_winner'), // 'A' | 'B' | 'tie' | null

    // 页面访问状态 (JSON格式存储)
    pageVisitStatus: text('page_visit_status'), // JSON string
    verificationCodeStatus: text('verification_code_status'), // JSON string

    // 元数据
    lastSavedAt: timestamp('last_saved_at').defaultNow(),
    createdAt: timestamp('created_at').defaultNow(),
}); 
