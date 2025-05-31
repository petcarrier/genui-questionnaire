import { QuestionnaireQuestion, EVALUATION_DIMENSIONS } from '@/types/questionnaire';
import groupedPromptsData from './grouped_prompts.json';
import trapQuestionsData from './trapQuestions.json';
import preGeneratedGroups from './questionnaire_groups.json';
import urlScreenshotMapping from './url_screenshot_mapping_array.json';

interface PromptsUrlItem {
    uuid: string;
    prompt: string;
    link1: string;
    link2: string;
    verificationCodeA: string;
    verificationCodeB: string;
}

interface GroupedPrompt {
    groupId: string;
    prompt: string;
    itemCount: number;
    items: PromptsUrlItem[];
}

interface TrapQuestion {
    groupId: string;
    prompt: string;
    itemCount: number;
    items: PromptsUrlItem[];
}

const groupedPrompts = groupedPromptsData as GroupedPrompt[];
const trapQuestions = trapQuestionsData as TrapQuestion[];

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
                    description: "Please open or preview the page to view its content. Click either the “Preview” button or the “Open in New Tab” button. The system will record how long you spend viewing.",
                    verificationCode: comparison.verificationCodeA,
                    screenshotUrl: getScreenshotByUrl(comparison.link1)
                },
                linkB: {
                    id: 'B',
                    url: comparison.link2,
                    title: "Example B",
                    description: "Please open or preview the page to view its content. Click either the “Preview” button or the “Open in New Tab” button. The system will record how long you spend viewing.",
                    verificationCode: comparison.verificationCodeB,
                    screenshotUrl: getScreenshotByUrl(comparison.link2)
                },
                dimensions: EVALUATION_DIMENSIONS,
                userQuery: comparison.prompt
            };

            questions.push(question);
        });
    });

    return questions;
}

// Generate trap questions
function generateTrapQuestions(): QuestionnaireQuestion[] {
    const questions: QuestionnaireQuestion[] = [];

    trapQuestions.forEach(group => {
        const taskGroupId = group.groupId;

        group.items.forEach(comparison => {
            const question: QuestionnaireQuestion = {
                id: comparison.uuid,
                taskGroupId: taskGroupId,
                linkA: {
                    id: 'A',
                    url: comparison.link1,
                    title: "Example A",
                    description: "Please open or preview the page to view its content. Click either the “Preview” button or the “Open in New Tab” button. The system will record how long you spend viewing.",
                    verificationCode: comparison.verificationCodeA,
                    screenshotUrl: getScreenshotByUrl(comparison.link1)
                },
                linkB: {
                    id: 'B',
                    url: comparison.link2,
                    title: "Example B",
                    description: "Please open or preview the page to view its content. Click either the “Preview” button or the “Open in New Tab” button. The system will record how long you spend viewing.",
                    verificationCode: comparison.verificationCodeB,
                    screenshotUrl: getScreenshotByUrl(comparison.link2)
                },
                dimensions: EVALUATION_DIMENSIONS,
                userQuery: comparison.prompt,
                isTrap: true
            };

            questions.push(question);
        });
    });

    return questions;
}

export const QUESTIONNAIRE_QUESTIONS = generateQuestions();
export const TRAP_QUESTIONS = generateTrapQuestions();

export function generateQuestionnaireId(): string {
    const chars = 'abcdefghijklmnopqrstuvwxyz0123456789';
    let result = '';
    for (let i = 0; i < 32; i++) {
        result += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return result;
}

export function createQuestionnaireGroup(questionnaireId?: string): {
    questionnaireId: string;
    questions: QuestionnaireQuestion[];
} {
    let selectedGroup;
    if (questionnaireId) {
        selectedGroup = preGeneratedGroups.find(g => g.questionnaireId === questionnaireId);
    } else {
        const randomIndex = Math.floor(Math.random() * preGeneratedGroups.length);
        selectedGroup = preGeneratedGroups[randomIndex];
    }

    if (!selectedGroup) {
        throw new Error('No questionnaire group found');
    }

    const questionsWithDimensions = selectedGroup.questions.map(q => ({
        ...q,
        dimensions: EVALUATION_DIMENSIONS,
        linkA: {
            ...q.linkA,
            screenshotUrl: getScreenshotByUrl(q.linkA.url)
        },
        linkB: {
            ...q.linkB,
            screenshotUrl: getScreenshotByUrl(q.linkB.url)
        }
    }));

    return {
        questionnaireId: selectedGroup.questionnaireId,
        questions: questionsWithDimensions
    };
}

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

export function getScreenshotByUrl(url: string): string | undefined {
    const mapping = urlScreenshotMapping.find(item => item.url === url);
    if (mapping) {
        return `http://34.94.132.86/analyze/${mapping.screenshot}`;
    }
    return undefined;
}