// Validation constants for evaluation notes
export const MIN_WORDS_REQUIRED = 5;

export const MEANINGLESS_PATTERNS = [
    /^(good|bad|ok|fine|nice|great|terrible|awful|poor|excellent|amazing)(\s|\.)*$/i,
    /^(a+|b+|x+|test|testing|asdf|qwerty|1234|abc|zzz)(\s|\.)*$/i,
    /^(.)\1{4,}$/,  // Repeated characters
    /^(no|yes|maybe|idk|dunno|whatever)(\s|\.)*$/i
];

export interface EvaluationNoteValidation {
    isValid: boolean;
    error?: string;
    wordCount: number;
}

/**
 * Validates the quality of evaluation notes
 * @param note - The evaluation note to validate
 * @returns Validation result with status, error message, and word count
 */
export function validateEvaluationNote(note: string): EvaluationNoteValidation {
    const trimmedNote = note.trim();
    const wordCount = trimmedNote.split(/\s+/).filter(word => word.length > 0).length;

    if (!note || trimmedNote.length === 0) {
        return { isValid: false, error: 'Evaluation reason is required', wordCount: 0 };
    }

    if (wordCount < MIN_WORDS_REQUIRED) {
        return {
            isValid: false,
            error: `Please provide at least ${MIN_WORDS_REQUIRED} words in your evaluation`,
            wordCount
        };
    }

    // Check for meaningless content
    const isMeaningless = MEANINGLESS_PATTERNS.some(pattern => pattern.test(trimmedNote));
    if (isMeaningless) {
        return {
            isValid: false,
            error: 'Please provide a meaningful evaluation explanation',
            wordCount
        };
    }

    // Check if it's too repetitive (more than 50% repeated words)
    const words = trimmedNote.toLowerCase().split(/\s+/);
    const uniqueWords = new Set(words);
    if (words.length > 3 && (uniqueWords.size / words.length) < 0.5) {
        return {
            isValid: false,
            error: 'Please provide a more detailed and varied explanation',
            wordCount
        };
    }

    return { isValid: true, wordCount };
}

export interface EvaluationValidationError {
    dimensionId: string;
    dimensionLabel: string;
    error: string;
}

/**
 * Gets validation errors for all dimension evaluations
 * @param evaluations - Array of dimension evaluations
 * @param dimensions - Array of evaluation dimensions
 * @returns Array of validation errors
 */
export function getEvaluationValidationErrors(
    evaluations: Array<{ dimensionId: string; winner?: string; notes?: string }>,
    dimensions: Array<{ id: string; label: string }>
): EvaluationValidationError[] {
    const errors: EvaluationValidationError[] = [];

    dimensions.forEach(dimension => {
        const evaluation = evaluations.find(e => e.dimensionId === dimension.id);

        if (!evaluation || !evaluation.winner) {
            errors.push({
                dimensionId: dimension.id,
                dimensionLabel: dimension.label,
                error: 'Please select a winner for this dimension'
            });
        } else {
            const noteValidation = validateEvaluationNote(evaluation.notes || '');
            if (!noteValidation.isValid) {
                errors.push({
                    dimensionId: dimension.id,
                    dimensionLabel: dimension.label,
                    error: noteValidation.error || 'Invalid evaluation reason'
                });
            }
        }
    });

    return errors;
} 