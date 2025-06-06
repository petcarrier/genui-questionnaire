import { QuestionnaireResponse } from './questionnaire';

// Dashboard Types
export interface DashboardSummary {
    totalSubmissions: number;
    totalQuestions: number;
    pageViewCompletionRate: number; // 页面访问完成率（两个链接都访问的比率）
    linkAccessBalance: number; // 链接访问平衡度（A和B访问率的差异）
    mostActiveDay: string;
    recentSubmissions: number; // 最近7天的提交数
}

// Dimension Analysis Types
export interface DimensionWinnerStats {
    A: number;
    B: number;
    tie: number;
    empty: number; // 未选择的情况
}

export interface DimensionAnalysis {
    dimensionId: string;
    dimensionLabel: string;
    totalEvaluations: number;
    winnerStats: DimensionWinnerStats;
    winnerPercentages: {
        A: number;
        B: number;
        tie: number;
        empty: number;
    };
    averageResponseTime?: number;
    notes: {
        totalWithNotes: number;
        averageNoteLength: number;
        commonKeywords?: string[];
    };
}

// Kappa Types - Simplified and Safer
export type KappaInterpretation = 'poor' | 'slight' | 'fair' | 'moderate' | 'substantial' | 'almost_perfect';

export interface QuestionKappaScore {
    questionId: string;
    kappa: number;
    raters: number;
    categories: {
        A: number;
        B: number;
        tie: number;
    };
}

export interface DimensionComparisonData {
    dimensionId: string;
    dimensionLabel: string;
    preferenceStrength: number; // A和B选择差异的绝对值
    fleissKappa: number; // Fleiss' kappa consistency score
    avgKappaPerQuestion: number; // Average kappa across all questions for this dimension
    kappaInterpretation: KappaInterpretation; // Kappa interpretation
    questionKappaScores: QuestionKappaScore[]; // Individual question kappa scores
}

// Safe version for component props with defaults
export interface SafeDimensionComparisonData {
    dimensionId: string;
    dimensionLabel: string;
    preferenceStrength: number;
    fleissKappa: number;
    avgKappaPerQuestion: number;
    kappaInterpretation: KappaInterpretation;
    questionKappaScores: QuestionKappaScore[];
}

export interface DimensionsAnalyticsData {
    overview: {
        totalDimensions: number;
        totalEvaluations: number;
        averageEvaluationsPerDimension: number;
        mostContentiousDimension: string;
        mostDecisiveDimension: string;
    };
    dimensionAnalyses: DimensionAnalysis[];
    dimensionComparisons: DimensionComparisonData[];
    trends: {
        dimensionPopularity: { [dimensionId: string]: number[] }; // 按时间的趋势
        winnerTrends: { [dimensionId: string]: { date: string; A: number; B: number; tie: number; }[] };
    };
    correlations?: {
        [dimensionId: string]: { [otherDimensionId: string]: number }; // 维度间相关性
    };
}

// Safe version with guaranteed arrays
export interface SafeDimensionsAnalyticsData {
    overview: {
        totalDimensions: number;
        totalEvaluations: number;
        averageEvaluationsPerDimension: number;
        mostContentiousDimension: string;
        mostDecisiveDimension: string;
    };
    dimensionAnalyses: DimensionAnalysis[];
    dimensionComparisons: SafeDimensionComparisonData[];
    trends: {
        dimensionPopularity: Record<string, number[]>;
        winnerTrends: Record<string, Array<{ date: string; A: number; B: number; tie: number; }>>;
    };
    correlations: Record<string, Record<string, number>>;
}

export interface SubmissionStats {
    totalSubmissions: number;
    submissionsByQuestion: { [questionId: string]: number };
    submissionsByDate: { [date: string]: number };
    submissionsByHour: { [hour: string]: number };
    submissionsByWeekday: { [weekday: string]: number };
}

export interface PageViewStats {
    totalViews: number;
    viewsByLink: { [linkId: string]: number };
    averageDuration: number;
    totalDuration: number;
    averageVisitCount: number;
    totalVisitCount: number;
    uniqueSubmissions: number;
    completedSubmissions: number;
    averageViewsPerSubmission: number;
    linkAViewRate: number;
    linkBViewRate: number;
}

export interface UserEngagement {
    completionRate: number;
    averageTimeSpent: number;
    bounceRate: number;
}

export interface TopQuestion {
    questionId: string;
    count: number;
}

export interface RecentActivity {
    recentSubmissions: QuestionnaireResponse[];
    topQuestions: TopQuestion[];
    userEngagement: UserEngagement;
}

export interface DashboardData {
    summary: DashboardSummary;
    submissions: SubmissionStats;
    pageViews: PageViewStats;
    recentActivity: RecentActivity;
}

// Export Types
export interface ExportMetadata {
    exportDate: string;
    totalSubmissions: number;
    submissionsByQuestion: { [questionId: string]: number };
    submissionsByDate: { [date: string]: number };
    submissionsByHour: { [hour: string]: number };
    submissionsByWeekday: { [weekday: string]: number };
    pageViewStats: PageViewStats;
}

// Pagination Types
export interface PaginationParams {
    page: number;
    limit: number;
    sortBy?: 'submittedAt' | 'questionId' | 'annotatorId';
    sortOrder?: 'asc' | 'desc';
    search?: string;
}

export interface PaginatedSubmissionsData {
    submissions: QuestionnaireResponse[];
    total: number;
    totalPages: number;
    currentPage: number;
    hasNextPage: boolean;
    hasPrevPage: boolean;
}

export interface ExportData {
    metadata: ExportMetadata;
    submissions: QuestionnaireResponse[];
}

export type ExportFormat = 'json' | 'csv';

// Analytics Types
export interface ResponseTimeMetrics {
    average: number;
    median: number;
    percentile95: number;
}

export interface CompletionRates {
    overall: number;
    byQuestion: { [questionId: string]: number };
}

export interface UserBehaviorMetrics {
    returnUsers: number;
    averageSessionsPerUser: number;
    bounceRate: number;
}

export interface PerformanceMetrics {
    responseTime: ResponseTimeMetrics;
    completionRates: CompletionRates;
    userBehavior: UserBehaviorMetrics;
}

export interface TrendData {
    date: string;
    count: number;
    change: number;
}

export interface WeeklyTrendData {
    week: string;
    count: number;
    change: number;
}

export interface MonthlyTrendData {
    month: string;
    count: number;
    change: number;
}

export interface SubmissionTrends {
    daily: TrendData[];
    weekly: WeeklyTrendData[];
    monthly: MonthlyTrendData[];
}

export interface PopularQuestion {
    questionId: string;
    submissions: number;
    growthRate: number;
}

export interface PeakHour {
    hour: number;
    submissions: number;
    percentage: number;
}

export interface TrendsData {
    submissionTrends: SubmissionTrends;
    popularQuestions: PopularQuestion[];
    peakHours: PeakHour[];
}

export interface QualityMetrics {
    dataCompleteness: number;
    consistencyScore: number;
    averageTimePerDimension: number;
    dimensionCompletionRates: { [dimensionId: string]: number };
}

export interface AnalyticsData {
    performance: PerformanceMetrics;
    trends: TrendsData;
    quality: QualityMetrics;
}

// User Management Types
export interface UserData {
    userId: string;
    submissionCount: number;
    firstSubmission: string;
    lastSubmission: string;
    avgResponseTime: number;
    questionsAnswered: string[];
    consistency: number;
    completionRate: number;
    // 问卷相关统计
    totalQuestionnaires: number;
    completedQuestionnaires: number;
    activeQuestionnaires: number;
    questionnaireCompletionRate: number;
    totalQuestions: number;
    currentProgress: number;
    firstQuestionnaireCreated: string;
    lastQuestionnaireActivity: string;
}

export interface UserSummary {
    totalUsers: number;
    activeUsers: number; // 最近7天活跃
    averageSubmissionsPerUser: number;
    topContributors: UserData[];
}

export interface UsersResponse {
    users: UserData[];
    summary: UserSummary;
}

export type UserSortBy = 'submissions' | 'lastActivity' | 'consistency' | 'completionRate' | 'responseTime';
export type SortOrder = 'asc' | 'desc';
export type TimeRange = '7d' | '30d' | '90d' | 'custom';

// Filter Options
export interface AdminFilterOptions {
    timeRange: TimeRange;
    customStartDate?: string;
    customEndDate?: string;
    excludeTrapQuestions: boolean;
    excludeIncompleteSubmissions: boolean;
}

// API Response Types
export interface AdminApiResponse<T = any> {
    success: boolean;
    message?: string;
    data?: T;
    timeRange?: TimeRange;
    filters?: AdminFilterOptions;
}

export interface AdminApiError {
    success: false;
    message: string;
}

// Model Win Rate Analysis Types
export interface ModelWinRate {
    modelName: string;
    totalComparisons: number;
    wins: number;
    losses: number;
    ties: number;
    winRate: number;
    lossRate: number;
    tieRate: number;
}

export interface OursModelAnalysis {
    modelName: string; // "Ours (Claude 3.7)"
    totalComparisons: number;
    wins: number;
    losses: number;
    ties: number;
    winRate: number;
    lossRate: number;
    tieRate: number;
    vsModels: Array<{
        opponentModel: string;
        comparisons: number;
        wins: number;
        losses: number;
        ties: number;
        winRate: number;
    }>;
}

export interface ModelWinRateAnalysis {
    oursAnalysis: OursModelAnalysis;
    allModels: ModelWinRate[];
    totalComparisons: number;
    lastUpdated: string;
}

// Model Dimension Win Rate Analysis Types
export interface ModelDimensionStats {
    modelName: string;
    dimensionId: string;
    dimensionLabel: string;
    totalEvaluations: number;
    wins: number;
    losses: number;
    ties: number;
    winRate: number;
    lossRate: number;
    tieRate: number;
}

export interface DimensionModelComparison {
    dimensionId: string;
    dimensionLabel: string;
    totalEvaluations: number;
    modelStats: ModelDimensionStats[];
    oursModelStats?: ModelDimensionStats; // "Ours (Claude 3.7)" specific stats
}

export interface ModelDimensionWinRateAnalysis {
    dimensionComparisons: DimensionModelComparison[];
    totalDimensions: number;
    totalEvaluations: number;
    lastUpdated: string;
}

// Model Analytics Filter Types
export interface ModelAnalyticsFilters {
    startDate: Date;
    endDate: Date;
    excludeTraps?: boolean;
    excludeIncomplete?: boolean;
}

// Trap Analysis Types
export interface TrapAnalyticsFilters {
    startDate: string;
    endDate: string;
    excludeIncomplete?: boolean;
}

export interface TrapAnalysisData {
    totalTrapQuestions: number;
    totalTrapResponses: number;
    correctTrapResponses: number;
    incorrectTrapResponses: number;
    accuracy: number;
    userPerformance: Array<{
        annotatorId: string;
        totalTraps: number;
        correctTraps: number;
        accuracy: number;
        status: 'excellent' | 'good' | 'warning' | 'poor';
    }>;
    trapTypeAnalysis: Array<{
        trapType: string;
        total: number;
        correct: number;
        accuracy: number;
    }>;
    recentTrapFailures: Array<{
        annotatorId: string;
        questionId: string;
        submittedAt: string;
        trapType: string;
    }>;
}

// Dimensions Analytics Filter Types
export interface DimensionsAnalyticsFilters {
    timeRange: string;
    startDate?: string;
    endDate?: string;
    excludeTraps?: boolean;
    excludeIncomplete?: boolean;
}

// Questionnaire User Selection Analysis Types
export interface QuestionnaireUserSelectionResponse {
    questionId: string;
    annotatorId: string;
    overallWinner: 'A' | 'B' | 'tie';
    dimensionChoices: { [dimensionId: string]: 'A' | 'B' | 'tie' };
}

export interface QuestionSelectionData {
    questionId: string;
    responses: QuestionnaireUserSelectionResponse[];
    distribution: {
        A: number;
        B: number;
        tie: number;
        total: number;
    };
    consistency: number;
    userList: {
        A: string[];
        B: string[];
        tie: string[];
    };
}

export interface QuestionnaireSelectionData {
    questionnaireId: string;
    questions: { [questionId: string]: QuestionSelectionData };
    totalQuestions: number;
    totalResponses: number;
    avgConsistency: number;
}

export interface QuestionnaireUserSelectionsAnalytics {
    questionnaires: QuestionnaireSelectionData[];
    totalQuestionnaires: number;
    totalQuestions: number;
    totalResponses: number;
    overallAvgConsistency: number;
}

// Questionnaire User Selections Filter Types
export interface QuestionnaireUserSelectionsFilters {
    timeRange: string;
    startDate?: string;
    endDate?: string;
    excludeTraps?: boolean;
    excludeIncomplete?: boolean;
} 