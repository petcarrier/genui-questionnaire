import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Label } from '@/components/ui/label';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { CheckCircle, AlertCircle, Trophy } from 'lucide-react';
import { LinkPreview } from './LinkPreview';
import { DimensionEvaluationComponent } from './DimensionEvaluation';
import { PageHeader } from './common/PageHeader';
import { WinnerSummaryBadges } from './common/WinnerSummaryBadges';
import {
    QuestionnaireQuestion,
    DimensionEvaluation,
    QuestionnaireResponse,
    EVALUATION_DIMENSIONS
} from '@/types/questionnaire';

interface QuestionnaireFormProps {
    question: QuestionnaireQuestion;
    questionnaireId: string;
    taskGroupId: string;
    annotatorId: string;
    onSubmit: (response: QuestionnaireResponse) => void;
    onNext?: () => void;
    showNextButton?: boolean;
}

export function QuestionnaireForm({
    question,
    questionnaireId,
    taskGroupId,
    annotatorId,
    onSubmit,
    onNext,
    showNextButton = false
}: QuestionnaireFormProps) {
    const [dimensionEvaluations, setDimensionEvaluations] = useState<DimensionEvaluation[]>([]);
    const [overallWinner, setOverallWinner] = useState<'A' | 'B' | 'tie' | ''>('');
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [submitError, setSubmitError] = useState('');

    const handleDimensionEvaluation = (evaluation: DimensionEvaluation) => {
        setDimensionEvaluations(prev => {
            const filtered = prev.filter(e => e.dimensionId !== evaluation.dimensionId);
            return [...filtered, evaluation];
        });
    };

    const isFormValid = () => {
        const allDimensionsEvaluated = EVALUATION_DIMENSIONS.every(dim =>
            dimensionEvaluations.some(evaluation => evaluation.dimensionId === dim.id && evaluation.winner)
        );
        return allDimensionsEvaluated && overallWinner;
    };

    const handleSubmit = async () => {
        if (!isFormValid()) {
            setSubmitError('Please complete all evaluations.');
            return;
        }

        setIsSubmitting(true);
        setSubmitError('');

        try {
            const response: QuestionnaireResponse = {
                questionId: question.id,
                linkAUrl: question.linkA.url,
                linkBUrl: question.linkB.url,
                questionnaireId: questionnaireId,
                taskGroupId: taskGroupId,
                dimensionEvaluations,
                overallWinner: overallWinner as 'A' | 'B' | 'tie',
                captchaResponse: '',
                annotatorId: annotatorId,
                submittedAt: new Date()
            };

            await onSubmit(response);
        } catch (error) {
            setSubmitError('Failed to submit response. Please try again.');
        } finally {
            setIsSubmitting(false);
        }
    };

    const getWinnerSummary = () => {
        const aWins = dimensionEvaluations.filter(e => e.winner === 'A').length;
        const bWins = dimensionEvaluations.filter(e => e.winner === 'B').length;
        const ties = dimensionEvaluations.filter(e => e.winner === 'tie').length;

        return { aWins, bWins, ties };
    };

    const { aWins, bWins, ties } = getWinnerSummary();

    return (
        <div className="max-w-6xl mx-auto space-y-8">
            {/* Header */}
            <PageHeader
                title="Website Comparison Evaluation"
                description={`Compare these two websites across ${EVALUATION_DIMENSIONS.length} different dimensions and determine which performs better overall.`}
                icon={<Trophy className="h-6 w-6" />}
            />

            {/* Winner Summary */}
            <div className="flex justify-center">
                <WinnerSummaryBadges
                    aWins={aWins}
                    bWins={bWins}
                    ties={ties}
                    linkATitle={question.linkA.title}
                    linkBTitle={question.linkB.title}
                    showTitles={false}
                />
            </div>

            {/* Website Previews */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <LinkPreview
                    link={question.linkA}
                    label="Option A"
                    color="blue"
                />
                <LinkPreview
                    link={question.linkB}
                    label="Option B"
                    color="green"
                />
            </div>

            {/* Dimension Evaluations */}
            <div className="space-y-6">
                <div>
                    <h2 className="text-xl font-semibold">Evaluation Dimensions</h2>
                    <p className="text-sm text-muted-foreground mt-1">
                        For each dimension, select the better option and provide a clear reason for your choice.
                    </p>
                </div>
                <div className="grid gap-6">
                    {EVALUATION_DIMENSIONS.map(dimension => (
                        <DimensionEvaluationComponent
                            key={dimension.id}
                            dimension={dimension}
                            linkA={question.linkA}
                            linkB={question.linkB}
                            evaluation={dimensionEvaluations.find(e => e.dimensionId === dimension.id)}
                            onChange={handleDimensionEvaluation}
                        />
                    ))}
                </div>
            </div>

            {/* Overall Winner Selection */}
            <Card>
                <CardHeader>
                    <CardTitle>Overall Winner</CardTitle>
                    <p className="text-muted-foreground">
                        Based on your evaluation across all dimensions, which website is the overall winner?
                    </p>
                </CardHeader>
                <CardContent>
                    <RadioGroup
                        value={overallWinner}
                        onValueChange={(value: string) => setOverallWinner(value as 'A' | 'B' | 'tie')}
                    >
                        <div className="flex items-center space-x-2">
                            <RadioGroupItem value="A" id="overall-A" />
                            <Label htmlFor="overall-A" className="font-medium text-blue-600 dark:text-blue-400">
                                Option A: {question.linkA.title}
                            </Label>
                        </div>
                        <div className="flex items-center space-x-2">
                            <RadioGroupItem value="B" id="overall-B" />
                            <Label htmlFor="overall-B" className="font-medium text-green-600 dark:text-green-400">
                                Option B: {question.linkB.title}
                            </Label>
                        </div>
                        <div className="flex items-center space-x-2">
                            <RadioGroupItem value="tie" id="overall-tie" />
                            <Label htmlFor="overall-tie" className="font-medium text-gray-600 dark:text-gray-400">
                                Tie / No clear winner
                            </Label>
                        </div>
                    </RadioGroup>
                </CardContent>
            </Card>

            {/* Error Display */}
            {submitError && (
                <Alert variant="destructive">
                    <AlertCircle className="h-4 w-4" />
                    <AlertDescription>{submitError}</AlertDescription>
                </Alert>
            )}

            {/* Submit/Next Buttons */}
            <div className="flex gap-4 justify-end">
                <Button
                    onClick={handleSubmit}
                    disabled={!isFormValid() || isSubmitting}
                    size="lg"
                    className="min-w-32"
                >
                    {isSubmitting ? (
                        'Submitting...'
                    ) : (
                        <>
                            <CheckCircle className="mr-2 h-4 w-4" />
                            Submit Evaluation
                        </>
                    )}
                </Button>

                {showNextButton && onNext && (
                    <Button
                        onClick={onNext}
                        variant="outline"
                        size="lg"
                    >
                        Next Question
                    </Button>
                )}
            </div>
        </div>
    );
} 