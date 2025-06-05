import type { NextApiRequest, NextApiResponse } from 'next';
import { getStoredSubmissions } from '@/lib/db/submissions';
import { AdminApiResponse, PaginatedSubmissionsData } from '@/types';
import {
    parseAdminApiParams,
    createSuccessResponse,
    createErrorResponse,
    AdminApiQueryParams
} from '@/utils/adminCommon';

export default async function handler(
    req: NextApiRequest,
    res: NextApiResponse<AdminApiResponse<PaginatedSubmissionsData>>
) {
    if (req.method !== 'GET') {
        return res.status(405).json(createErrorResponse('Method not allowed'));
    }

    try {
        return await getSubmissionsWithPagination(req, res);
    } catch (error) {
        console.error('Error in submissions API:', error);
        return res.status(500).json(createErrorResponse('Internal server error'));
    }
}

async function getSubmissionsWithPagination(
    req: NextApiRequest,
    res: NextApiResponse<AdminApiResponse<PaginatedSubmissionsData>>
) {
    // 解析通用admin参数
    const adminParams = parseAdminApiParams(req);

    // 解析分页参数
    const {
        page = '1',
        limit = '20',
        sortBy = 'submittedAt',
        sortOrder = 'desc',
        search = ''
    } = req.query as AdminApiQueryParams & {
        page?: string;
        limit?: string;
        sortBy?: string;
        sortOrder?: string;
        search?: string;
    };

    const currentPage = parseInt(page, 10);
    const pageLimit = parseInt(limit, 10);

    // 获取过滤后的提交数据
    const allSubmissions = await getStoredSubmissions(
        adminParams.shouldExcludeTraps,
        adminParams.calculatedStartDate,
        adminParams.calculatedEndDate,
        adminParams.shouldExcludeIncomplete
    );

    // 搜索过滤
    let filteredSubmissions = allSubmissions;
    if (search) {
        const searchLower = search.toLowerCase();
        filteredSubmissions = allSubmissions.filter(submission =>
            submission.questionId.toLowerCase().includes(searchLower) ||
            submission.annotatorId.toLowerCase().includes(searchLower) ||
            submission.taskGroupId?.toLowerCase().includes(searchLower) ||
            submission.dimensionEvaluations?.some((evaluation: any) =>
                evaluation.dimensionId.toLowerCase().includes(searchLower) ||
                evaluation.notes?.toLowerCase().includes(searchLower)
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

    return res.status(200).json(createSuccessResponse(paginatedData, adminParams.timeRange));
} 