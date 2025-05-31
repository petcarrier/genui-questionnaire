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
 * Check if user note contains content from the description
 * @param note - The evaluation note to check
 * @param description - The dimension description to compare against
 * @returns true if note contains description content
 */
function containsDescriptionContent(note: string, description: string): boolean {
    const cleanNote = note.toLowerCase().trim();
    const cleanDescription = description.toLowerCase();

    // Split description into meaningful phrases (3+ words)
    const descriptionPhrases = cleanDescription
        .replace(/\[better\]|\[weaker\]|\n/gi, ' ')
        .split(/[.!?;:]/)
        .map(phrase => phrase.trim())
        .filter(phrase => phrase.length > 10 && phrase.split(/\s+/).length >= 3);

    // Check if any significant phrase from description appears in the note
    for (const phrase of descriptionPhrases) {
        if (cleanNote.includes(phrase)) {
            return true;
        }
    }

    // Check for word sequences (3+ consecutive words from description)
    const descriptionWords = cleanDescription
        .replace(/\[better\]|\[weaker\]|\n/gi, ' ')
        .split(/\s+/)
        .filter(word => word.length > 2);

    const noteWords = cleanNote.split(/\s+/);

    for (let i = 0; i <= descriptionWords.length - 3; i++) {
        const sequence = descriptionWords.slice(i, i + 3).join(' ');
        const noteText = noteWords.join(' ');

        if (noteText.includes(sequence)) {
            return true;
        }
    }

    return false;
}

/**
 * Validates the quality of evaluation notes
 * @param note - The evaluation note to validate
 * @param description - The dimension description to compare against
 * @returns Validation result with status, error message, and word count
 */
export function validateEvaluationNote(note: string, description?: string): EvaluationNoteValidation {
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

    // Check if note contains description content
    if (description && containsDescriptionContent(trimmedNote, description)) {
        return {
            isValid: false,
            error: 'Please write your own evaluation rather than copying from the dimension description',
            wordCount
        };
    }

    return { isValid: true, wordCount };
}

/**
 * Check if two evaluation notes are too similar
 * @param note1 - First note to compare
 * @param note2 - Second note to compare
 * @returns true if notes are too similar
 */
export function areNotesTooSimilar(note1: string, note2: string): boolean {
    const trimmed1 = note1.trim().toLowerCase();
    const trimmed2 = note2.trim().toLowerCase();

    // If either note is empty, they're not similar
    if (!trimmed1 || !trimmed2) {
        return false;
    }

    // Exact match
    if (trimmed1 === trimmed2) {
        return true;
    }

    // Check similarity by word overlap
    const words1 = new Set(trimmed1.split(/\s+/).filter(word => word.length > 2));
    const words2 = new Set(trimmed2.split(/\s+/).filter(word => word.length > 2));

    if (words1.size === 0 || words2.size === 0) {
        return false;
    }

    const intersection = new Set([...words1].filter(word => words2.has(word)));
    const similarity = intersection.size / Math.min(words1.size, words2.size);

    // Consider similar if more than 80% of words overlap
    return similarity > 0.8;
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
    dimensions: Array<{ id: string; label: string; description?: string }>
): EvaluationValidationError[] {
    const errors: EvaluationValidationError[] = [];

    dimensions.forEach(dimension => {
        const evaluation = evaluations.find(e => e.dimensionId === dimension.id);

        // Check if winner is selected
        if (!evaluation || !evaluation.winner || evaluation.winner === '') {
            errors.push({
                dimensionId: dimension.id,
                dimensionLabel: dimension.label,
                error: 'Please select a winner for this dimension'
            });
        } else {
            // Check note validation
            const noteValidation = validateEvaluationNote(evaluation.notes || '', dimension.description);
            if (!noteValidation.isValid) {
                errors.push({
                    dimensionId: dimension.id,
                    dimensionLabel: dimension.label,
                    error: noteValidation.error || 'Invalid evaluation reason'
                });
            }
        }
    });

    // Check for duplicate/similar evaluation notes
    const validEvaluations = evaluations.filter(e => e.notes && e.notes.trim().length > 0);

    for (let i = 0; i < validEvaluations.length; i++) {
        for (let j = i + 1; j < validEvaluations.length; j++) {
            const eval1 = validEvaluations[i];
            const eval2 = validEvaluations[j];

            if (areNotesTooSimilar(eval1.notes || '', eval2.notes || '')) {
                const dimension1 = dimensions.find(d => d.id === eval1.dimensionId);
                const dimension2 = dimensions.find(d => d.id === eval2.dimensionId);

                // Add error to both dimensions
                const errorMessage = `Evaluation reason is too similar to "${dimension2?.label || 'another dimension'}". Please provide unique explanations for each dimension.`;

                // Check if error already exists for this dimension
                const existingError = errors.find(e => e.dimensionId === eval1.dimensionId && e.error.includes('too similar'));
                if (!existingError) {
                    errors.push({
                        dimensionId: eval1.dimensionId,
                        dimensionLabel: dimension1?.label || 'Unknown',
                        error: errorMessage
                    });
                }

                const errorMessage2 = `Evaluation reason is too similar to "${dimension1?.label || 'another dimension'}". Please provide unique explanations for each dimension.`;
                const existingError2 = errors.find(e => e.dimensionId === eval2.dimensionId && e.error.includes('too similar'));
                if (!existingError2) {
                    errors.push({
                        dimensionId: eval2.dimensionId,
                        dimensionLabel: dimension2?.label || 'Unknown',
                        error: errorMessage2
                    });
                }
            }
        }
    }

    return errors;
} 