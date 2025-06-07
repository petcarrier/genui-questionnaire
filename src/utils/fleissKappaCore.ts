/**
 * Pure Fleiss' Kappa implementation
 * Similar to Python's statsmodels.stats.inter_rater.fleiss_kappa
 */

/**
 * Calculate Fleiss' Kappa for inter-rater reliability
 * 
 * @param data - A 2D array where:
 *   - Each row represents a subject/item being rated
 *   - Each column represents the count of raters who chose that category
 *   - data[i][j] = number of raters who assigned subject i to category j
 * 
 * @returns The Fleiss' Kappa coefficient (between -1 and 1)
 * 
 * @example
 * ```typescript
 * const data = [
 *   [0, 0, 14],  // 14 raters chose category 3 for subject 1
 *   [0, 2, 12],  // 2 chose category 2, 12 chose category 3 for subject 2
 *   [0, 6, 8],   // etc.
 *   [0, 3, 11],
 *   [0, 5, 9],
 *   [0, 2, 12],
 *   [0, 6, 8],
 *   [2, 2, 10],
 *   [6, 4, 4],
 *   [4, 2, 8]
 * ];
 * 
 * const kappa = fleissKappa(data);
 * console.log(`Fleiss' Kappa: ${kappa}`); // 0.210
 * ```
 */
export function fleissKappa(data: number[][]): number {
    if (data.length === 0 || data[0].length === 0) {
        throw new Error('Data matrix cannot be empty');
    }

    const N = data.length; // number of subjects
    const k = data[0].length; // number of categories

    // Validate that all rows have the same length
    if (!data.every(row => row.length === k)) {
        throw new Error('All rows must have the same number of columns');
    }

    // Get number of raters (should be consistent across all subjects)
    const n = data[0].reduce((sum, count) => sum + count, 0);

    // Validate that all subjects have the same number of raters
    for (let i = 0; i < N; i++) {
        const rowSum = data[i].reduce((sum, count) => sum + count, 0);
        if (rowSum !== n) {
            throw new Error(`Inconsistent number of raters. Subject ${i} has ${rowSum} raters, expected ${n}`);
        }
    }

    if (n < 2) {
        throw new Error('Need at least 2 raters to calculate Fleiss\' Kappa');
    }

    // Step 1: Calculate P_i (proportion of agreement for each subject)
    const P_i: number[] = [];

    for (let i = 0; i < N; i++) {
        let sumSquares = 0;
        for (let j = 0; j < k; j++) {
            sumSquares += data[i][j] * data[i][j];
        }
        P_i[i] = (sumSquares - n) / (n * (n - 1));
    }

    // Step 2: Calculate P_bar (mean of P_i)
    const P_bar = P_i.reduce((sum, p) => sum + p, 0) / N;

    // Step 3: Calculate p_j (proportion of all assignments to category j)
    const p_j: number[] = [];
    const totalAssignments = N * n;

    for (let j = 0; j < k; j++) {
        let columnSum = 0;
        for (let i = 0; i < N; i++) {
            columnSum += data[i][j];
        }
        p_j[j] = columnSum / totalAssignments;
    }

    // Step 4: Calculate P_e (expected agreement by chance)
    const P_e = p_j.reduce((sum, p) => sum + p * p, 0);

    // Step 5: Calculate Fleiss' Kappa
    if (P_e === 1) {
        // Perfect agreement case
        return 1;
    }

    const kappa = (P_bar - P_e) / (1 - P_e);

    // Ensure kappa is within valid range [-1, 1]
    return Math.max(-1, Math.min(1, kappa));
}

/**
 * Interpret Fleiss' Kappa value
 * Based on Landis & Koch (1977) guidelines
 */
export function interpretFleissKappa(kappa: number): string {
    if (kappa < 0) return 'Poor agreement (worse than chance)';
    if (kappa <= 0.20) return 'Slight agreement';
    if (kappa <= 0.40) return 'Fair agreement';
    if (kappa <= 0.60) return 'Moderate agreement';
    if (kappa <= 0.80) return 'Substantial agreement';
    return 'Almost perfect agreement';
}

/**
 * Convert rating data to matrix format for fleissKappa function
 * 
 * @param ratings - Array of ratings where each rating has:
 *   - subjectId: identifier for the subject being rated
 *   - raterId: identifier for the rater
 *   - category: the category assigned (string or number)
 * @returns Matrix suitable for fleissKappa function
 */
export function ratingsToMatrix<T extends string | number>(
    ratings: Array<{
        subjectId: string | number;
        raterId: string | number;
        category: T;
    }>
): { matrix: number[][], categories: T[] } {
    // Get unique subjects, raters, and categories
    const subjects = [...new Set(ratings.map(r => r.subjectId))];
    const raters = [...new Set(ratings.map(r => r.raterId))];
    const categories = [...new Set(ratings.map(r => r.category))].sort();

    // Initialize matrix
    const matrix: number[][] = subjects.map(() =>
        new Array(categories.length).fill(0)
    );

    // Fill matrix
    for (const rating of ratings) {
        const subjectIndex = subjects.indexOf(rating.subjectId);
        const categoryIndex = categories.indexOf(rating.category);
        if (subjectIndex !== -1 && categoryIndex !== -1) {
            matrix[subjectIndex][categoryIndex]++;
        }
    }

    return { matrix, categories };
}

/**
 * Calculate Fleiss' Kappa with detailed statistics
 */
export function fleissKappaDetailed(data: number[][]): {
    kappa: number;
    interpretation: string;
    subjects: number;
    raters: number;
    categories: number;
    observedAgreement: number;
    expectedAgreement: number;
    categoryProportions: number[];
} {
    const kappa = fleissKappa(data);
    const N = data.length;
    const k = data[0].length;
    const n = data[0].reduce((sum, count) => sum + count, 0);

    // Calculate observed agreement (P_bar)
    const P_i: number[] = [];
    for (let i = 0; i < N; i++) {
        let sumSquares = 0;
        for (let j = 0; j < k; j++) {
            sumSquares += data[i][j] * data[i][j];
        }
        P_i[i] = (sumSquares - n) / (n * (n - 1));
    }
    const P_bar = P_i.reduce((sum, p) => sum + p, 0) / N;

    // Calculate category proportions
    const p_j: number[] = [];
    const totalAssignments = N * n;
    for (let j = 0; j < k; j++) {
        let columnSum = 0;
        for (let i = 0; i < N; i++) {
            columnSum += data[i][j];
        }
        p_j[j] = columnSum / totalAssignments;
    }

    // Calculate expected agreement
    const P_e = p_j.reduce((sum, p) => sum + p * p, 0);

    return {
        kappa,
        interpretation: interpretFleissKappa(kappa),
        subjects: N,
        raters: n,
        categories: k,
        observedAgreement: P_bar,
        expectedAgreement: P_e,
        categoryProportions: p_j
    };
} 