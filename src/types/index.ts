// Re-export all types for easier imports
export * from './questionnaire';
export * from './admin';

// Specific type exports (if needed for selective imports)
export type {
    QuestionnaireQuestion,
    QuestionnaireResponse,
    DimensionEvaluation,
    EvaluationDimension,
    ComparisonLink,
    PageVisitStatus,
    VerificationCodeStatus,
    QuestionnaireResponseMetadata
} from './questionnaire';

export type {
    DashboardData,
    UserData,
    UsersResponse,
    TimeRange,
    ExportFormat,
    DimensionsAnalyticsData,
    DimensionAnalysis,
    DimensionWinnerStats,
    DimensionComparisonData,
    AnalyticsData,
    AdminApiResponse
} from './admin'; 