import { QuestionnaireQuestion, EVALUATION_DIMENSIONS } from '@/types/questionnaire';
import groupedPromptsData from './grouped_prompts.json';

interface PromptsUrlItem {
    uuid: string;
    prompt: string;
    link1: string;
    link2: string;
}

interface GroupedPrompt {
    groupId: string;
    prompt: string;
    itemCount: number;
    items: PromptsUrlItem[];
}

const groupedPrompts = groupedPromptsData as GroupedPrompt[];

// Generate questionnaire questions from grouped data
function generateQuestions(): QuestionnaireQuestion[] {
    const questions: QuestionnaireQuestion[] = [];

    groupedPrompts.forEach(group => {
        // Use the existing groupId as taskGroupId
        const taskGroupId = group.groupId;

        group.items.forEach(comparison => {
            const question: QuestionnaireQuestion = {
                id: comparison.uuid,
                taskGroupId: taskGroupId,
                linkA: {
                    id: 'A',
                    url: comparison.link1,
                    title: "Example A",
                    description: "Open the link in browser. See UI and copy verification code"
                },
                linkB: {
                    id: 'B',
                    url: comparison.link2,
                    title: "Example B",
                    description: "Open the link in browser. See UI and copy verification code"
                },
                dimensions: EVALUATION_DIMENSIONS,
                userQuery: comparison.prompt
            };

            questions.push(question);
        });
    });

    return questions;
}

export const QUESTIONNAIRE_QUESTIONS = generateQuestions();

// Get unique user queries for navigation
export const USER_QUERIES = Array.from(
    new Set(groupedPrompts.map(group => group.prompt))
);

// Get questions by user query
export function getQuestionsByUserQuery(userQuery: string): QuestionnaireQuestion[] {
    return QUESTIONNAIRE_QUESTIONS.filter(q => q.userQuery === userQuery);
}

// Get task group ID for a user query
export function getTaskGroupIdByUserQuery(userQuery: string): string {
    const group = groupedPrompts.find(g => g.prompt === userQuery);
    if (!group) {
        throw new Error(`Group not found for user query: ${userQuery}`);
    }
    return group.groupId;
}