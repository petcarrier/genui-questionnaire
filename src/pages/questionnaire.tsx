import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { QuestionnaireForm } from '@/components/QuestionnaireForm';
import { PageLayout } from '@/components/layout/PageLayout';
import { ProgressCard } from '@/components/common/ProgressCard';
import { ErrorScreen } from '@/components/common/ErrorScreen';
import { QUESTIONNAIRE_QUESTIONS } from '@/data/questionnaireData';
import { QuestionnaireResponse } from '@/types/questionnaire';
import { Home as HomeIcon } from 'lucide-react';
import Link from 'next/link';
import { useRouter } from 'next/router';

export default function QuestionnairePage() {
    const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
    const [submissions, setSubmissions] = useState<QuestionnaireResponse[]>([]);
    const [error, setError] = useState<string>('');
    const [isError, setIsError] = useState(false);
    const router = useRouter();

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

            setSubmissions(prev => [...prev, response]);

            // Check if there are more questions
            if (currentQuestionIndex < QUESTIONNAIRE_QUESTIONS.length - 1) {
                setCurrentQuestionIndex(prev => prev + 1);
            } else {
                // Navigate to completed page with submission data
                router.push({
                    pathname: '/completed',
                    query: {
                        submissionId: result.submissionId,
                        totalQuestions: submissions.length + 1
                    }
                });
            }
        } catch (err) {
            setError(err instanceof Error ? err.message : 'Failed to submit response');
            setIsError(true);
        }
    };

    const handleRestart = () => {
        setCurrentQuestionIndex(0);
        setSubmissions([]);
        setError('');
        setIsError(false);
    };

    const handleRetry = () => {
        setIsError(false);
        setError('');
    };

    const handleGoHome = () => {
        router.push('/');
    };

    if (isError) {
        return (
            <PageLayout maxWidth="4xl">
                <ErrorScreen
                    error={error}
                    onRetry={handleRetry}
                    onGoHome={handleGoHome}
                />
            </PageLayout>
        );
    }

    const currentQuestion = QUESTIONNAIRE_QUESTIONS[currentQuestionIndex];

    return (
        <PageLayout maxWidth="7xl">
            <div className="mb-4">
                <Link href="/">
                    <Button
                        variant="outline"
                        className="flex items-center gap-2"
                    >
                        <HomeIcon className="h-4 w-4" />
                        Back to Home
                    </Button>
                </Link>
            </div>

            <ProgressCard
                current={currentQuestionIndex + 1}
                total={QUESTIONNAIRE_QUESTIONS.length}
                label="Question"
            />

            <QuestionnaireForm
                question={currentQuestion}
                onSubmit={handleSubmitResponse}
                showNextButton={currentQuestionIndex < QUESTIONNAIRE_QUESTIONS.length - 1}
            />
        </PageLayout>
    );
} 