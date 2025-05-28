import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/router';
import { GetServerSideProps } from 'next';
import { PageLayout } from '@/components/layout/PageLayout';
import { LoadingScreen } from '@/components/common/LoadingScreen';
import { ErrorScreen } from '@/components/common/ErrorScreen';
import { useAnnotatorId } from '@/hooks/useAnnotatorId';

interface QuestionnaireIndexProps {
    // These props are provided by getServerSideProps, but we will actually use client state
}

export default function QuestionnaireIndex({ }: QuestionnaireIndexProps) {
    const router = useRouter();
    const { questionnaireId } = router.query;
    const { annotatorId, isLoading: isAnnotatorIdLoading } = useAnnotatorId();
    const [error, setError] = useState<string>('');
    const [isRedirecting, setIsRedirecting] = useState<boolean>(false);

    useEffect(() => {
        if (!router.isReady || isAnnotatorIdLoading) return;

        if (!annotatorId) {
            setError('Annotator ID not found, please start the questionnaire first');
            return;
        }

        const redirectToCurrentQuestion = async () => {
            setIsRedirecting(true);

            try {
                // Fetch questionnaire group data from API based on annotatorId and questionnaireId
                const response = await fetch(`/api/questionnaire/annotator/${annotatorId}?questionnaireId=${questionnaireId}`);
                const result = await response.json();

                if (!result.success) {
                    setError(result.message);
                    setIsRedirecting(false);
                    return;
                }

                const group = result.data;

                // Verify that the questionnaireId in URL matches the one in the data
                if (group.questionnaireId !== questionnaireId) {
                    setError('Questionnaire ID mismatch. Please start the questionnaire again.');
                    setIsRedirecting(false);
                    return;
                }

                // Check questionnaire status - if completed, redirect to the last question for completion view
                if (group.status === 'completed') {
                    const lastQuestion = group.questions[group.questions.length - 1];
                    if (lastQuestion) {
                        router.replace(`/q/${group.questionnaireId}/${lastQuestion.id}`);
                    } else {
                        setError('No questions found in the questionnaire');
                        setIsRedirecting(false);
                    }
                    return;
                }

                // Get the current question to proceed (based on currentQuestionIndex)
                const currentQuestionIndex = group.currentQuestionIndex;

                // If out of question range, questionnaire is completed - redirect to last question
                if (currentQuestionIndex >= group.questions.length) {
                    const lastQuestion = group.questions[group.questions.length - 1];
                    if (lastQuestion) {
                        router.replace(`/q/${group.questionnaireId}/${lastQuestion.id}`);
                    } else {
                        setError('No questions found in the questionnaire');
                        setIsRedirecting(false);
                    }
                    return;
                }

                const currentQuestion = group.questions[currentQuestionIndex];
                if (!currentQuestion) {
                    setError('Current question does not exist');
                    setIsRedirecting(false);
                    return;
                }

                // Redirect to the current question
                router.replace(`/q/${group.questionnaireId}/${currentQuestion.id}`);

            } catch (err) {
                console.error('Error loading questionnaire:', err);
                setError('Error loading questionnaire');
                setIsRedirecting(false);
            }
        };

        redirectToCurrentQuestion();
    }, [router.isReady, questionnaireId, router, annotatorId, isAnnotatorIdLoading]);

    const renderErrorScreen = () => (
        <PageLayout maxWidth="4xl">
            <ErrorScreen
                error={error}
                onRetry={() => {
                    setError('');
                    router.reload();
                }}
                onGoHome={() => router.push('/')}
                retryText="Retry"
                homeText="Go Home"
            />
        </PageLayout>
    );

    const renderLoadingScreen = () => (
        <PageLayout>
            <LoadingScreen message="Finding your current question..." />
        </PageLayout>
    );

    // Show error if there's an error
    if (error) {
        return renderErrorScreen();
    }

    // Show loading while redirecting or still loading
    if (isRedirecting || !router.isReady || isAnnotatorIdLoading) {
        return renderLoadingScreen();
    }

    // This should not be reached as we always redirect
    return renderLoadingScreen();
}

export const getServerSideProps: GetServerSideProps = async (context) => {
    // Since we use client-side state management, we only need to return empty props here
    return {
        props: {},
    };
}; 