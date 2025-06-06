import { NextApiRequest, NextApiResponse } from 'next';
import { db } from '@/lib/db';
import { submissions, dimensionEvaluations, questionnaireGroups } from '@/lib/schema';
import { and, eq, gte, lte } from 'drizzle-orm';
import { ModelDimensionWinRateAnalysis, ModelDimensionStats, DimensionModelComparison } from '@/types/admin';
import { calculateTimeRange } from '@/utils/timeRangeUtils';
import { TimeRange } from '@/types';
import { extractModelFromUrl, DIMENSION_LABELS } from '@/utils/adminCommon';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
    if (req.method !== 'GET') {
        return res.status(405).json({ success: false, message: 'Method not allowed' });
    }

    try {
        const {
            timeRange,
            startDate,
            endDate,
            excludeTraps,
            excludeIncomplete
        } = req.query;

        // Build date filter using time range utility
        let dateConditions = [];
        if (timeRange) {
            const { startDate: calcStartDate, endDate: calcEndDate } = calculateTimeRange(
                timeRange as TimeRange,
                startDate as string,
                endDate as string
            );

            dateConditions.push(gte(submissions.submittedAt, new Date(calcStartDate)));
            dateConditions.push(lte(submissions.submittedAt, new Date(calcEndDate)));
        }

        // Build additional filters
        let additionalConditions = [];
        if (excludeTraps === 'true') {
            additionalConditions.push(eq(submissions.isTrap, false));
        }

        const whereConditions = [...dateConditions, ...additionalConditions];

        // Fetch submissions and dimension evaluations data
        let submissionsData;
        if (excludeIncomplete === 'true') {
            // Join with questionnaireGroups and filter by completed status
            submissionsData = await db.select()
                .from(submissions)
                .leftJoin(dimensionEvaluations, eq(submissions.submissionId, dimensionEvaluations.submissionId))
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
                .leftJoin(dimensionEvaluations, eq(submissions.submissionId, dimensionEvaluations.submissionId))
                .where(whereConditions.length > 0 ? and(...whereConditions) : undefined);
        }

        // Process the data
        const dimensionModelStats = new Map<string, Map<string, {
            wins: number;
            losses: number;
            ties: number;
            total: number;
        }>>();

        submissionsData.forEach(row => {
            const submission = row.submissions;
            const dimEval = row.dimension_evaluations;

            if (!dimEval || !dimEval.winner || dimEval.winner === '') return;

            const modelA = extractModelFromUrl(submission.linkAUrl);
            const modelB = extractModelFromUrl(submission.linkBUrl);

            if (modelA === 'Unknown' || modelB === 'Unknown') return;

            const dimensionId = dimEval.dimensionId;

            // Initialize dimension if not exists
            if (!dimensionModelStats.has(dimensionId)) {
                dimensionModelStats.set(dimensionId, new Map());
            }

            const dimensionStats = dimensionModelStats.get(dimensionId)!;

            // Initialize models if not exist for this dimension
            if (!dimensionStats.has(modelA)) {
                dimensionStats.set(modelA, { wins: 0, losses: 0, ties: 0, total: 0 });
            }
            if (!dimensionStats.has(modelB)) {
                dimensionStats.set(modelB, { wins: 0, losses: 0, ties: 0, total: 0 });
            }

            const statsA = dimensionStats.get(modelA)!;
            const statsB = dimensionStats.get(modelB)!;

            // Count results based on dimension evaluation winner
            if (dimEval.winner === 'A') {
                statsA.wins++;
                statsB.losses++;
            } else if (dimEval.winner === 'B') {
                statsA.losses++;
                statsB.wins++;
            } else if (dimEval.winner === 'tie') {
                statsA.ties++;
                statsB.ties++;
            }

            statsA.total++;
            statsB.total++;
        });

        // Convert to response format
        const dimensionComparisons: DimensionModelComparison[] = Array.from(dimensionModelStats.entries()).map(([dimensionId, modelStats]) => {
            const modelStatsList: ModelDimensionStats[] = Array.from(modelStats.entries()).map(([modelName, stats]) => ({
                modelName,
                dimensionId,
                dimensionLabel: DIMENSION_LABELS[dimensionId] || dimensionId,
                totalEvaluations: stats.total,
                wins: stats.wins,
                losses: stats.losses,
                ties: stats.ties,
                winRate: stats.total > 0 ? (stats.wins / stats.total) * 100 : 0,
                lossRate: stats.total > 0 ? (stats.losses / stats.total) * 100 : 0,
                tieRate: stats.total > 0 ? (stats.ties / stats.total) * 100 : 0
            }));

            const totalEvaluations = modelStatsList.reduce((sum, model) => sum + model.totalEvaluations, 0) / 2; // Divide by 2 since each evaluation counts twice (once for each model)

            const oursModelStats = modelStatsList.find(model => model.modelName === "Ours (Claude 3.7)");

            return {
                dimensionId,
                dimensionLabel: DIMENSION_LABELS[dimensionId] || dimensionId,
                totalEvaluations: Math.floor(totalEvaluations),
                modelStats: modelStatsList.sort((a, b) => b.winRate - a.winRate),
                oursModelStats
            };
        });

        const totalEvaluations = dimensionComparisons.reduce((sum, dim) => sum + dim.totalEvaluations, 0);

        const response: ModelDimensionWinRateAnalysis = {
            dimensionComparisons: dimensionComparisons.sort((a, b) => a.dimensionLabel.localeCompare(b.dimensionLabel)),
            totalDimensions: dimensionComparisons.length,
            totalEvaluations,
            lastUpdated: new Date().toISOString()
        };

        res.status(200).json({
            success: true,
            data: response
        });

    } catch (error) {
        console.error('Model dimension win rate analysis error:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to analyze model dimension win rates'
        });
    }
} 