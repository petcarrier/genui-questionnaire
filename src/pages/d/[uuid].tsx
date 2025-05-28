import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import { GetServerSideProps } from 'next';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { QuestionnaireForm } from '@/components/QuestionnaireForm';
import { PageLayout } from '@/components/layout/PageLayout';
import { PageHeader } from '@/components/common/PageHeader';
import { ErrorScreen } from '@/components/common/ErrorScreen';
import { LoadingScreen } from '@/components/common/LoadingScreen';
import { QUESTIONNAIRE_QUESTIONS, getTaskGroupIdByUserQuery } from '@/data/questionnaireData';
import { QuestionnaireResponse, QuestionnaireQuestion } from '@/types/questionnaire';
import { CheckCircle, FileText, ExternalLink } from 'lucide-react';
import Link from 'next/link';

interface QuestionPageProps {
    question: QuestionnaireQuestion | null;
    questionIndex: number;
    totalQuestions: number;
}

type PageState = 'loading' | 'question' | 'completed' | 'error' | 'not-found';

export default function QuestionPage({ question, questionIndex, totalQuestions }: QuestionPageProps) {
    const router = useRouter();
    const { uuid } = router.query;
    const [currentState, setCurrentState] = useState<PageState>('loading');
    const [submission, setSubmission] = useState<QuestionnaireResponse | null>(null);
    const [submissionId, setSubmissionId] = useState<string>('');
    const [error, setError] = useState<string>('');
    const [annotatorId, setAnnotatorId] = useState<string>('');

    // 生成32位随机ID (只包含数字和小写字母)
    const generateAnnotatorId = (): string => {
        const chars = 'abcdefghijklmnopqrstuvwxyz0123456789';
        let result = '';
        for (let i = 0; i < 32; i++) {
            result += chars.charAt(Math.floor(Math.random() * chars.length));
        }
        return result;
    };

    useEffect(() => {
        // 检查session中是否已有annotatorId
        const existingId = sessionStorage.getItem('annotatorId');
        if (existingId) {
            setAnnotatorId(existingId);
        } else {
            // 生成新的annotatorId并存储到session
            const newId = generateAnnotatorId();
            sessionStorage.setItem('annotatorId', newId);
            setAnnotatorId(newId);
        }
    }, []);

    useEffect(() => {
        if (question) {
            setCurrentState('question');
        } else if (router.isReady) {
            setCurrentState('not-found');
        }
    }, [question, router.isReady]);

    const handleSubmitResponse = async (response: QuestionnaireResponse) => {
        try {
            const apiResponse = await fetch('/api/questionnaire/submit', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ response }),
            });

            const result = await apiResponse.json();

            if (!result.success) {
                throw new Error(result.message);
            }

            setSubmission(response);
            setSubmissionId(result.submissionId);
            setCurrentState('completed');
        } catch (err) {
            setError(err instanceof Error ? err.message : 'Failed to submit response');
            setCurrentState('error');
        }
    };

    const getNextQuestionUuid = (): string | null => {
        const currentIndex = QUESTIONNAIRE_QUESTIONS.findIndex(q => q.id === uuid);
        if (currentIndex >= 0 && currentIndex < QUESTIONNAIRE_QUESTIONS.length - 1) {
            return QUESTIONNAIRE_QUESTIONS[currentIndex + 1].id;
        }
        return null;
    };

    const getPrevQuestionUuid = (): string | null => {
        const currentIndex = QUESTIONNAIRE_QUESTIONS.findIndex(q => q.id === uuid);
        if (currentIndex > 0) {
            return QUESTIONNAIRE_QUESTIONS[currentIndex - 1].id;
        }
        return null;
    };

    const renderNotFoundScreen = () => (
        <PageLayout maxWidth="4xl">
            <PageHeader
                title="Question Not Found"
                description={`The question with UUID ${uuid} could not be found.`}
            >
                <div className="flex gap-4 justify-center">
                    <Link href="/">
                        <Button variant="outline">
                            Back to Home
                        </Button>
                    </Link>
                    <Link href="/questionnaire">
                        <Button>
                            Start Full Questionnaire
                        </Button>
                    </Link>
                </div>
            </PageHeader>
        </PageLayout>
    );

    const renderQuestionScreen = () => {
        if (!question) return null;

        const nextUuid = getNextQuestionUuid();
        const prevUuid = getPrevQuestionUuid();

        return (
            <PageLayout maxWidth="7xl">
                <QuestionnaireForm
                    question={question}
                    questionnaireId={question.id}
                    taskGroupId={getTaskGroupIdByUserQuery(question.userQuery)}
                    annotatorId={annotatorId}
                    onSubmit={handleSubmitResponse}
                    showNextButton={!!nextUuid}
                />
            </PageLayout>
        );
    };

    const renderCompletedScreen = () => {
        const nextUuid = getNextQuestionUuid();

        return (
            <PageLayout maxWidth="4xl">
                <PageHeader
                    title="Question Completed!"
                    description="Thank you for your response"
                    icon={<CheckCircle className="h-8 w-8" />}
                >
                    <div className="space-y-6">
                        <div className="bg-green-50 dark:bg-green-950 p-6 rounded-lg">
                            <h3 className="font-semibold mb-4">Submission Details</h3>
                            <div className="grid gap-3 text-sm">
                                <div className="flex justify-between">
                                    <span>Question ID:</span>
                                    <code className="font-mono text-xs bg-muted px-2 py-1 rounded">
                                        {uuid}
                                    </code>
                                </div>
                                <div className="flex justify-between">
                                    <span>Submission ID:</span>
                                    <code className="font-mono text-xs bg-muted px-2 py-1 rounded">
                                        {submissionId}
                                    </code>
                                </div>
                                <div className="flex justify-between">
                                    <span>Progress:</span>
                                    <span className="font-medium">{questionIndex + 1} of {totalQuestions} questions</span>
                                </div>
                            </div>
                        </div>

                        <div className="flex gap-4 justify-center">
                            <Link href="/">
                                <Button variant="outline">
                                    Back to Home
                                </Button>
                            </Link>
                            {nextUuid ? (
                                <Link href={`/d/${nextUuid}`}>
                                    <Button>
                                        Next Question
                                    </Button>
                                </Link>
                            ) : (
                                <Link href="/">
                                    <Button>
                                        View Full Results
                                    </Button>
                                </Link>
                            )}
                        </div>
                    </div>
                </PageHeader>
            </PageLayout>
        );
    };

    const renderErrorScreen = () => (
        <PageLayout maxWidth="4xl">
            <ErrorScreen
                error={error}
                onRetry={() => setCurrentState('question')}
                onGoHome={() => router.push('/')}
                retryText="Try Again"
                homeText="Back to Home"
            />
        </PageLayout>
    );

    const renderLoadingScreen = () => (
        <PageLayout>
            <LoadingScreen message="Loading question..." />
        </PageLayout>
    );

    if (currentState === 'loading') {
        return renderLoadingScreen();
    }

    if (currentState === 'not-found') {
        return renderNotFoundScreen();
    }

    if (currentState === 'question') {
        return renderQuestionScreen();
    }

    if (currentState === 'completed') {
        return renderCompletedScreen();
    }

    if (currentState === 'error') {
        return renderErrorScreen();
    }

    return null;
}

export const getServerSideProps: GetServerSideProps = async (context) => {
    const { uuid } = context.params!;

    // Find the question by UUID
    const question = QUESTIONNAIRE_QUESTIONS.find(q => q.id === uuid) || null;
    const questionIndex = question ? QUESTIONNAIRE_QUESTIONS.findIndex(q => q.id === uuid) : -1;
    const totalQuestions = QUESTIONNAIRE_QUESTIONS.length;

    return {
        props: {
            question,
            questionIndex,
            totalQuestions,
        },
    };
};
