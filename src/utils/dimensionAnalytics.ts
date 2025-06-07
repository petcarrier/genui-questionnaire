import { DimensionComparisonData } from '@/types/admin';
import { EVALUATION_DIMENSIONS } from '@/types/questionnaire';
import {
    RatingData,
    calculateQuestionnaireOverallKappa,
    groupRatingsByQuestionnaireOnly,
    interpretKappa
} from './fleissKappa';

/**
 * Interface representing raw dimension evaluation data from database
 */
export interface RawDimensionEvaluation {
    id: number;
    annotatorId: string;
    questionId: string;
    submissionId: string;
    dimensionId: string;
    winner: 'A' | 'B' | 'tie';
    notes?: string;
    createdAt: Date;
    questionnaireId?: string;
}

/**
 * Convert raw dimension evaluations to RatingData format for kappa calculation
 */
export function convertToRatingData(evaluations: RawDimensionEvaluation[]): RatingData[] {
    return evaluations.map(evaluation => ({
        questionId: evaluation.questionId,
        dimensionId: evaluation.dimensionId,
        annotatorId: evaluation.annotatorId,
        winner: evaluation.winner,
        questionnaireId: evaluation.questionnaireId
    }));
}

/**
 * Calculate preference strength (absolute difference between A and B choices)
 */
function calculatePreferenceStrength(ratings: RatingData[]): number {
    if (ratings.length === 0) return 0;

    const aCount = ratings.filter(r => r.winner === 'A').length;
    const bCount = ratings.filter(r => r.winner === 'B').length;
    const total = ratings.length;

    const aPercentage = (aCount / total) * 100;
    const bPercentage = (bCount / total) * 100;

    return Math.abs(aPercentage - bPercentage);
}

/**
 * Process dimension evaluations and calculate Fleiss' kappa metrics
 * 按问卷整体计算一致性，不分维度
 * @param evaluations Array of raw dimension evaluation data from database
 * @returns Array of DimensionComparisonData with kappa metrics (now representing questionnaire-level analysis)
 */
export function processDimensionEvaluations(
    evaluations: RawDimensionEvaluation[]
): DimensionComparisonData[] {
    console.log('=== 开始处理维度评估数据（按问卷整体计算）===');

    // Convert to rating data format
    const ratingData = convertToRatingData(evaluations);

    // Group ratings by questionnaire only (all dimensions combined)
    const groupedRatings = groupRatingsByQuestionnaireOnly(ratingData);

    const results: DimensionComparisonData[] = [];

    // Calculate overall kappa for each questionnaire
    for (const [questionnaireId, questionnaireRatings] of groupedRatings.entries()) {
        if (questionnaireRatings.length === 0) continue;

        console.log(`\n=== 处理问卷 ${questionnaireId} 的数据 ===`);

        // 按 questionId + dimensionId 分组，检查每个组合的评分者数量
        const subjectGroups = new Map<string, RatingData[]>();
        for (const rating of questionnaireRatings) {
            const subjectKey = `${rating.questionId}_${rating.dimensionId}`;
            if (!subjectGroups.has(subjectKey)) {
                subjectGroups.set(subjectKey, []);
            }
            subjectGroups.get(subjectKey)!.push(rating);
        }

        console.log('Subjects 评分者情况:');
        for (const [subjectKey, ratings] of subjectGroups.entries()) {
            const uniqueRaters = new Set(ratings.map(r => r.annotatorId));
            console.log(`  ${subjectKey}: ${uniqueRaters.size} 个评分者 [${Array.from(uniqueRaters).join(', ')}]`);
        }

        // 只使用原始数据，不进行任何补充或复制
        const validSubjectGroups = new Map<string, RatingData[]>();

        // 筛选出有足够评分者的 subjects（至少2个评分者才能计算一致性）
        for (const [subjectKey, ratings] of subjectGroups.entries()) {
            const uniqueRaters = new Set(ratings.map(r => r.annotatorId));
            if (uniqueRaters.size >= 2) {
                validSubjectGroups.set(subjectKey, ratings);
            } else {
                console.log(`  ⚠️ ${subjectKey}: 只有 ${uniqueRaters.size} 个评分者，跳过`);
            }
        }

        console.log(`\n有效 Subjects: ${validSubjectGroups.size}/${subjectGroups.size}`);

        // 如果没有有效的 subjects，跳过这个问卷
        if (validSubjectGroups.size === 0) {
            console.log(`⚠️ 问卷 ${questionnaireId} 没有有效的 Subjects（至少需要2个评分者），跳过计算`);
            continue;
        }

        // 将有效的数据合并为一个数组
        const validQuestionnaireRatings: RatingData[] = [];
        for (const ratings of validSubjectGroups.values()) {
            validQuestionnaireRatings.push(...ratings);
        }

        console.log(`最终数据: ${validQuestionnaireRatings.length} 条评分记录`);

        // Calculate overall kappa for this questionnaire (using only valid original data)
        const questionnaireKappa = calculateQuestionnaireOverallKappa(
            questionnaireId,
            validQuestionnaireRatings
        );

        // Calculate preference strength across all valid ratings in this questionnaire
        const preferenceStrength = calculatePreferenceStrength(validQuestionnaireRatings);

        // Create "questionnaire kappa scores" - one entry per questionnaire
        const questionKappaScores = [{
            questionId: questionnaireId, // Using questionnaireId as identifier
            kappa: questionnaireKappa.kappa,
            raters: questionnaireKappa.raters,
            categories: {
                A: validQuestionnaireRatings.filter(r => r.winner === 'A').length,
                B: validQuestionnaireRatings.filter(r => r.winner === 'B').length,
                tie: validQuestionnaireRatings.filter(r => r.winner === 'tie').length
            }
        }];

        results.push({
            dimensionId: `questionnaire_overall`, // 标识这是问卷整体分析
            dimensionLabel: `${questionnaireId} - ${validSubjectGroups.size} Subjects`,
            preferenceStrength: Math.round(preferenceStrength),
            fleissKappa: questionnaireKappa.kappa,
            avgKappaPerQuestion: questionnaireKappa.kappa, // Same as fleissKappa since it's overall
            kappaInterpretation: questionnaireKappa.interpretation as any,
            questionKappaScores
        });
    }

    // If no questionnaire-specific data, fall back to dimension-based analysis
    if (results.length === 0) {
        console.log('没有问卷数据，创建默认维度分析');
        for (const dimension of EVALUATION_DIMENSIONS) {
            results.push({
                dimensionId: dimension.id,
                dimensionLabel: dimension.label,
                preferenceStrength: 0,
                fleissKappa: 0,
                avgKappaPerQuestion: 0,
                kappaInterpretation: 'poor',
                questionKappaScores: []
            });
        }
    }

    console.log('=== 维度评估数据处理完成 ===');
    return results;
}

/**
 * Get summary statistics for dimension evaluations
 */
export function getDimensionEvaluationSummary(evaluations: RawDimensionEvaluation[]) {
    const uniqueQuestions = new Set(evaluations.map(e => e.questionId)).size;
    const uniqueAnnotators = new Set(evaluations.map(e => e.annotatorId)).size;
    const uniqueQuestionnaires = new Set(evaluations.map(e => e.questionnaireId || 'unknown')).size;
    const totalEvaluations = evaluations.length;

    // Calculate average evaluations per questionnaire
    const evaluationsPerQuestionnaire = totalEvaluations / (uniqueQuestionnaires || 1);

    // Find dimension with most evaluations
    const dimensionCounts = evaluations.reduce((acc, evaluation) => {
        acc[evaluation.dimensionId] = (acc[evaluation.dimensionId] || 0) + 1;
        return acc;
    }, {} as Record<string, number>);

    const mostEvaluatedDimension = Object.entries(dimensionCounts)
        .sort(([, a], [, b]) => b - a)[0]?.[0] || '';

    return {
        totalEvaluations,
        uniqueQuestions,
        uniqueAnnotators,
        uniqueQuestionnaires,
        evaluationsPerQuestionnaire: Math.round(evaluationsPerQuestionnaire * 100) / 100,
        mostEvaluatedDimension,
        dimensionCounts
    };
}

/**
 * Filter evaluations by various criteria
 */
export function filterEvaluations(
    evaluations: RawDimensionEvaluation[],
    filters: {
        dateRange?: { start: Date; end: Date };
        questionIds?: string[];
        dimensionIds?: string[];
        questionnaireIds?: string[];
        minRatersPerQuestionnaire?: number;
    }
): RawDimensionEvaluation[] {
    let filtered = evaluations;

    // Filter by date range
    if (filters.dateRange) {
        filtered = filtered.filter(e =>
            e.createdAt >= filters.dateRange!.start &&
            e.createdAt <= filters.dateRange!.end
        );
    }

    // Filter by question IDs
    if (filters.questionIds && filters.questionIds.length > 0) {
        filtered = filtered.filter(e => filters.questionIds!.includes(e.questionId));
    }

    // Filter by dimension IDs
    if (filters.dimensionIds && filters.dimensionIds.length > 0) {
        filtered = filtered.filter(e => filters.dimensionIds!.includes(e.dimensionId));
    }

    // Filter by questionnaire IDs
    if (filters.questionnaireIds && filters.questionnaireIds.length > 0) {
        filtered = filtered.filter(e =>
            filters.questionnaireIds!.includes(e.questionnaireId || 'unknown')
        );
    }

    // Filter by minimum raters per questionnaire
    if (filters.minRatersPerQuestionnaire && filters.minRatersPerQuestionnaire > 1) {
        const questionnaireRaterCounts = filtered.reduce((acc, evaluation) => {
            const key = evaluation.questionnaireId || 'unknown';
            if (!acc[key]) {
                acc[key] = new Set();
            }
            acc[key].add(evaluation.annotatorId);
            return acc;
        }, {} as Record<string, Set<string>>);

        filtered = filtered.filter(evaluation => {
            const key = evaluation.questionnaireId || 'unknown';
            return questionnaireRaterCounts[key]?.size >= filters.minRatersPerQuestionnaire!;
        });
    }

    return filtered;
} 