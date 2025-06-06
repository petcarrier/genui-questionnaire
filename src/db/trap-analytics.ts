import { getStoredSubmissions } from './submissions';
import { getTrapQuestionIds, getTrapTypeMap } from '@/utils';
import type { TrapAnalysisData, TrapAnalyticsFilters } from '@/types/admin';

export async function getTrapAnalysisData(filters: TrapAnalyticsFilters): Promise<TrapAnalysisData> {
    // Get filtered submission data
    const allSubmissions = await getStoredSubmissions(
        false, // Don't exclude traps since we need them for analysis
        filters.startDate,
        filters.endDate,
        filters.excludeIncomplete
    );

    // Filter data within time range
    const filteredSubmissions = allSubmissions.filter(s =>
        new Date(s.submittedAt) >= new Date(filters.startDate) &&
        new Date(s.submittedAt) <= new Date(filters.endDate)
    );

    // Get all trap question IDs
    const trapQuestionIds = getTrapQuestionIds();

    // Filter trap submissions
    const trapSubmissions = filteredSubmissions.filter(s => trapQuestionIds.has(s.questionId));

    // Create trap type mapping
    const trapTypeMap = getTrapTypeMap();

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

    // Helper function for trap type display names
    const getTrapTypeDisplayName = (trapType: string): string => {
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

    return {
        totalTrapQuestions,
        totalTrapResponses,
        correctTrapResponses: correctCount,
        incorrectTrapResponses: totalTrapResponses - correctCount,
        accuracy,
        userPerformance,
        trapTypeAnalysis,
        recentTrapFailures: recentFailures.slice(0, 20) // Latest 20 failure records
    };
} 