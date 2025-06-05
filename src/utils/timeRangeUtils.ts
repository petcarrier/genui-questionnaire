import { formatISO, startOfDay, endOfDay, subDays, subYears } from 'date-fns';

export type ExtendedTimeRange = '7d' | '30d' | '90d' | '1y' | 'custom';

export interface TimeRangeResult {
    startDate: string;
    endDate: string;
}

/**
 * Calculate start and end dates based on time range parameters
 * @param timeRange - Time range type ('7d', '30d', '90d', '1y', 'custom')
 * @param startDate - Custom start date (required when timeRange is 'custom')
 * @param endDate - Custom end date (required when timeRange is 'custom')
 * @returns Object with calculated startDate and endDate as ISO strings
 */
export function calculateTimeRange(
    timeRange: ExtendedTimeRange | string,
    startDate?: string,
    endDate?: string
): TimeRangeResult {
    if (timeRange === 'custom') {
        if (startDate && endDate) {
            // 自定义时间范围：开始日期从0点开始，结束日期到23:59:59结束
            return {
                startDate: formatISO(startOfDay(new Date(startDate))),
                endDate: formatISO(endOfDay(new Date(endDate)))
            };
        } else {
            // 如果自定义时间范围缺少参数，默认使用今天
            const today = new Date();
            return {
                startDate: formatISO(startOfDay(today)),
                endDate: formatISO(endOfDay(today))
            };
        }
    } else {
        // 预设时间范围：统一处理，结束时间为今天23:59:59，开始时间为N天前的0点
        const now = new Date();
        let calculatedStartDate: Date;

        if (timeRange === '1y') {
            calculatedStartDate = subYears(now, 1);
        } else {
            const days = timeRange === '7d' ? 7 : timeRange === '30d' ? 30 : 90;
            calculatedStartDate = subDays(now, days);
        }

        return {
            startDate: formatISO(startOfDay(calculatedStartDate)),
            endDate: formatISO(endOfDay(now))
        };
    }
} 