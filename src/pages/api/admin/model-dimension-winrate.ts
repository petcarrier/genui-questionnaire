import { NextApiRequest, NextApiResponse } from 'next';
import { db } from '@/lib/db';
import { submissions, dimensionEvaluations } from '@/lib/schema';
import { and, eq, gte, lte, ne } from 'drizzle-orm';
import { ModelDimensionWinRateAnalysis, ModelDimensionStats, DimensionModelComparison } from '@/types/admin';

// Dimension labels mapping
const DIMENSION_LABELS: { [key: string]: string } = {
    'query_interface_consistency': 'Query-Interface Consistency',
    'task_efficiency': 'Task Efficiency',
    'usability': 'Usability',
    'learnability': 'Learnability',
    'information_clarity': 'Information Clarity',
    'aesthetic_appeal': 'Aesthetic or Stylistic Appeal',
    'interaction_satisfaction': 'Interaction Experience Satisfaction'
};

// Function to extract model name from URL
function extractModelFromUrl(url: string): string {
    const parts = url.split('/');
    for (const part of parts) {
        if (part.startsWith('ai')) {
            if (part === 'ai1') return "Text-based Chatbot (GPT-4o)";
            if (part === 'ai32') return "Ours (Claude 3.7)";
            if (part === 'ai323') return "Ours w/o DR (Claude 3.7)";
            if (part === 'ai22') return "Ours w/o DR & ISL (Claude 3.7)";
            if (part === 'ai222') return "Ours w/o DR & ISL & IS (Claude 3.7)";
            if (part === 'ai4') return "Text-based Chatbot (Claude 3.7)";
            if (part === 'ai5') return "Baseline (Claude 3.7 Forced UI)";
            return part;
        }
    }
    return 'Unknown';
}

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

        // Build date filter
        let dateConditions = [];
        if (timeRange && timeRange !== 'custom') {
            const now = new Date();
            let daysBack = 7;
            if (timeRange === '30d') daysBack = 30;
            if (timeRange === '90d') daysBack = 90;

            const startTime = new Date(now.getTime() - daysBack * 24 * 60 * 60 * 1000);
            dateConditions.push(gte(submissions.submittedAt, startTime));
        } else if (startDate && endDate) {
            dateConditions.push(gte(submissions.submittedAt, new Date(startDate as string)));
            dateConditions.push(lte(submissions.submittedAt, new Date(endDate as string)));
        }

        // Build additional filters
        let additionalConditions = [];
        if (excludeTraps === 'true') {
            additionalConditions.push(eq(submissions.isTrap, false));
        }
        if (excludeIncomplete === 'true') {
            additionalConditions.push(ne(submissions.overallWinner, ''));
        }

        const whereConditions = [...dateConditions, ...additionalConditions];

        // Fetch submissions and dimension evaluations data
        const submissionsData = await db.select()
            .from(submissions)
            .leftJoin(dimensionEvaluations, eq(submissions.submissionId, dimensionEvaluations.submissionId))
            .where(whereConditions.length > 0 ? and(...whereConditions) : undefined);

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