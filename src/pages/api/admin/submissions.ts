import type { NextApiRequest, NextApiResponse } from 'next';
import { getStoredSubmissions } from '@/lib/db/submissions';
import { AdminApiResponse, PaginatedSubmissionsData } from '@/types';

export default async function handler(
    req: NextApiRequest,
    res: NextApiResponse<AdminApiResponse<PaginatedSubmissionsData>>
) {
    if (req.method !== 'GET') {
        return res.status(405).json({
            success: false,
            message: 'Method not allowed'
        });
    }

    try {
        return await getSubmissionsWithPagination(req, res);
    } catch (error) {
        console.error('Error in submissions API:', error);
        return res.status(500).json({
            success: false,
            message: 'Internal server error'
        });
    }
}

async function getSubmissionsWithPagination(
    req: NextApiRequest,
    res: NextApiResponse<AdminApiResponse<PaginatedSubmissionsData>>
) {
    const {
        page = '1',
        limit = '20',
        sortBy = 'submittedAt',
        sortOrder = 'desc',
        search = '',
        timeRange = '30d',
        startDate,
        endDate,
        excludeTraps = 'false',
        excludeIncomplete = 'false'
    } = req.query;

    const currentPage = parseInt(page as string, 10);
    const pageLimit = parseInt(limit as string, 10);
    const shouldExcludeTraps = excludeTraps === 'true';
    const shouldExcludeIncomplete = excludeIncomplete === 'true';

    // 计算时间范围
    let calculatedStartDate: string | undefined;
    let calculatedEndDate: string | undefined;

    if (timeRange === 'custom') {
        calculatedStartDate = startDate as string;
        calculatedEndDate = endDate as string;
    } else {
        const now = new Date();
        const days = timeRange === '7d' ? 7 : timeRange === '30d' ? 30 : 90;
        calculatedStartDate = new Date(now.getTime() - days * 24 * 60 * 60 * 1000).toISOString();
        calculatedEndDate = now.toISOString();
    }

    // 获取所有提交记录
    const allSubmissions = await getStoredSubmissions(
        shouldExcludeTraps,
        calculatedStartDate,
        calculatedEndDate,
        shouldExcludeIncomplete
    );

    // 搜索过滤
    let filteredSubmissions = allSubmissions;
    if (search) {
        const searchLower = (Array.isArray(search) ? search[0] : search).toLowerCase();
        filteredSubmissions = allSubmissions.filter(submission =>
            submission.questionId.toLowerCase().includes(searchLower) ||
            submission.annotatorId.toLowerCase().includes(searchLower) ||
            submission.taskGroupId.toLowerCase().includes(searchLower) ||
            submission.dimensionEvaluations.some(evaluation =>
                evaluation.dimensionId.toLowerCase().includes(searchLower) ||
                evaluation.notes.toLowerCase().includes(searchLower)
            )
        );
    }

    // 排序
    filteredSubmissions.sort((a, b) => {
        let comparison = 0;

        if (sortBy === 'submittedAt') {
            comparison = new Date(a.submittedAt).getTime() - new Date(b.submittedAt).getTime();
        } else if (sortBy === 'questionId') {
            comparison = a.questionId.localeCompare(b.questionId);
        } else if (sortBy === 'annotatorId') {
            comparison = a.annotatorId.localeCompare(b.annotatorId);
        }

        return sortOrder === 'desc' ? -comparison : comparison;
    });

    // 分页
    const total = filteredSubmissions.length;
    const totalPages = Math.ceil(total / pageLimit);
    const startIndex = (currentPage - 1) * pageLimit;
    const endIndex = startIndex + pageLimit;
    const paginatedSubmissions = filteredSubmissions.slice(startIndex, endIndex);

    const paginatedData: PaginatedSubmissionsData = {
        submissions: paginatedSubmissions,
        total,
        totalPages,
        currentPage,
        hasNextPage: currentPage < totalPages,
        hasPrevPage: currentPage > 1
    };

    return res.status(200).json({
        success: true,
        data: paginatedData
    });
} 