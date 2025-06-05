import type { NextApiRequest, NextApiResponse } from 'next';
import { getStoredSubmissions } from '@/lib/db/submissions';
import { parseAdminApiParams, createSuccessResponse, createErrorResponse, AdminApiResponse } from '@/utils';
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
        return res.status(405).json(createErrorResponse('Method not allowed'));
    }

    try {
        // Parse parameters using utils function
        const {
            shouldExcludeTraps,
            shouldExcludeIncomplete,
            calculatedStartDate,
            calculatedEndDate,
            timeRange
        } = parseAdminApiParams(req);

        // Get filtered submission data
        const allSubmissions = await getStoredSubmissions(
            false, // Don't exclude traps since we need them for analysis
            calculatedStartDate,
            calculatedEndDate,
            shouldExcludeIncomplete
        );

        // Filter data within time range
        const filteredSubmissions = allSubmissions.filter(s =>
            new Date(s.submittedAt) >= new Date(calculatedStartDate) &&
            new Date(s.submittedAt) <= new Date(calculatedEndDate)
        );

        // Get all trap question IDs
        const trapQuestionIds = new Set<string>();
        trapQuestions.forEach(group => {
            group.items.forEach(item => {
                trapQuestionIds.add(item.uuid);
            });
        });

        // Filter trap submissions
        const trapSubmissions = filteredSubmissions.filter(s =>
            s.isTrap || trapQuestionIds.has(s.questionId)
        );

        // Create trap type mapping
        const trapTypeMap = new Map<string, string>();
        trapQuestions.forEach(group => {
            group.items.forEach(item => {
                trapTypeMap.set(item.uuid, group.groupId);
            });
        });

        // Function to verify if trap answer is correct
        const isTrapAnswerCorrect = (submission: any): boolean => {
            const questionId = submission.questionId;
            const trapType = trapTypeMap.get(questionId);

            if (!trapType) return false;

            // Judge correctness based on different trap question types
            switch (trapType) {
                case 'trap-attention-check-001':
                    // Requires selecting option A
                    return submission.overallWinner === 'A' &&
                        submission.dimensionEvaluations.every((evaluation: any) => evaluation.winner === 'A');

                case 'trap-attention-check-002':
                    // Requires selecting option B
                    return submission.overallWinner === 'B' &&
                        submission.dimensionEvaluations.every((evaluation: any) => evaluation.winner === 'B');

                case 'trap-attention-check-003':
                    // Requires selecting TIE
                    return submission.overallWinner === 'tie' &&
                        submission.dimensionEvaluations.every((evaluation: any) => evaluation.winner === 'tie');

                case 'trap-reading-check-001':
                    // Green border option B should be selected
                    return submission.overallWinner === 'B';

                case 'trap-time-check-001':
                    // Time check - can be extended based on actual requirements
                    return true; // Default to correct for now

                default:
                    return false;
            }
        };

        // Calculate statistics
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
                // Record recent failures
                recentFailures.push({
                    annotatorId: submission.annotatorId,
                    questionId: submission.questionId,
                    submittedAt: submission.submittedAt.toISOString(),
                    trapType
                });
            }

            // User statistics
            const userStat = userStats.get(submission.annotatorId) || { total: 0, correct: 0 };
            userStat.total++;
            if (isCorrect) userStat.correct++;
            userStats.set(submission.annotatorId, userStat);

            // Trap question type statistics
            const trapStat = trapTypeStats.get(trapType) || { total: 0, correct: 0 };
            trapStat.total++;
            if (isCorrect) trapStat.correct++;
            trapTypeStats.set(trapType, trapStat);
        });

        // Calculate user performance rating
        const getUserStatus = (accuracy: number): 'excellent' | 'good' | 'warning' | 'poor' => {
            if (accuracy >= 90) return 'excellent';
            if (accuracy >= 80) return 'good';
            if (accuracy >= 60) return 'warning';
            return 'poor';
        };

        // Generate result data
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

        // Sort by time, recent failures first
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
            recentTrapFailures: recentFailures.slice(0, 20) // Latest 20 failure records
        };

        // Use utils function to create success response
        return res.status(200).json(createSuccessResponse(result, timeRange));

    } catch (error) {
        console.error('Error fetching trap analysis data:', error);
        return res.status(500).json(createErrorResponse('Failed to fetch trap analysis data'));
    }
}

function getTrapTypeDisplayName(trapType: string): string {
    switch (trapType) {
        case 'trap-attention-check-001':
            return 'Attention Check - Select A';
        case 'trap-attention-check-002':
            return 'Attention Check - Select B';
        case 'trap-attention-check-003':
            return 'Attention Check - Select TIE';
        case 'trap-reading-check-001':
            return 'Reading Comprehension Check';
        case 'trap-time-check-001':
            return 'Time Investment Check';
        default:
            return 'Unknown Type';
    }
} 