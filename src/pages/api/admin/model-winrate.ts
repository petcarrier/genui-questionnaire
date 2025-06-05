import { NextApiRequest, NextApiResponse } from 'next';
import { db } from '@/lib/db';
import { submissions } from '@/lib/schema';
import { and, eq, gte, lte, ne } from 'drizzle-orm';
import { ModelWinRateAnalysis, ModelWinRate, OursModelAnalysis } from '@/types/admin';

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

        // Fetch submissions data
        const submissionsData = await db.select()
            .from(submissions)
            .where(whereConditions.length > 0 ? and(...whereConditions) : undefined);

        // Process the data to calculate win rates
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

            // Initialize models if not exists
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

        const response: ModelWinRateAnalysis = {
            oursAnalysis,
            allModels,
            totalComparisons: submissionsData.length,
            lastUpdated: new Date().toISOString()
        };

        res.status(200).json({
            success: true,
            data: response
        });

    } catch (error) {
        console.error('Model win rate analysis error:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to analyze model win rates'
        });
    }
} 