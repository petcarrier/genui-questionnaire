import trapQuestions from '@/data/trapQuestions.json';

/**
 * Check if a question is a trap question
 * @param questionId - The question ID to check
 * @returns true if the question is a trap question, false otherwise
 */
export function isTrapQuestion(questionId: string): boolean {
    const trapQuestionIds = new Set<string>();
    trapQuestions.forEach(group => {
        group.items.forEach(item => {
            trapQuestionIds.add(item.uuid);
        });
    });
    return trapQuestionIds.has(questionId);
}

/**
 * Get all trap question IDs as a Set
 * @returns Set containing all trap question IDs
 */
export function getTrapQuestionIds(): Set<string> {
    const trapQuestionIds = new Set<string>();
    trapQuestions.forEach(group => {
        group.items.forEach(item => {
            trapQuestionIds.add(item.uuid);
        });
    });
    return trapQuestionIds;
}

/**
 * Get trap type mapping (questionId -> groupId)
 * @returns Map containing trap question ID to trap type mapping
 */
export function getTrapTypeMap(): Map<string, string> {
    const trapTypeMap = new Map<string, string>();
    trapQuestions.forEach(group => {
        group.items.forEach(item => {
            trapTypeMap.set(item.uuid, group.groupId);
        });
    });
    return trapTypeMap;
} 