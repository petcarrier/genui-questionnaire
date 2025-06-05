import type { NextApiRequest, NextApiResponse } from 'next';
import { getStoredSubmissions } from '@/lib/db/submissions';
import { AdminApiResponse } from '@/types';
import trapQuestions from '@/data/trapQuestions.json';

interface TrapAnalysisData {
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

export default async function handler(
    req: NextApiRequest,
    res: NextApiResponse<AdminApiResponse<TrapAnalysisData>>
) {
    if (req.method !== 'GET') {
        return res.status(405).json({
            success: false,
            message: 'Method not allowed'
        });
    }

    try {
        const { timeRange = '30d' } = req.query;

        // 获取所有提交数据
        const allSubmissions = await getStoredSubmissions();

        // 根据时间范围过滤数据
        const now = new Date();
        let startDate = new Date();

        switch (timeRange) {
            case '7d':
                startDate.setDate(now.getDate() - 7);
                break;
            case '30d':
                startDate.setDate(now.getDate() - 30);
                break;
            case '90d':
                startDate.setDate(now.getDate() - 90);
                break;
            case '1y':
                startDate.setFullYear(now.getFullYear() - 1);
                break;
            default:
                startDate.setDate(now.getDate() - 30);
        }

        const filteredSubmissions = allSubmissions.filter(s =>
            new Date(s.submittedAt) >= startDate
        );

        // 获取所有陷阱题ID
        const trapQuestionIds = new Set<string>();
        trapQuestions.forEach(group => {
            group.items.forEach(item => {
                trapQuestionIds.add(item.uuid);
            });
        });

        // 过滤出陷阱题提交
        const trapSubmissions = filteredSubmissions.filter(s => s.isTrap);

        // 创建陷阱题类型映射
        const trapTypeMap = new Map<string, string>();
        trapQuestions.forEach(group => {
            group.items.forEach(item => {
                trapTypeMap.set(item.uuid, group.groupId);
            });
        });

        // 验证陷阱题回答是否正确的函数
        const isTrapAnswerCorrect = (submission: any): boolean => {
            const questionId = submission.questionId;
            const trapType = trapTypeMap.get(questionId);

            if (!trapType) return false;

            // 根据不同类型的陷阱题判断是否正确
            switch (trapType) {
                case 'trap-attention-check-001':
                    // 要求选择选项A
                    return submission.overallWinner === 'A' &&
                        submission.dimensionEvaluations.every((evaluation: any) => evaluation.winner === 'A');

                case 'trap-attention-check-002':
                    // 要求选择选项B
                    return submission.overallWinner === 'B' &&
                        submission.dimensionEvaluations.every((evaluation: any) => evaluation.winner === 'B');

                case 'trap-attention-check-003':
                    // 要求选择TIE
                    return submission.overallWinner === 'tie' &&
                        submission.dimensionEvaluations.every((evaluation: any) => evaluation.winner === 'tie');

                case 'trap-reading-check-001':
                    // 绿色边框的选项B应该被选择
                    return submission.overallWinner === 'B';

                case 'trap-time-check-001':
                    // 时间检查 - 这里可以根据实际需求扩展
                    return true; // 暂时默认为正确

                default:
                    return false;
            }
        };

        // 计算统计数据
        let correctCount = 0;
        const userStats = new Map<string, { total: number; correct: number }>();
        const trapTypeStats = new Map<string, { total: number; correct: number }>();
        const recentFailures: Array<{
            annotatorId: string;
            questionId: string;
            submittedAt: string;
            trapType: string;
        }> = [];

        trapSubmissions.forEach(submission => {
            const isCorrect = isTrapAnswerCorrect(submission);
            const trapType = trapTypeMap.get(submission.questionId) || 'unknown';

            if (isCorrect) {
                correctCount++;
            } else {
                // 记录最近的失败
                recentFailures.push({
                    annotatorId: submission.annotatorId,
                    questionId: submission.questionId,
                    submittedAt: submission.submittedAt.toISOString(),
                    trapType
                });
            }

            // 用户统计
            const userStat = userStats.get(submission.annotatorId) || { total: 0, correct: 0 };
            userStat.total++;
            if (isCorrect) userStat.correct++;
            userStats.set(submission.annotatorId, userStat);

            // 陷阱题类型统计
            const trapStat = trapTypeStats.get(trapType) || { total: 0, correct: 0 };
            trapStat.total++;
            if (isCorrect) trapStat.correct++;
            trapTypeStats.set(trapType, trapStat);
        });

        // 计算用户表现评级
        const getUserStatus = (accuracy: number): 'excellent' | 'good' | 'warning' | 'poor' => {
            if (accuracy >= 90) return 'excellent';
            if (accuracy >= 80) return 'good';
            if (accuracy >= 60) return 'warning';
            return 'poor';
        };

        // 生成结果数据
        const totalTrapQuestions = trapQuestionIds.size;
        const totalTrapResponses = trapSubmissions.length;
        const accuracy = totalTrapResponses > 0 ? (correctCount / totalTrapResponses) * 100 : 0;

        const userPerformance = Array.from(userStats.entries())
            .map(([annotatorId, stats]) => ({
                annotatorId,
                totalTraps: stats.total,
                correctTraps: stats.correct,
                accuracy: stats.total > 0 ? (stats.correct / stats.total) * 100 : 0,
                status: getUserStatus(stats.total > 0 ? (stats.correct / stats.total) * 100 : 0)
            }))
            .sort((a, b) => b.accuracy - a.accuracy);

        const trapTypeAnalysis = Array.from(trapTypeStats.entries())
            .map(([trapType, stats]) => ({
                trapType: getTrapTypeDisplayName(trapType),
                total: stats.total,
                correct: stats.correct,
                accuracy: stats.total > 0 ? (stats.correct / stats.total) * 100 : 0
            }))
            .sort((a, b) => b.accuracy - a.accuracy);

        // 按时间排序，最近的失败在前
        recentFailures.sort((a, b) =>
            new Date(b.submittedAt).getTime() - new Date(a.submittedAt).getTime()
        );

        const result: TrapAnalysisData = {
            totalTrapQuestions,
            totalTrapResponses,
            correctTrapResponses: correctCount,
            incorrectTrapResponses: totalTrapResponses - correctCount,
            accuracy,
            userPerformance,
            trapTypeAnalysis,
            recentTrapFailures: recentFailures.slice(0, 20) // 最近20条失败记录
        };

        return res.status(200).json({
            success: true,
            data: result
        });

    } catch (error) {
        console.error('Error fetching trap analysis data:', error);
        return res.status(500).json({
            success: false,
            message: 'Failed to fetch trap analysis data'
        });
    }
}

function getTrapTypeDisplayName(trapType: string): string {
    switch (trapType) {
        case 'trap-attention-check-001':
            return '注意力检查 - 选择A';
        case 'trap-attention-check-002':
            return '注意力检查 - 选择B';
        case 'trap-attention-check-003':
            return '注意力检查 - 选择TIE';
        case 'trap-reading-check-001':
            return '阅读理解检查';
        case 'trap-time-check-001':
            return '时间投入检查';
        default:
            return '未知类型';
    }
} 