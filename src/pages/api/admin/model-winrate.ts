import { NextApiRequest, NextApiResponse } from 'next';
import { db } from '@/lib/db';
import { submissions, questionnaireGroups } from '@/lib/schema';
import { and, eq, gte, lte } from 'drizzle-orm';
import { ModelWinRateAnalysis, ModelWinRate, OursModelAnalysis } from '@/types/admin';
import {
    parseAdminApiParams,
    extractModelFromUrl,
    createSuccessResponse,
    createErrorResponse
} from '@/utils/adminCommon';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
    if (req.method !== 'GET') {
        return res.status(405).json(createErrorResponse('Method not allowed'));
    }

    try {
        // 解析通用admin参数
        const params = parseAdminApiParams(req);

        // 构建数据库查询条件
        let dateConditions = [];
        dateConditions.push(gte(submissions.submittedAt, new Date(params.calculatedStartDate)));
        dateConditions.push(lte(submissions.submittedAt, new Date(params.calculatedEndDate)));

        let additionalConditions = [];
        if (params.shouldExcludeTraps) {
            additionalConditions.push(eq(submissions.isTrap, false));
        }

        const whereConditions = [...dateConditions, ...additionalConditions];

        // 获取提交数据
        let submissionsData;
        if (params.shouldExcludeIncomplete) {
            // Join with questionnaireGroups and filter by completed status
            submissionsData = await db.select({
                // Select all submissions fields we need
                submissionId: submissions.submissionId,
                questionId: submissions.questionId,
                linkAUrl: submissions.linkAUrl,
                linkBUrl: submissions.linkBUrl,
                questionnaireId: submissions.questionnaireId,
                taskGroupId: submissions.taskGroupId,
                overallWinner: submissions.overallWinner,
                captchaResponse: submissions.captchaResponse,
                annotatorId: submissions.annotatorId,
                isTrap: submissions.isTrap,
                submittedAt: submissions.submittedAt,
                createdAt: submissions.createdAt
            })
                .from(submissions)
                .innerJoin(
                    questionnaireGroups,
                    and(
                        eq(submissions.annotatorId, questionnaireGroups.annotatorId),
                        eq(submissions.questionnaireId, questionnaireGroups.questionnaireId)
                    )
                )
                .where(
                    and(
                        eq(questionnaireGroups.status, 'completed'),
                        ...whereConditions
                    )
                );
        } else {
            submissionsData = await db.select()
                .from(submissions)
                .where(whereConditions.length > 0 ? and(...whereConditions) : undefined);
        }

        // 处理数据计算胜率
        const modelComparisons = new Map<string, {
            wins: number;
            losses: number;
            ties: number;
            total: number;
            opponents: Map<string, { wins: number; losses: number; ties: number; total: number }>;
        }>();

        submissionsData.forEach(submission => {
            const modelA = extractModelFromUrl(submission.linkAUrl);
            const modelB = extractModelFromUrl(submission.linkBUrl);

            if (modelA === 'Unknown' || modelB === 'Unknown') return;

            // 初始化模型数据
            if (!modelComparisons.has(modelA)) {
                modelComparisons.set(modelA, {
                    wins: 0, losses: 0, ties: 0, total: 0,
                    opponents: new Map()
                });
            }
            if (!modelComparisons.has(modelB)) {
                modelComparisons.set(modelB, {
                    wins: 0, losses: 0, ties: 0, total: 0,
                    opponents: new Map()
                });
            }

            const statsA = modelComparisons.get(modelA)!;
            const statsB = modelComparisons.get(modelB)!;

            // 初始化对手追踪
            if (!statsA.opponents.has(modelB)) {
                statsA.opponents.set(modelB, { wins: 0, losses: 0, ties: 0, total: 0 });
            }
            if (!statsB.opponents.has(modelA)) {
                statsB.opponents.set(modelA, { wins: 0, losses: 0, ties: 0, total: 0 });
            }

            const opponentStatsA = statsA.opponents.get(modelB)!;
            const opponentStatsB = statsB.opponents.get(modelA)!;

            // 统计结果
            if (submission.overallWinner === 'A') {
                statsA.wins++;
                statsB.losses++;
                opponentStatsA.wins++;
                opponentStatsB.losses++;
            } else if (submission.overallWinner === 'B') {
                statsA.losses++;
                statsB.wins++;
                opponentStatsA.losses++;
                opponentStatsB.wins++;
            } else if (submission.overallWinner === 'tie') {
                statsA.ties++;
                statsB.ties++;
                opponentStatsA.ties++;
                opponentStatsB.ties++;
            }

            statsA.total++;
            statsB.total++;
            opponentStatsA.total++;
            opponentStatsB.total++;
        });

        // 转换为响应格式
        const allModels: ModelWinRate[] = Array.from(modelComparisons.entries()).map(([modelName, stats]) => ({
            modelName,
            totalComparisons: stats.total,
            wins: stats.wins,
            losses: stats.losses,
            ties: stats.ties,
            winRate: stats.total > 0 ? (stats.wins / stats.total) * 100 : 0,
            lossRate: stats.total > 0 ? (stats.losses / stats.total) * 100 : 0,
            tieRate: stats.total > 0 ? (stats.ties / stats.total) * 100 : 0
        }));

        // 查找"Ours (Claude 3.7)"分析
        const oursModelName = "Ours (Claude 3.7)";
        const oursStats = modelComparisons.get(oursModelName);

        let oursAnalysis: OursModelAnalysis;
        if (oursStats) {
            const vsModels = Array.from(oursStats.opponents.entries()).map(([opponentModel, opponentStats]) => ({
                opponentModel,
                comparisons: opponentStats.total,
                wins: opponentStats.wins,
                losses: opponentStats.losses,
                ties: opponentStats.ties,
                winRate: opponentStats.total > 0 ? (opponentStats.wins / opponentStats.total) * 100 : 0
            }));

            oursAnalysis = {
                modelName: oursModelName,
                totalComparisons: oursStats.total,
                wins: oursStats.wins,
                losses: oursStats.losses,
                ties: oursStats.ties,
                winRate: oursStats.total > 0 ? (oursStats.wins / oursStats.total) * 100 : 0,
                lossRate: oursStats.total > 0 ? (oursStats.losses / oursStats.total) * 100 : 0,
                tieRate: oursStats.total > 0 ? (oursStats.ties / oursStats.total) * 100 : 0,
                vsModels
            };
        } else {
            oursAnalysis = {
                modelName: oursModelName,
                totalComparisons: 0,
                wins: 0,
                losses: 0,
                ties: 0,
                winRate: 0,
                lossRate: 0,
                tieRate: 0,
                vsModels: []
            };
        }

        const response: ModelWinRateAnalysis = {
            oursAnalysis,
            allModels,
            totalComparisons: submissionsData.length,
            lastUpdated: new Date().toISOString()
        };

        return res.status(200).json(createSuccessResponse(response, params.timeRange));

    } catch (error) {
        console.error('Model win rate analysis error:', error);
        return res.status(500).json(createErrorResponse('Failed to analyze model win rates'));
    }
} 