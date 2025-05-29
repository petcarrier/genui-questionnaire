import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { PageLayout } from '@/components/layout/PageLayout';
import { PageHeader } from '@/components/common/PageHeader';
import { LoadingScreen } from '@/components/common/LoadingScreen';
import { Clock, Users, Target, Shuffle } from 'lucide-react';
import { useToast } from '@/components/ui/use-toast';

export default function QuestionnairePage() {
    const router = useRouter();
    const { toast } = useToast();
    const [isStarting, setIsStarting] = useState(false);
    const [annotatorId, setAnnotatorId] = useState<string>('');

    // Get questionnaireId from router query
    const { questionnaireId } = router.query;

    // Generate 32-bit random ID (numbers and lowercase letters only)
    const generateAnnotatorId = (): string => {
        const chars = 'abcdefghijklmnopqrstuvwxyz0123456789';
        let result = '';
        for (let i = 0; i < 32; i++) {
            result += chars.charAt(Math.floor(Math.random() * chars.length));
        }
        return result;
    };

    useEffect(() => {
        // Check if annotatorId already exists in session
        const existingId = sessionStorage.getItem('annotatorId');
        if (existingId) {
            setAnnotatorId(existingId);
        } else {
            // Generate new annotatorId and store in session
            const newId = generateAnnotatorId();
            sessionStorage.setItem('annotatorId', newId);
            setAnnotatorId(newId);
        }
    }, []);

    const handleStartQuestionnaire = async () => {
        setIsStarting(true);

        try {
            // First check if questionnaire group already exists for this annotator
            const checkParams = new URLSearchParams({ annotatorId });
            if (questionnaireId && typeof questionnaireId === 'string') {
                checkParams.append('questionnaireId', questionnaireId);
            }

            const checkResponse = await fetch(`/api/questionnaire/annotator/${annotatorId}?${checkParams.toString()}`);
            const checkResult = await checkResponse.json();

            if (!checkResponse.ok) {
                throw new Error(checkResult.error || checkResult.message || 'Failed to check questionnaire status');
            }

            console.log('checkResult', checkResult);

            // If questionnaire group already exists, navigate to current question
            if (checkResult.success && checkResult.data) {
                const group = checkResult.data;

                // If questionnaire is completed, show completion page
                if (group.status === 'completed') {
                    // Navigate to the last question to show completion status
                    const lastQuestion = group.questions[group.questions.length - 1];
                    if (lastQuestion) {
                        router.push(`/q/${group.questionnaireId}/${lastQuestion.id}`);
                        return;
                    }
                }

                // Get current question based on progress
                const currentQuestionIndex = group.currentQuestionIndex;
                if (currentQuestionIndex < group.questions.length) {
                    const currentQuestion = group.questions[currentQuestionIndex];
                    if (currentQuestion) {
                        router.push(`/q/${group.questionnaireId}/${currentQuestion.id}`);
                        return;
                    }
                }
            }

            // If no existing questionnaire group found, create a new one
            const requestBody: any = {
                annotatorId: annotatorId
            };

            // Only include questionnaireId if it exists
            if (questionnaireId && typeof questionnaireId === 'string') {
                requestBody.questionnaireId = questionnaireId;
            }

            // Call API to create new questionnaire group
            const response = await fetch('/api/questionnaire/create', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(requestBody),
            });

            const result = await response.json();

            if (!response.ok) {
                throw new Error(result.error || result.message || 'Failed to create questionnaire');
            }

            if (!result.success) {
                throw new Error(result.error || result.message || 'Failed to create questionnaire');
            }

            // Navigate to first question
            if (result.firstQuestionId) {
                router.push(`/q/${result.questionnaireId}/${result.firstQuestionId}`);
            }
        } catch (error) {
            console.error('Failed to start questionnaire:', error);
            toast({
                variant: "destructive",
                title: "Error",
                description: error instanceof Error ? error.message : 'An unexpected error occurred'
            });
            setIsStarting(false);
        }
    };

    if (isStarting) {
        return (
            <PageLayout>
                <LoadingScreen message="Preparing your questionnaire..." />
            </PageLayout>
        );
    }

    return (
        <PageLayout maxWidth="4xl">
            <PageHeader
                title="Start New Questionnaire"
                description="Participate in our user interface evaluation study"
            >
                <div className="space-y-8">
                    {/* Questionnaire description card */}
                    <Card>
                        <CardHeader>
                            <CardTitle className="flex items-center gap-2">
                                <Target className="h-5 w-5" />
                                Research Purpose
                            </CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            <p className="text-muted-foreground">
                                This study aims to evaluate the quality and user experience of different user interface designs.
                                You will view paired interface examples and need to compare and evaluate them across multiple dimensions.
                            </p>

                            <div className="grid md:grid-cols-3 gap-4 mt-6">
                                <div className="flex items-center gap-3">
                                    <Clock className="h-5 w-5 text-blue-500" />
                                    <div>
                                        <p className="font-medium">Estimated Time</p>
                                        <p className="text-sm text-muted-foreground">15-20 minutes</p>
                                    </div>
                                </div>

                                <div className="flex items-center gap-3">
                                    <Users className="h-5 w-5 text-green-500" />
                                    <div>
                                        <p className="font-medium">Number of Questions</p>
                                        <p className="text-sm text-muted-foreground">8 comparison tasks</p>
                                    </div>
                                </div>

                                <div className="flex items-center gap-3">
                                    <Shuffle className="h-5 w-5 text-purple-500" />
                                    <div>
                                        <p className="font-medium">Randomization</p>
                                        <p className="text-sm text-muted-foreground">Random question order</p>
                                    </div>
                                </div>
                            </div>
                        </CardContent>
                    </Card>

                    {/* Evaluation dimensions card */}
                    <Card>
                        <CardHeader>
                            <CardTitle>Evaluation Dimensions</CardTitle>
                        </CardHeader>
                        <CardContent>
                            <p className="text-muted-foreground mb-4">
                                You will compare two interface options across the following 7 dimensions:
                            </p>

                            <div className="grid md:grid-cols-2 gap-3">
                                <Badge variant="outline" className="justify-start p-2">
                                    Query-Interface Consistency
                                </Badge>
                                <Badge variant="outline" className="justify-start p-2">
                                    Task Efficiency
                                </Badge>
                                <Badge variant="outline" className="justify-start p-2">
                                    Usability
                                </Badge>
                                <Badge variant="outline" className="justify-start p-2">
                                    Learnability
                                </Badge>
                                <Badge variant="outline" className="justify-start p-2">
                                    Information Clarity
                                </Badge>
                                <Badge variant="outline" className="justify-start p-2">
                                    Aesthetics
                                </Badge>
                                <Badge variant="outline" className="justify-start p-2 md:col-span-2">
                                    Interaction Experience Satisfaction
                                </Badge>
                            </div>
                        </CardContent>
                    </Card>

                    {/* Important notes */}
                    <Card className="border-yellow-200 bg-yellow-50 dark:border-yellow-800 dark:bg-yellow-950">
                        <CardContent className="pt-6">
                            <h3 className="font-semibold mb-2">Important Notes</h3>
                            <ul className="space-y-1 text-sm text-muted-foreground">
                                {/* <li>• Please carefully view each interface example and copy the verification code</li> */}
                                <li>• The questionnaire includes quality control questions, please read instructions carefully</li>
                                {/* <li>• Each question requires completing the verification code before submission</li> */}
                                <li>• We recommend completing this in a quiet environment with full attention</li>
                            </ul>
                        </CardContent>
                    </Card>

                    {/* Start button */}
                    <div className="flex justify-center">
                        <Button
                            size="lg"
                            onClick={handleStartQuestionnaire}
                            className="px-8"
                        >
                            Start Questionnaire
                        </Button>
                    </div>
                </div>
            </PageHeader>
        </PageLayout>
    );
} 