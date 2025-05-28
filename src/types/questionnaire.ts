export interface EvaluationDimension {
    id: string;
    label: string;
    description: string;
}

export interface ComparisonLink {
    id: string;
    url: string;
    title: string;
    description?: string;
}

export interface QuestionnaireQuestion {
    taskGroupId: string;
    id: string;
    linkA: ComparisonLink;
    linkB: ComparisonLink;
    dimensions: EvaluationDimension[];
    userQuery: string;
    isTrap?: boolean;
}

export interface DimensionEvaluation {
    dimensionId: string;
    winner: 'A' | 'B' | 'tie';
    notes?: string;
}

export interface QuestionnaireResponse {
    questionId: string;
    linkAUrl: string;
    linkBUrl: string;
    questionnaireId: string;
    taskGroupId: string;
    dimensionEvaluations: DimensionEvaluation[];
    overallWinner: 'A' | 'B' | 'tie';
    captchaResponse: string;
    submittedAt: Date;
    annotatorId: string;
    isTrap?: boolean;
}


export const EVALUATION_DIMENSIONS: EvaluationDimension[] = [
    {
        id: 'query_interface_consistency',
        label: 'Query-Interface Consistency',
        description: 'Does the output reflect the user\'s intent as expressed in the query?\n\n[Better]: The response is focused, relevant, and directly helpful.\n\n[Weaker]: The response is vague, only loosely related, or misses key aspects of the query.'
    },
    {
        id: 'task_efficiency',
        label: 'Task Efficiency',
        description: 'How efficiently can the user achieve their goal using the output?\n[Better]: The layout or response is concise and allows quick understanding or action.\n[Weaker]: It takes extra steps or unnecessary reading to figure things out.'
    },
    {
        id: 'usability',
        label: 'Usability',
        description: 'Does the example make it clear what actions or next steps are available, or what information has been delivered?\n[Better]: Logical structure and clear affordances or responses.\n[Weaker]: Unclear interface purpose or ambiguous content.'
    },
    {
        id: 'learnability',
        label: 'Learnability',
        description: 'Can a user easily understand how to use the interface or interpret the response the first time?\n[Better]: Straightforward and intuitive, minimal effort to understand.\n[Weaker]: Requires guesswork or seems confusing for a first-time user.'
    },
    {
        id: 'information_clarity',
        label: 'Information Clarity',
        description: 'Is the output information well-organized and easy to understand?\n[Better]: Clear headings, simple wording, good structure.\n[Weaker]: Dense blocks of text, poor formatting, or unclear messaging.'
    },
    {
        id: 'aesthetic_appeal',
        label: 'Aesthetic or Stylistic Appeal',
        description: 'Is the design or tone visually and stylistically appealing?\n[Better]: Clean design, consistent layout or tone, and visually or stylistically pleasing.\n[Weaker]: Cluttered, inconsistent, or visually/textually hard to parse.'
    },
    {
        id: 'interaction_satisfaction',
        label: 'Interaction Experience Satisfaction',
        description: 'How satisfying is the overall experience of using or reading the output?\n[Better]: Smooth and pleasant, leaves a positive impression.\n[Weaker]: Disjointed or neutral experience, with little sense of value or engagement.'
    }
]; 