import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import { GetServerSideProps } from 'next';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { QuestionnaireForm, PageLayout, PageHeader, ErrorScreen, LoadingScreen } from '@/components';
import { QuestionnaireResponse, QuestionnaireQuestion } from '@/types/questionnaire';
import { CheckCircle, Copy, Check } from 'lucide-react';
import Link from 'next/link';
import { useAnnotatorId } from '@/hooks/useAnnotatorId';

interface QuestionPageProps {
    // These props are provided by getServerSideProps, but we will actually use client state
}

type PageState = 'loading' | 'question' | 'completed' | 'error' | 'not-found';

interface QuestionnaireGroup {
    questionnaireId: string;
    annotatorId: string;
    questions: QuestionnaireQuestion[];
    currentIndex: number;
    createdAt: Date;
}

export default function QuestionPage({ }: QuestionPageProps) {
    const router = useRouter();
    const { questionnaireId, questionId } = router.query;
    const { annotatorId, isLoading: isAnnotatorIdLoading } = useAnnotatorId();
    const [currentState, setCurrentState] = useState<PageState>('loading');
    const [submission, setSubmission] = useState<QuestionnaireResponse | null>(null);
    const [submissionId, setSubmissionId] = useState<string>('');
    const [error, setError] = useState<string>('');
    const [questionnaireGroup, setQuestionnaireGroup] = useState<QuestionnaireGroup | null>(null);
    const [currentQuestion, setCurrentQuestion] = useState<QuestionnaireQuestion | null>(null);
    const [currentIndex, setCurrentIndex] = useState<number>(0);
    const [isCopied, setIsCopied] = useState<boolean>(false);

    useEffect(() => {
        if (!router.isReady || isAnnotatorIdLoading) return;

        if (!annotatorId) {
            setError('Annotator ID not found, please start the questionnaire first');
            setCurrentState('error');
            return;
        }

        const fetchQuestionnaireGroup = async () => {
            try {
                // Fetch questionnaire group data from API based on annotatorId and questionnaireId
                const response = await fetch(`/api/questionnaire/annotator/${annotatorId}?questionnaireId=${questionnaireId}`);
                const result = await response.json();

                if (!result.success) {
                    setError(result.message);
                    setCurrentState('not-found');
                    return;
                }

                const group = result.data;
                setQuestionnaireGroup({
                    questionnaireId: group.questionnaireId,
                    annotatorId: group.annotatorId,
                    questions: group.questions,
                    currentIndex: group.currentQuestionIndex,
                    createdAt: group.createdAt
                });

                // Check questionnaire status - if completed, show completion status directly
                if (group.status === 'completed') {
                    // Set to the last question index to display progress correctly
                    setCurrentIndex(group.questions.length - 1);
                    setCurrentState('completed');
                    return;
                }

                // Get the current question to proceed (based on currentQuestionIndex)
                const currentQuestionIndex = group.currentQuestionIndex;

                // If out of question range, questionnaire is completed
                if (currentQuestionIndex >= group.questions.length) {
                    setCurrentIndex(group.questions.length - 1);
                    setCurrentState('completed');
                    return;
                }

                const currentQuestionInProgress = group.questions[currentQuestionIndex];
                if (!currentQuestionInProgress) {
                    setError('Current question does not exist');
                    setCurrentState('error');
                    return;
                }

                // If questionId in URL doesn't match current progress, auto-redirect to correct question
                if (questionId !== currentQuestionInProgress.id) {
                    router.replace(`/q/${group.questionnaireId}/${currentQuestionInProgress.id}`);
                    return;
                }

                // Set current question
                setCurrentQuestion(currentQuestionInProgress);
                setCurrentIndex(currentQuestionIndex);
                setCurrentState('question');

            } catch (err) {
                console.error('Error loading questionnaire:', err);
                setError('Error loading questionnaire');
                setCurrentState('error');
            }
        };

        fetchQuestionnaireGroup();
    }, [router.isReady, questionnaireId, questionId, router, annotatorId, isAnnotatorIdLoading]);

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

            // Update current index to next question
            const newIndex = currentIndex + 1;
            setCurrentIndex(newIndex);

            // Always show completion screen after submitting, regardless of whether it's the last question
            setCurrentState('completed');

        } catch (err) {
            setError(err instanceof Error ? err.message : 'Failed to submit response');
            setCurrentState('error');
        }
    };

    const getNextQuestionId = (): string | null => {
        if (!questionnaireGroup || currentIndex >= questionnaireGroup.questions.length - 1) {
            return null;
        }
        return questionnaireGroup.questions[currentIndex + 1].id;
    };

    const getPrevQuestionId = (): string | null => {
        if (!questionnaireGroup || currentIndex <= 0) {
            return null;
        }
        return questionnaireGroup.questions[currentIndex - 1].id;
    };

    const isLastQuestion = (): boolean => {
        return !questionnaireGroup || currentIndex >= questionnaireGroup.questions.length - 1;
    };

    const handleCopyAnnotatorId = async () => {
        if (!questionnaireGroup?.annotatorId) return;

        try {
            await navigator.clipboard.writeText(questionnaireGroup.annotatorId);
            setIsCopied(true);
            // Reset the copied state after 2 seconds
            setTimeout(() => setIsCopied(false), 2000);
        } catch (err) {
            console.error('Failed to copy text: ', err);
            // Fallback for older browsers
            const textArea = document.createElement('textarea');
            textArea.value = questionnaireGroup.annotatorId;
            document.body.appendChild(textArea);
            textArea.select();
            try {
                document.execCommand('copy');
                setIsCopied(true);
                setTimeout(() => setIsCopied(false), 2000);
            } catch (fallbackErr) {
                console.error('Fallback copy failed: ', fallbackErr);
            }
            document.body.removeChild(textArea);
        }
    };

    const renderNotFoundScreen = () => (
        <PageLayout maxWidth="4xl">
            <PageHeader
                title="Questionnaire Not Found"
                description={error || `Question ${questionId} in questionnaire ${questionnaireId} not found`}
            >
            </PageHeader>
        </PageLayout>
    );

    const renderQuestionScreen = () => {
        if (!currentQuestion || !questionnaireGroup) return null;

        return (
            <PageLayout maxWidth="7xl">
                <QuestionnaireForm
                    question={currentQuestion}
                    questionnaireId={questionnaireGroup.questionnaireId}
                    taskGroupId={currentQuestion.taskGroupId}
                    annotatorId={questionnaireGroup.annotatorId}
                    onSubmit={handleSubmitResponse}
                    showNextButton={true}
                />
            </PageLayout>
        );
    };

    const renderCompletedScreen = () => {
        const nextQuestionId = getNextQuestionId();
        const isLast = isLastQuestion();
        const totalQuestions = questionnaireGroup?.questions.length || 0;
        const completedQuestions = Math.min(currentIndex + 1, totalQuestions);

        return (
            <PageLayout maxWidth="4xl">
                <PageHeader
                    title={isLast ? "Questionnaire Complete!" : "Question Complete!"}
                    description={isLast ? "Thank you for completing the entire questionnaire" : "Thank you for your response"}
                    icon={<CheckCircle className="h-8 w-8" />}
                >
                    <div className="space-y-6">
                        <div className="bg-green-50 dark:bg-green-950 p-6 rounded-lg">
                            <h3 className="font-semibold mb-4">Submission Details</h3>
                            <div className="grid gap-3 text-sm">
                                <div className="flex justify-between">
                                    <span>Progress:</span>
                                    <span className="font-medium">
                                        {completedQuestions} / {totalQuestions} questions
                                    </span>
                                </div>
                                <div className="flex justify-between">
                                    <span>Completion:</span>
                                    <span className="font-medium">
                                        {totalQuestions > 0 ? Math.round((completedQuestions / totalQuestions) * 100) : 0}%
                                    </span>
                                </div>
                            </div>
                        </div>

                        {isLast && (
                            <Card className="border-green-200 bg-green-50 dark:border-green-800 dark:bg-green-950">
                                <CardContent className="pt-6">
                                    <h3 className="font-semibold mb-2 text-green-800 dark:text-green-200">
                                        Questionnaire Complete!
                                    </h3>
                                    <p className="text-green-700 dark:text-green-300 mb-4">
                                        You have successfully completed all questions. Your ID is:
                                    </p>
                                    <div className="bg-white dark:bg-gray-800 p-4 rounded border">
                                        <div className="flex items-center justify-between gap-2">
                                            <code className="text-lg font-mono break-all flex-1">
                                                {questionnaireGroup?.annotatorId}
                                            </code>
                                            <Button
                                                variant="outline"
                                                size="sm"
                                                onClick={handleCopyAnnotatorId}
                                                className="flex-shrink-0"
                                            >
                                                {isCopied ? (
                                                    <>
                                                        <Check className="h-4 w-4 mr-1" />
                                                        Copied
                                                    </>
                                                ) : (
                                                    <>
                                                        <Copy className="h-4 w-4 mr-1" />
                                                        Copy
                                                    </>
                                                )}
                                            </Button>
                                        </div>
                                    </div>
                                    <p className="text-sm text-green-600 dark:text-green-400 mt-2">
                                        Please enter this ID back into the questionnaire platform
                                    </p>
                                </CardContent>
                            </Card>
                        )}

                        <div className="flex gap-4 justify-center">
                            {nextQuestionId && !isLast ? (
                                <Link href={`/q/${questionnaireGroup?.questionnaireId}/${nextQuestionId}`}>
                                    <Button>
                                        Next Question
                                    </Button>
                                </Link>
                            ) : null}
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
                retryText="Retry"
                homeText="Go Home"
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
    // Since we use client-side state management, we only need to return empty props here
    return {
        props: {},
    };
}; 