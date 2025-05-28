import type { NextApiRequest, NextApiResponse } from 'next';
import { getStoredSubmissions, getSubmissionStats } from '@/lib/database';
import { QuestionnaireResponse } from '@/types/questionnaire';

interface ExportData {
    metadata: {
        exportDate: string;
        totalSubmissions: number;
        submissionsByQuestion: { [questionId: string]: number };
        submissionsByDate: { [date: string]: number };
    };
    submissions: QuestionnaireResponse[];
}

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
        // 获取所有提交数据和统计信息
        const [submissions, stats] = await Promise.all([
            getStoredSubmissions(),
            getSubmissionStats()
        ]);

        const exportData: ExportData = {
            metadata: {
                exportDate: new Date().toISOString(),
                totalSubmissions: stats.totalSubmissions,
                submissionsByQuestion: stats.submissionsByQuestion,
                submissionsByDate: stats.submissionsByDate
            },
            submissions
        };

        // 设置 JSON 文件下载的响应头
        res.setHeader('Content-Type', 'application/json');
        res.setHeader('Content-Disposition', `attachment; filename="questionnaire-export-${new Date().toISOString().split('T')[0]}.json"`);

        return res.status(200).json(exportData);

    } catch (error) {
        console.error('Error exporting data:', error);
        return res.status(500).json({
            success: false,
            message: 'Failed to export data'
        });
    }
} 