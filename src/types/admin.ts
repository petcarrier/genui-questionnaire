import { QuestionnaireResponse } from './questionnaire';

// Dashboard Types
export interface DashboardSummary {
    totalSubmissions: number;
    totalQuestions: number;
    totalPageViews: number;
    averageCompletionTime: number;
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

export interface DimensionComparisonData {
    dimensionId: string;
    dimensionLabel: string;
    preferenceStrength: number; // A和B选择差异的绝对值
    consistencyScore: number; // 用户选择的一致性
    controversyScore: number; // 争议程度 (tie的比例)
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
    totalPageViews: number;
    submissionsByQuestion: { [questionId: string]: number };
    submissionsByDate: { [date: string]: number };
    submissionsByHour: { [hour: string]: number };
    submissionsByWeekday: { [weekday: string]: number };
    pageViewStats: PageViewStats;
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
export type TimeRange = '7d' | '30d' | '90d';

// API Response Types
export interface AdminApiResponse<T = any> {
    success: boolean;
    message?: string;
    data?: T;
    timeRange?: TimeRange;
}

export interface AdminApiError {
    success: false;
    message: string;
} 