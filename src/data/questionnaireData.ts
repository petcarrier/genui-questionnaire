import { QuestionnaireQuestion, EVALUATION_DIMENSIONS } from '@/types/questionnaire';
import promptsUrls from './prompts_urls.json';

interface PromptsUrlItem {
    uuid: string;
    prompt: string;
    link1: string;
    link2: string;
}

// Group data by prompt (userQuery), with 6 comparisons per group
function groupDataByPrompt(data: PromptsUrlItem[]): Map<string, PromptsUrlItem[]> {
    const grouped = new Map<string, PromptsUrlItem[]>();

    data.forEach(item => {
        if (!grouped.has(item.prompt)) {
            grouped.set(item.prompt, []);
        }
        grouped.get(item.prompt)!.push(item);
    });

    return grouped;
}

// Generate questionnaire questions from grouped data
function generateQuestions(): QuestionnaireQuestion[] {
    const groupedData = groupDataByPrompt(promptsUrls as PromptsUrlItem[]);
    const questions: QuestionnaireQuestion[] = [];

    groupedData.forEach((comparisons, userQuery) => {
        comparisons.forEach((comparison, index) => {
            // Extract title from URL (use the unique ID part)
            const getTitleFromUrl = (url: string) => {
                const parts = url.split('/');
                const lastPart = parts[parts.length - 1];
                return lastPart.replace('.html', '');
            };

            const question: QuestionnaireQuestion = {
                id: comparison.uuid,
                linkA: {
                    id: 'A',
                    url: comparison.link1,
                    title: `Example A: ${getTitleFromUrl(comparison.link1)}`,
                    description: "Open the link in browser. See UI and copy verification code"
                },
                linkB: {
                    id: 'B',
                    url: comparison.link2,
                    title: `Example B: ${getTitleFromUrl(comparison.link2)}`,
                    description: "Open the link in browser. See UI and copy verification code"
                },
                dimensions: EVALUATION_DIMENSIONS,
                userQuery: userQuery
            };

            questions.push(question);
        });
    });

    return questions;
}

export const QUESTIONNAIRE_QUESTIONS = generateQuestions();

// Get unique user queries for navigation
export const USER_QUERIES = Array.from(
    new Set((promptsUrls as PromptsUrlItem[]).map(item => item.prompt))
);

// Get questions by user query
export function getQuestionsByUserQuery(userQuery: string): QuestionnaireQuestion[] {
    return QUESTIONNAIRE_QUESTIONS.filter(q => q.userQuery === userQuery);
}