import type { NextApiRequest, NextApiResponse } from 'next';
import { getStoredSubmissions, getSubmissionStats } from '@/lib/db/submissions';
import { getPageViewStats } from '@/lib/db/page-views';
import { ExportData, ExportFormat, QuestionnaireResponse, TimeRange } from '@/types';

export default async function handler(
    req: NextApiRequest,
    res: NextApiResponse
) {
    if (req.method !== 'GET') {
        return res.status(405).json({
            success: false,
            message: 'Method not allowed'
        });
    }

    try {
        const {
            format = 'json',
            timeRange = '30d',
            startDate,
            endDate,
            excludeTraps = 'false',
            excludeIncomplete = 'false'
        } = req.query;

        const exportFormat = format as ExportFormat;
        const validTimeRange = timeRange as TimeRange;
        const shouldExcludeTraps = excludeTraps === 'true';
        const shouldExcludeIncomplete = excludeIncomplete === 'true';

        // 计算时间范围
        let calculatedStartDate: string | undefined;
        let calculatedEndDate: string | undefined;

        if (validTimeRange === 'custom') {
            calculatedStartDate = startDate as string;
            calculatedEndDate = endDate as string;
        } else {
            const now = new Date();
            const days = validTimeRange === '7d' ? 7 : validTimeRange === '30d' ? 30 : 90;
            calculatedStartDate = new Date(now.getTime() - days * 24 * 60 * 60 * 1000).toISOString();
            calculatedEndDate = now.toISOString();
        }

        // 获取过滤后的数据
        const [submissions, submissionStats, pageViewStats] = await Promise.all([
            getStoredSubmissions(shouldExcludeTraps, calculatedStartDate, calculatedEndDate, shouldExcludeIncomplete),
            getSubmissionStats(shouldExcludeTraps, calculatedStartDate, calculatedEndDate, shouldExcludeIncomplete),
            getPageViewStats()
        ]);

        // 计算按小时和星期的统计
        const submissionsByHour: { [hour: string]: number } = {};
        for (let i = 0; i < 24; i++) {
            submissionsByHour[i.toString().padStart(2, '0')] = 0;
        }

        submissions.forEach(submission => {
            const hour = new Date(submission.submittedAt).getHours();
            submissionsByHour[hour.toString().padStart(2, '0')]++;
        });

        const weekdays = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
        const submissionsByWeekday: { [weekday: string]: number } = {};
        weekdays.forEach(day => submissionsByWeekday[day] = 0);

        submissions.forEach(submission => {
            const weekday = weekdays[new Date(submission.submittedAt).getDay()];
            submissionsByWeekday[weekday]++;
        });

        // 创建导出数据
        const exportData = {
            metadata: {
                exportDate: new Date().toISOString(),
                totalSubmissions: submissionStats.totalSubmissions,
                submissionsByQuestion: submissionStats.submissionsByQuestion,
                submissionsByDate: submissionStats.submissionsByDate,
                submissionsByHour: {},
                submissionsByWeekday: {},
                pageViewStats
            },
            submissions
        };

        const dateStr = new Date().toISOString().split('T')[0];

        if (exportFormat === 'csv') {
            // CSV导出
            const csvContent = generateCSV(submissions);
            res.setHeader('Content-Type', 'text/csv');
            res.setHeader('Content-Disposition', `attachment; filename="questionnaire-export-${dateStr}.csv"`);
            return res.status(200).send(csvContent);
        } else {
            // JSON导出（默认）
            res.setHeader('Content-Type', 'application/json');
            res.setHeader('Content-Disposition', `attachment; filename="questionnaire-export-${dateStr}.json"`);
            return res.status(200).json(exportData);
        }

    } catch (error) {
        console.error('Error exporting data:', error);
        return res.status(500).json({
            success: false,
            message: 'Failed to export data'
        });
    }
}

function generateCSV(submissions: QuestionnaireResponse[]): string {
    const headers = [
        'Question ID',
        'Annotator ID',
        'Submitted At',
        'Overall Winner',
        'Dimension Evaluations',
        'Submission Date',
        'Submission Time'
    ];

    const rows = submissions.map(submission => {
        const submittedAt = new Date(submission.submittedAt);
        const dimensionsStr = submission.dimensionEvaluations
            .map(d => `${d.dimensionId}:${d.winner}`)
            .join(';');

        return [
            submission.questionId,
            submission.annotatorId || 'Anonymous',
            submission.submittedAt,
            submission.overallWinner || 'No Selection',
            dimensionsStr,
            submittedAt.toISOString().split('T')[0],
            submittedAt.toTimeString().split(' ')[0]
        ];
    });

    const csvContent = [
        headers.join(','),
        ...rows.map(row => row.map(cell => `"${cell}"`).join(','))
    ].join('\n');

    return csvContent;
} 