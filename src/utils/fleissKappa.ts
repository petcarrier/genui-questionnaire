/**
 * Fleiss' Kappa Calculator for Inter-rater Reliability
 * Used to calculate agreement between multiple raters on categorical data
 */

import { fleissKappa, interpretFleissKappa as interpretKappaCore, fleissKappaDetailed } from './fleissKappaCore';

export interface RatingData {
    questionId: string;
    dimensionId: string;
    annotatorId: string;
    winner: 'A' | 'B' | 'tie';
    questionnaireId?: string;
}

export interface KappaResult {
    kappa: number;
    interpretation: 'poor' | 'slight' | 'fair' | 'moderate' | 'substantial' | 'almost_perfect';
    raters: number;
    subjects: number;
    categories: {
        A: number;
        B: number;
        tie: number;
    };
}

export interface QuestionKappaResult extends KappaResult {
    questionId: string;
}

export interface DimensionKappaResult {
    dimensionId: string;
    questionnaireId: string;
    kappa: number;
    interpretation: 'poor' | 'slight' | 'fair' | 'moderate' | 'substantial' | 'almost_perfect';
    raters: number;
    subjects: number;
    questionResults?: QuestionKappaResult[];
}

/**
 * Convert RatingData to matrix format for fleissKappa calculation
 */
function convertRatingDataToMatrix(ratings: RatingData[]): {
    matrix: number[][];
    subjectKeys: string[];
    annotators: Set<string>;
} {
    // Group by subject (questionId + dimensionId)
    const subjectMap = new Map<string, RatingData[]>();
    const annotators = new Set<string>();

    for (const rating of ratings) {
        const subjectKey = `${rating.questionId}_${rating.dimensionId}`;
        if (!subjectMap.has(subjectKey)) {
            subjectMap.set(subjectKey, []);
        }
        subjectMap.get(subjectKey)!.push(rating);
        annotators.add(rating.annotatorId);
    }

    // Convert to matrix format
    const matrix: number[][] = [];
    const subjectKeys: string[] = [];

    for (const [subjectKey, subjectRatings] of subjectMap.entries()) {
        const row = [0, 0, 0]; // [A, B, tie]
        for (const rating of subjectRatings) {
            if (rating.winner === 'A') row[0]++;
            else if (rating.winner === 'B') row[1]++;
            else if (rating.winner === 'tie') row[2]++;
        }
        matrix.push(row);
        subjectKeys.push(subjectKey);
    }

    return { matrix, subjectKeys, annotators };
}

/**
 * Interpret Fleiss' kappa value according to simplified classification
 */
export function interpretKappa(kappa: number): 'poor' | 'slight' | 'fair' | 'moderate' | 'substantial' | 'almost_perfect' {
    if (kappa >= 0.8) return 'almost_perfect'; // High Agreement
    if (kappa >= 0.6) return 'substantial'; // Moderate Agreement  
    return 'poor'; // Low Agreement (covers all < 0.6)
}

/**
 * Calculate Fleiss' kappa for multiple questions (subjects) across multiple raters
 * @param ratings Array of ratings for multiple questions in a dimension
 * @returns KappaResult object with kappa score and related metrics
 */
export function calculateMultipleSubjectsKappa(ratings: RatingData[]): KappaResult {
    if (ratings.length === 0) {
        return {
            kappa: 0,
            interpretation: 'poor',
            raters: 0,
            subjects: 0,
            categories: { A: 0, B: 0, tie: 0 }
        };
    }

    console.log('=== Fleiss Kappa 计算开始 ===');
    console.log('输入评分数据:');
    console.table(ratings);

    // Convert to matrix format
    const { matrix, subjectKeys, annotators } = convertRatingDataToMatrix(ratings);
    const n = annotators.size; // number of raters
    const N = matrix.length; // number of subjects

    console.log('基本信息:');
    console.log('- Subject数量 (问题_维度组合):', N);
    console.log('- 评分者数量 (raters):', n);
    console.log('- Subject列表:', subjectKeys);
    console.log('- 评分者ID列表:', Array.from(annotators));

    // 验证每个 Subject 的评分者数量
    console.log('\n验证每个 Subject 的评分者数量:');
    const subjectRaterCheck = new Map<string, Set<string>>();
    for (const rating of ratings) {
        const subjectKey = `${rating.questionId}_${rating.dimensionId}`;
        if (!subjectRaterCheck.has(subjectKey)) {
            subjectRaterCheck.set(subjectKey, new Set());
        }
        subjectRaterCheck.get(subjectKey)!.add(rating.annotatorId);
    }

    let hasInconsistentRaters = false;
    for (const [subjectKey, raters] of subjectRaterCheck.entries()) {
        console.log(`  ${subjectKey}: ${raters.size} 个评分者`);
        if (raters.size !== n) {
            console.log(`    ⚠️ 警告: Subject ${subjectKey} 的评分者数量 (${raters.size}) 与总评分者数量 (${n}) 不一致`);
            hasInconsistentRaters = true;
        }
    }

    if (hasInconsistentRaters) {
        console.log('⚠️ 发现评分者数量不一致的 Subject，这可能影响 Kappa 计算的准确性');
    }

    if (n < 2 || N === 0) {
        console.log('⚠️ 数据不足，无法计算 Kappa（需要至少2个评分者）');
        return {
            kappa: 0,
            interpretation: 'poor',
            raters: n,
            subjects: N,
            categories: { A: 0, B: 0, tie: 0 }
        };
    }

    console.log('\n评分矩阵（每行是一个Subject，每列是A/B/Tie的评分数量）:');
    matrix.forEach((row, i) => {
        const total = row[0] + row[1] + row[2];
        console.log(`Subject ${subjectKeys[i]}: [A:${row[0]}, B:${row[1]}, Tie:${row[2]}] (总计:${total})`);
    });

    try {
        // Use the new core implementation
        const detailed = fleissKappaDetailed(matrix);

        console.log('\n计算结果:');
        console.log(`观察一致性 (Po): ${detailed.observedAgreement.toFixed(4)}`);
        console.log(`期望一致性 (Pe): ${detailed.expectedAgreement.toFixed(4)}`);
        console.log(`类别比例: A=${detailed.categoryProportions[0].toFixed(4)}, B=${detailed.categoryProportions[1].toFixed(4)}, Tie=${detailed.categoryProportions[2].toFixed(4)}`);
        console.log(`Fleiss' Kappa = ${detailed.kappa.toFixed(4)}`);
        console.log('=== Fleiss Kappa 计算结束 ===\n');

        // Count total ratings for each category
        const categoryCounts = { A: 0, B: 0, tie: 0 };
        for (const row of matrix) {
            categoryCounts.A += row[0];
            categoryCounts.B += row[1];
            categoryCounts.tie += row[2];
        }

        return {
            kappa: detailed.kappa,
            interpretation: interpretKappa(detailed.kappa),
            raters: detailed.raters,
            subjects: detailed.subjects,
            categories: categoryCounts
        };
    } catch (error) {
        console.error('Kappa 计算出错:', error);
        return {
            kappa: 0,
            interpretation: 'poor',
            raters: n,
            subjects: N,
            categories: { A: 0, B: 0, tie: 0 }
        };
    }
}

/**
 * Calculate Fleiss' kappa for a questionnaire's dimension
 * @param questionnaireId The questionnaire ID
 * @param dimensionId The dimension ID
 * @param ratings Array of all ratings for this questionnaire and dimension
 * @returns DimensionKappaResult with kappa score and metrics
 */
export function calculateQuestionnaireDimensionKappa(
    questionnaireId: string,
    dimensionId: string,
    ratings: RatingData[]
): DimensionKappaResult {
    const kappaResult = calculateMultipleSubjectsKappa(ratings);

    return {
        dimensionId,
        questionnaireId,
        kappa: kappaResult.kappa,
        interpretation: kappaResult.interpretation,
        raters: kappaResult.raters,
        subjects: kappaResult.subjects
    };
}

/**
 * Group rating data by questionnaire and dimension for kappa calculation
 * @param ratings Array of all rating data
 * @returns Map with questionnaire -> dimension -> ratings structure
 */
export function groupRatingsByQuestionnaire(ratings: RatingData[]): Map<string, Map<string, RatingData[]>> {
    console.log('=== 数据分组开始 ===');
    console.log('输入评分数据总数:', ratings.length);

    const grouped = new Map<string, Map<string, RatingData[]>>();

    for (const rating of ratings) {
        const questionnaireId = rating.questionnaireId || 'unknown';

        if (!grouped.has(questionnaireId)) {
            grouped.set(questionnaireId, new Map());
            console.log(`新建问卷分组: ${questionnaireId}`);
        }

        const dimensionMap = grouped.get(questionnaireId)!;
        if (!dimensionMap.has(rating.dimensionId)) {
            dimensionMap.set(rating.dimensionId, []);
            console.log(`  - 新建维度分组: ${rating.dimensionId}`);
        }

        dimensionMap.get(rating.dimensionId)!.push(rating);
    }

    console.log('\n分组结果统计:');
    for (const [questionnaireId, dimensionMap] of grouped.entries()) {
        console.log(`问卷 ${questionnaireId}:`);
        for (const [dimensionId, ratingList] of dimensionMap.entries()) {
            const uniqueQuestions = new Set(ratingList.map(r => r.questionId)).size;
            const uniqueAnnotators = new Set(ratingList.map(r => r.annotatorId)).size;
            console.log(`  维度 ${dimensionId}: ${ratingList.length} 条评分, ${uniqueQuestions} 个问题, ${uniqueAnnotators} 个评分者`);

            // 显示每个问题的评分情况
            const questionGroups = new Map<string, RatingData[]>();
            for (const rating of ratingList) {
                if (!questionGroups.has(rating.questionId)) {
                    questionGroups.set(rating.questionId, []);
                }
                questionGroups.get(rating.questionId)!.push(rating);
            }

            for (const [questionId, questionRatings] of questionGroups.entries()) {
                const aCount = questionRatings.filter(r => r.winner === 'A').length;
                const bCount = questionRatings.filter(r => r.winner === 'B').length;
                const tieCount = questionRatings.filter(r => r.winner === 'tie').length;
                console.log(`    问题 ${questionId}: A=${aCount}, B=${bCount}, Tie=${tieCount}`);
            }
        }
    }
    console.log('=== 数据分组结束 ===\n');

    return grouped;
}

// Keep old functions for backward compatibility but mark as deprecated
/**
 * @deprecated Use calculateMultipleSubjectsKappa instead
 */
export function calculateQuestionKappa(ratings: RatingData[]): QuestionKappaResult {
    if (ratings.length === 0) {
        return {
            questionId: '',
            kappa: 0,
            interpretation: 'poor',
            raters: 0,
            subjects: 0,
            categories: { A: 0, B: 0, tie: 0 }
        };
    }

    const questionId = ratings[0].questionId;
    const raters = new Set(ratings.map(r => r.annotatorId)).size;
    const subjects = 1; // For a single question

    // Count ratings for each category
    const categoryCounts = {
        A: ratings.filter(r => r.winner === 'A').length,
        B: ratings.filter(r => r.winner === 'B').length,
        tie: ratings.filter(r => r.winner === 'tie').length
    };

    // Total ratings should equal number of raters
    const totalRatings = Object.values(categoryCounts).reduce((sum, count) => sum + count, 0);

    if (totalRatings !== raters || raters < 2) {
        return {
            questionId,
            kappa: 0,
            interpretation: 'poor',
            raters,
            subjects,
            categories: categoryCounts
        };
    }

    try {
        // Create matrix for single subject
        const matrix = [[categoryCounts.A, categoryCounts.B, categoryCounts.tie]];
        const kappa = fleissKappa(matrix);

        return {
            questionId,
            kappa,
            interpretation: interpretKappa(kappa),
            raters,
            subjects,
            categories: categoryCounts
        };
    } catch (error) {
        return {
            questionId,
            kappa: 0,
            interpretation: 'poor',
            raters,
            subjects,
            categories: categoryCounts
        };
    }
}

/**
 * @deprecated Use calculateQuestionnaireDimensionKappa instead
 */
export function calculateDimensionKappa(
    dimensionId: string,
    ratingsByQuestion: RatingData[][]
): DimensionKappaResult {
    if (ratingsByQuestion.length === 0) {
        return {
            dimensionId,
            questionnaireId: 'unknown',
            kappa: 0,
            interpretation: 'poor',
            raters: 0,
            subjects: 0,
            questionResults: []
        };
    }

    // Calculate kappa for each question
    const questionResults = ratingsByQuestion.map(questionRatings =>
        calculateQuestionKappa(questionRatings)
    );

    // Calculate unweighted average kappa across all questions
    const validResults = questionResults.filter(result =>
        result.raters >= 2 && !isNaN(result.kappa) && isFinite(result.kappa)
    );

    if (validResults.length === 0) {
        return {
            dimensionId,
            questionnaireId: 'unknown',
            kappa: 0,
            interpretation: 'poor',
            raters: 0,
            subjects: validResults.length,
            questionResults
        };
    }

    const avgKappa = validResults.reduce((sum, result) => sum + result.kappa, 0) / validResults.length;

    return {
        dimensionId,
        questionnaireId: 'unknown',
        kappa: isNaN(avgKappa) || !isFinite(avgKappa) ? 0 : Math.max(-1, Math.min(1, avgKappa)),
        interpretation: interpretKappa(isNaN(avgKappa) || !isFinite(avgKappa) ? 0 : avgKappa),
        raters: validResults[0]?.raters || 0,
        subjects: validResults.length,
        questionResults
    };
}

/**
 * @deprecated Use groupRatingsByQuestionnaire instead
 */
export function groupRatingsForKappa(ratings: RatingData[]): Map<string, Map<string, RatingData[]>> {
    const grouped = new Map<string, Map<string, RatingData[]>>();

    for (const rating of ratings) {
        if (!grouped.has(rating.dimensionId)) {
            grouped.set(rating.dimensionId, new Map());
        }

        const dimensionMap = grouped.get(rating.dimensionId)!;
        if (!dimensionMap.has(rating.questionId)) {
            dimensionMap.set(rating.questionId, []);
        }

        dimensionMap.get(rating.questionId)!.push(rating);
    }

    return grouped;
}

/**
 * Calculate Fleiss' kappa for an entire questionnaire (all dimensions combined)
 * @param questionnaireId The questionnaire ID
 * @param ratings Array of all ratings for this questionnaire across all dimensions
 * @returns KappaResult with kappa score and metrics
 */
export function calculateQuestionnaireOverallKappa(
    questionnaireId: string,
    ratings: RatingData[]
): { questionnaireId: string; kappa: number; interpretation: string; raters: number; subjects: number; totalRatings: number } {
    console.log(`=== 计算问卷 ${questionnaireId} 的整体 Kappa ===`);

    const kappaResult = calculateMultipleSubjectsKappa(ratings);

    console.log(`问卷 ${questionnaireId} 整体结果: Kappa = ${kappaResult.kappa.toFixed(4)}, 解释 = ${kappaResult.interpretation}`);

    return {
        questionnaireId,
        kappa: kappaResult.kappa,
        interpretation: kappaResult.interpretation,
        raters: kappaResult.raters,
        subjects: kappaResult.subjects,
        totalRatings: ratings.length
    };
}

/**
 * Group rating data by questionnaire only (combine all dimensions)
 * @param ratings Array of all rating data
 * @returns Map with questionnaire -> all ratings (regardless of dimension)
 */
export function groupRatingsByQuestionnaireOnly(ratings: RatingData[]): Map<string, RatingData[]> {
    console.log('=== 按问卷整体分组（不分维度）===');
    console.log('输入评分数据总数:', ratings.length);

    const grouped = new Map<string, RatingData[]>();

    for (const rating of ratings) {
        const questionnaireId = rating.questionnaireId || 'unknown';

        if (!grouped.has(questionnaireId)) {
            grouped.set(questionnaireId, []);
            console.log(`新建问卷分组: ${questionnaireId}`);
        }

        grouped.get(questionnaireId)!.push(rating);
    }

    console.log('\n问卷整体分组结果:');
    for (const [questionnaireId, ratingList] of grouped.entries()) {
        const uniqueQuestions = new Set(ratingList.map(r => r.questionId)).size;
        const uniqueAnnotators = new Set(ratingList.map(r => r.annotatorId)).size;
        const uniqueDimensions = new Set(ratingList.map(r => r.dimensionId)).size;
        console.log(`问卷 ${questionnaireId}: ${ratingList.length} 条评分, ${uniqueQuestions} 个问题, ${uniqueDimensions} 个维度, ${uniqueAnnotators} 个评分者`);

        // 按 questionId + dimensionId 组合来显示评分矩阵
        const questionDimensionGroups = new Map<string, RatingData[]>();
        for (const rating of ratingList) {
            const key = `${rating.questionId}_${rating.dimensionId}`;
            if (!questionDimensionGroups.has(key)) {
                questionDimensionGroups.set(key, []);
            }
            questionDimensionGroups.get(key)!.push(rating);
        }

        console.log('  评分详情（问题_维度）:');
        for (const [key, questionRatings] of questionDimensionGroups.entries()) {
            const aCount = questionRatings.filter(r => r.winner === 'A').length;
            const bCount = questionRatings.filter(r => r.winner === 'B').length;
            const tieCount = questionRatings.filter(r => r.winner === 'tie').length;
            console.log(`    ${key}: A=${aCount}, B=${bCount}, Tie=${tieCount}`);
        }
    }
    console.log('=== 问卷整体分组结束 ===\n');

    return grouped;
} 