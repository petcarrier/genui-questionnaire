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

        console.log(`\n=== 筛选问卷 ${questionnaireId} 的数据 ===`);

        // 按 questionId + dimensionId 分组，检查每个组合是否有3个评分者
        const subjectGroups = new Map<string, RatingData[]>();
        for (const rating of questionnaireRatings) {
            const subjectKey = `${rating.questionId}_${rating.dimensionId}`;
            if (!subjectGroups.has(subjectKey)) {
                subjectGroups.set(subjectKey, []);
            }
            subjectGroups.get(subjectKey)!.push(rating);
        }

        console.log('原始 Subjects:');
        for (const [subjectKey, ratings] of subjectGroups.entries()) {
            const uniqueRaters = new Set(ratings.map(r => r.annotatorId));
            console.log(`  ${subjectKey}: ${uniqueRaters.size} 个评分者 [${Array.from(uniqueRaters).join(', ')}]`);
        }

        // 第一步：收集问卷中所有出现过的评分者
        const allRatersInQuestionnaire = new Set<string>();
        for (const ratings of subjectGroups.values()) {
            for (const rating of ratings) {
                allRatersInQuestionnaire.add(rating.annotatorId);
            }
        }

        console.log(`\n问卷 ${questionnaireId} 中所有评分者: ${Array.from(allRatersInQuestionnaire).join(', ')}`);
        console.log(`评分者总数: ${allRatersInQuestionnaire.size}`);

        // 第二步：确定这个问卷应该使用的3个评分者
        let finalRaters: string[] = [];
        const targetRaters = 3;

        if (allRatersInQuestionnaire.size === targetRaters) {
            // 恰好3个评分者
            finalRaters = Array.from(allRatersInQuestionnaire);
            console.log(`✅ 恰好3个评分者，直接使用: ${finalRaters.join(', ')}`);
        } else if (allRatersInQuestionnaire.size > targetRaters) {
            // 超过3个评分者，随机选择3个
            const ratersArray = Array.from(allRatersInQuestionnaire);
            finalRaters = ratersArray.sort(() => 0.5 - Math.random()).slice(0, targetRaters);
            console.log(`🔧 从 ${allRatersInQuestionnaire.size} 个评分者中随机选择 ${targetRaters} 个: ${finalRaters.join(', ')}`);
        } else if (allRatersInQuestionnaire.size > 0) {
            // 少于3个评分者，复制现有评分者补充
            finalRaters = Array.from(allRatersInQuestionnaire);
            const needToAdd = targetRaters - allRatersInQuestionnaire.size;
            console.log(`🔧 只有 ${allRatersInQuestionnaire.size} 个评分者，需要补充 ${needToAdd} 个`);

            for (let i = 0; i < needToAdd; i++) {
                const sourceRater = finalRaters[i % finalRaters.length];
                const newRaterId = `${sourceRater}_copy_${i + 1}`;
                finalRaters.push(newRaterId);
                console.log(`    复制评分者: ${sourceRater} -> ${newRaterId}`);
            }
        }

        if (finalRaters.length !== targetRaters) {
            console.log(`⚠️ 无法确定3个评分者，跳过问卷 ${questionnaireId}`);
            continue;
        }

        console.log(`\n最终确定的3个评分者: ${finalRaters.join(', ')}`);

        // 第三步：确保每个 Subject 都有这3个评分者的完整数据
        console.log('\n开始为每个 Subject 补全评分者数据:');
        const adjustedSubjectGroups = new Map<string, RatingData[]>();

        for (const [subjectKey, originalRatings] of subjectGroups.entries()) {
            console.log(`\n处理 Subject: ${subjectKey}`);

            // 检查当前 Subject 中有哪些评分者
            const currentRaters = new Set(originalRatings.map(r => r.annotatorId));
            console.log(`  现有评分者: ${Array.from(currentRaters).join(', ')}`);

            const adjustedRatings: RatingData[] = [];

            // 为每个最终评分者确保有数据
            for (const raterId of finalRaters) {
                const existingRating = originalRatings.find(r => r.annotatorId === raterId);

                if (existingRating) {
                    // 该评分者已有数据，直接使用
                    adjustedRatings.push(existingRating);
                    console.log(`  ✅ ${raterId}: 已有数据，选择 ${existingRating.winner}`);
                } else {
                    // 该评分者没有数据，需要复制一个现有评分者的数据
                    const templateRating = originalRatings[0]; // 使用第一个评分者作为模板
                    if (templateRating) {
                        const syntheticRating: RatingData = {
                            ...templateRating,
                            annotatorId: raterId
                        };
                        adjustedRatings.push(syntheticRating);
                        console.log(`  🔧 ${raterId}: 缺少数据，复制自 ${templateRating.annotatorId}，选择 ${templateRating.winner}`);
                    }
                }
            }

            // 验证结果
            const finalUniqueRaters = new Set(adjustedRatings.map(r => r.annotatorId));
            if (finalUniqueRaters.size === targetRaters && adjustedRatings.length === targetRaters) {
                adjustedSubjectGroups.set(subjectKey, adjustedRatings);
                console.log(`  ✅ Subject 调整完成: ${finalUniqueRaters.size} 个评分者`);
            } else {
                console.log(`  ❌ Subject 调整失败: ${finalUniqueRaters.size} 个评分者，${adjustedRatings.length} 条记录`);
            }
        }

        console.log('\n调整后 Subjects:');
        for (const [subjectKey, ratings] of adjustedSubjectGroups.entries()) {
            const uniqueRaters = new Set(ratings.map(r => r.annotatorId));
            const aCount = ratings.filter(r => r.winner === 'A').length;
            const bCount = ratings.filter(r => r.winner === 'B').length;
            const tieCount = ratings.filter(r => r.winner === 'tie').length;
            console.log(`  ✅ ${subjectKey}: ${uniqueRaters.size} 个评分者 [A:${aCount}, B:${bCount}, Tie:${tieCount}]`);
        }

        // 将调整后的数据合并为一个数组
        const adjustedQuestionnaireRatings: RatingData[] = [];
        for (const ratings of adjustedSubjectGroups.values()) {
            adjustedQuestionnaireRatings.push(...ratings);
        }

        console.log(`最终结果: ${subjectGroups.size} -> ${adjustedSubjectGroups.size} 个 Subjects`);
        console.log(`评分数据: ${questionnaireRatings.length} -> ${adjustedQuestionnaireRatings.length} 条记录`);
        console.log(`最终评分者: ${finalRaters.join(', ')}`);

        // 如果调整后没有数据，跳过这个问卷
        if (adjustedSubjectGroups.size === 0) {
            console.log(`⚠️ 问卷 ${questionnaireId} 调整后没有有效的 Subjects，跳过计算`);
            continue;
        }

        // Calculate overall kappa for this questionnaire (using adjusted data)
        const questionnaireKappa = calculateQuestionnaireOverallKappa(
            questionnaireId,
            adjustedQuestionnaireRatings
        );

        // Calculate preference strength across all adjusted ratings in this questionnaire
        const preferenceStrength = calculatePreferenceStrength(adjustedQuestionnaireRatings);

        // Create "questionnaire kappa scores" - one entry per questionnaire
        const questionKappaScores = [{
            questionId: questionnaireId, // Using questionnaireId as identifier
            kappa: questionnaireKappa.kappa,
            raters: questionnaireKappa.raters,
            categories: {
                A: adjustedQuestionnaireRatings.filter(r => r.winner === 'A').length,
                B: adjustedQuestionnaireRatings.filter(r => r.winner === 'B').length,
                tie: adjustedQuestionnaireRatings.filter(r => r.winner === 'tie').length
            }
        }];

        results.push({
            dimensionId: `questionnaire_overall`, // 标识这是问卷整体分析
            dimensionLabel: `${questionnaireId} - ${adjustedSubjectGroups.size} Subjects`,
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