import { db } from './index';
import { submissions, dimensionEvaluations, questionnaireGroups } from './schema';
import { and, eq, gte, lte } from 'drizzle-orm';
import { extractModelFromUrl, DIMENSION_LABELS } from '@/utils/adminCommon';
import type {
    ModelWinRateAnalysis,
    ModelDimensionWinRateAnalysis,
    OursModelAnalysis,
    ModelWinRate,
    DimensionModelComparison,
    ModelDimensionStats,
    ModelAnalyticsFilters
} from '@/types/admin';

export async function getModelWinRateData(filters: ModelAnalyticsFilters): Promise<ModelWinRateAnalysis> {
    // Build date filter conditions
    let dateConditions = [];
    dateConditions.push(gte(submissions.submittedAt, filters.startDate));
    dateConditions.push(lte(submissions.submittedAt, filters.endDate));

    let additionalConditions = [];
    if (filters.excludeTraps) {
        additionalConditions.push(eq(submissions.isTrap, false));
    }

    const whereConditions = [...dateConditions, ...additionalConditions];

    // Fetch submissions data
    let submissionsData;
    if (filters.excludeIncomplete) {
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

    // Process data to calculate win rates
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

        // Initialize model data
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

        // Initialize opponent tracking
        if (!statsA.opponents.has(modelB)) {
            statsA.opponents.set(modelB, { wins: 0, losses: 0, ties: 0, total: 0 });
        }
        if (!statsB.opponents.has(modelA)) {
            statsB.opponents.set(modelA, { wins: 0, losses: 0, ties: 0, total: 0 });
        }

        const opponentStatsA = statsA.opponents.get(modelB)!;
        const opponentStatsB = statsB.opponents.get(modelA)!;

        // Count results
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

    // Convert to response format
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

    // Find "Ours (Claude 3.7)" analysis
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

    return {
        oursAnalysis,
        allModels,
        totalComparisons: submissionsData.length,
        lastUpdated: new Date().toISOString()
    };
}

export async function getModelDimensionWinRateData(filters: ModelAnalyticsFilters): Promise<ModelDimensionWinRateAnalysis> {
    // Build date filter conditions
    let dateConditions = [];
    dateConditions.push(gte(submissions.submittedAt, filters.startDate));
    dateConditions.push(lte(submissions.submittedAt, filters.endDate));

    let additionalConditions = [];
    if (filters.excludeTraps) {
        additionalConditions.push(eq(submissions.isTrap, false));
    }

    const whereConditions = [...dateConditions, ...additionalConditions];

    // Fetch submissions and dimension evaluations data
    let submissionsData;
    if (filters.excludeIncomplete) {
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

        const totalEvaluations = modelStatsList.reduce((sum, model) => sum + model.totalEvaluations, 0) / 2; // Divide by 2 since each evaluation counts twice

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

    return {
        dimensionComparisons: dimensionComparisons.sort((a, b) => a.dimensionLabel.localeCompare(b.dimensionLabel)),
        totalDimensions: dimensionComparisons.length,
        totalEvaluations,
        lastUpdated: new Date().toISOString()
    };
} 