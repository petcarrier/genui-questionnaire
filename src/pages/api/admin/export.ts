import type { NextApiRequest, NextApiResponse } from 'next';
import { getStoredSubmissions, getSubmissionStats } from '@/lib/db/submissions';
import { getPageViewStats } from '@/lib/db/page-views';
import { ExportFormat } from '@/types';
import {
    parseAdminApiParams,
    createErrorResponse,
    calculateSubmissionsByHour,
    calculateSubmissionsByWeekday
} from '@/utils/adminCommon';

export default async function handler(
    req: NextApiRequest,
    res: NextApiResponse
) {
    if (req.method !== 'GET') {
        return res.status(405).json(createErrorResponse('Method not allowed'));
    }

    try {
        const { format = 'json' } = req.query;
        const exportFormat = format as ExportFormat;

        // 解析通用admin参数
        const adminParams = parseAdminApiParams(req);

        // 获取过滤后的数据
        const [submissions, submissionStats, pageViewStats] = await Promise.all([
            getStoredSubmissions(
                adminParams.shouldExcludeTraps,
                adminParams.calculatedStartDate,
                adminParams.calculatedEndDate,
                adminParams.shouldExcludeIncomplete
            ),
            getSubmissionStats(
                adminParams.shouldExcludeTraps,
                adminParams.calculatedStartDate,
                adminParams.calculatedEndDate,
                adminParams.shouldExcludeIncomplete
            ),
            getPageViewStats()
        ]);

        // 计算时间统计
        const submissionsByHour = calculateSubmissionsByHour(submissions);
        const submissionsByWeekday = calculateSubmissionsByWeekday(submissions);

        const dateStr = new Date().toISOString().split('T')[0];

        if (exportFormat === 'csv') {
            // CSV导出
            const csvContent = generateCSV(submissions);
            res.setHeader('Content-Type', 'text/csv');
            res.setHeader('Content-Disposition', `attachment; filename="questionnaire-export-${dateStr}.csv"`);
            return res.status(200).send(csvContent);
        } else {
            // JSON导出（默认）
            const exportData = {
                metadata: {
                    exportDate: new Date().toISOString(),
                    totalSubmissions: submissionStats.totalSubmissions,
                    submissionsByQuestion: submissionStats.submissionsByQuestion,
                    submissionsByDate: submissionStats.submissionsByDate,
                    submissionsByHour,
                    submissionsByWeekday,
                    pageViewStats
                },
                submissions
            };

            res.setHeader('Content-Type', 'application/json');
            res.setHeader('Content-Disposition', `attachment; filename="questionnaire-export-${dateStr}.json"`);
            return res.status(200).json(exportData);
        }

    } catch (error) {
        console.error('Error exporting data:', error);
        return res.status(500).json(createErrorResponse('Failed to export data'));
    }
}

function generateCSV(submissions: any[]): string {
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
            .map((d: any) => `${d.dimensionId}:${d.winner}`)
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