import { NextApiRequest } from 'next';
import { calculateTimeRange } from './timeRangeUtils';
import { TimeRange, AdminFilterOptions } from '@/types';

// 通用查询参数接口
export interface AdminApiQueryParams {
    timeRange?: string;
    startDate?: string;
    endDate?: string;
    excludeTraps?: string;
    excludeIncomplete?: string;
}

// 解析后的admin参数
export interface ParsedAdminParams {
    timeRange: TimeRange;
    shouldExcludeTraps: boolean;
    shouldExcludeIncomplete: boolean;
    calculatedStartDate: string;
    calculatedEndDate: string;
}

/**
 * 解析通用的admin API查询参数
 * 在所有admin API中都会用到的参数解析
 */
export function parseAdminApiParams(req: NextApiRequest): ParsedAdminParams {
    const {
        timeRange = '30d',
        startDate,
        endDate,
        excludeTraps = 'false',
        excludeIncomplete = 'false'
    } = req.query as AdminApiQueryParams;

    const validTimeRange = timeRange as TimeRange;
    const shouldExcludeTraps = excludeTraps === 'true';
    const shouldExcludeIncomplete = excludeIncomplete === 'true';

    const { startDate: calculatedStartDate, endDate: calculatedEndDate } = calculateTimeRange(
        validTimeRange,
        startDate,
        endDate
    );

    return {
        timeRange: validTimeRange,
        shouldExcludeTraps,
        shouldExcludeIncomplete,
        calculatedStartDate,
        calculatedEndDate
    };
}

/**
 * 从URL提取模型名称
 * 在model-winrate.ts和model-dimension-winrate.ts中重复使用
 */
export function extractModelFromUrl(url: string): string {
    const parts = url.split('/');
    for (const part of parts) {
        if (part.startsWith('ai')) {
            if (part === 'ai1') return "Text-based Chatbot (GPT-4o)";
            if (part === 'ai32') return "Ours (Claude 3.7)";
            if (part === 'ai323') return "Ours w/o DR (Claude 3.7)";
            if (part === 'ai22') return "Ours w/o DR & ISL (Claude 3.7)";
            if (part === 'ai222') return "Ours w/o DR & ISL & IS (Claude 3.7)";
            if (part === 'ai4') return "Text-based Chatbot (Claude 3.7)";
            if (part === 'ai5') return "Baseline (Claude 3.7 Forced UI)";
            return part;
        }
    }
    return 'Unknown';
}

/**
 * 维度标签映射
 * 在model-dimension-winrate.ts和dimensions.ts中重复使用
 */
export const DIMENSION_LABELS: { [key: string]: string } = {
    'query_interface_consistency': 'Query-Interface Consistency',
    'task_efficiency': 'Task Efficiency',
    'usability': 'Usability',
    'learnability': 'Learnability',
    'information_clarity': 'Information Clarity',
    'aesthetic_appeal': 'Aesthetic or Stylistic Appeal',
    'interaction_satisfaction': 'Interaction Experience Satisfaction'
};

/**
 * 按小时统计提交数据
 * 在dashboard.ts和export.ts中重复使用
 */
export function calculateSubmissionsByHour(submissions: any[]): { [hour: string]: number } {
    const submissionsByHour: { [hour: string]: number } = {};

    // 初始化所有小时
    for (let i = 0; i < 24; i++) {
        submissionsByHour[i.toString().padStart(2, '0')] = 0;
    }

    submissions.forEach(submission => {
        const hour = new Date(submission.submittedAt).getHours();
        submissionsByHour[hour.toString().padStart(2, '0')]++;
    });

    return submissionsByHour;
}

/**
 * 按星期统计提交数据
 * 在dashboard.ts和export.ts中重复使用
 */
export function calculateSubmissionsByWeekday(submissions: any[]): { [weekday: string]: number } {
    const weekdays = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
    const submissionsByWeekday: { [weekday: string]: number } = {};

    weekdays.forEach(day => submissionsByWeekday[day] = 0);

    submissions.forEach(submission => {
        const weekday = weekdays[new Date(submission.submittedAt).getDay()];
        submissionsByWeekday[weekday]++;
    });

    return submissionsByWeekday;
}

/**
 * 构建查询参数字符串
 * 用于admin页面的API请求
 */
export function buildQueryParams(filters: AdminFilterOptions): string {
    const params = new URLSearchParams();

    if (filters.timeRange === 'custom') {
        if (filters.customStartDate) {
            // 直接传递日期字符串，不做处理
            params.append('startDate', filters.customStartDate);
        }
        if (filters.customEndDate) {
            // 直接传递日期字符串，不做处理
            params.append('endDate', filters.customEndDate);
        }
    }

    params.append('timeRange', filters.timeRange);

    if (filters.excludeTrapQuestions) params.append('excludeTraps', 'true');
    if (filters.excludeIncompleteSubmissions) params.append('excludeIncomplete', 'true');

    return params.toString();
}

/**
 * 标准API响应格式
 * 在所有admin API中保持一致的响应格式
 */
export interface AdminApiResponse<T = any> {
    success: boolean;
    data?: T;
    message?: string;
    timeRange?: TimeRange;
}

export function createSuccessResponse<T>(data: T, timeRange?: TimeRange): AdminApiResponse<T> {
    return {
        success: true,
        data,
        ...(timeRange && { timeRange })
    };
}

export function createErrorResponse(message: string): AdminApiResponse {
    return {
        success: false,
        message
    };
} 