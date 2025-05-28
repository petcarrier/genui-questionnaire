import { NextApiRequest, NextApiResponse } from 'next';
import { QUESTIONNAIRE_QUESTIONS } from '@/data/questionnaireData';

export default function handler(req: NextApiRequest, res: NextApiResponse) {
    if (req.method !== 'GET') {
        return res.status(405).json({ error: 'Method not allowed' });
    }

    try {
        const questions = QUESTIONNAIRE_QUESTIONS.map((question, index) => ({
            id: question.id,
            index: index + 1,
            userQuery: question.userQuery,
            linkA: {
                title: question.linkA.title,
                url: question.linkA.url
            },
            linkB: {
                title: question.linkB.title,
                url: question.linkB.url
            },
            directUrl: `/q/${question.id}`
        }));

        res.status(200).json({
            success: true,
            total: questions.length,
            questions
        });
    } catch (error) {
        console.error('Error fetching questions:', error);
        res.status(500).json({
            success: false,
            error: 'Failed to fetch questions'
        });
    }
} 