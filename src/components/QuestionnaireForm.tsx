import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Label } from '@/components/ui/label';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { CheckCircle, AlertCircle, Trophy, Eye, Timer, AlertTriangle } from 'lucide-react';
import { LinkPreview } from './LinkPreview';
import { DimensionEvaluationComponent } from './DimensionEvaluation';
import { VerificationCodeInput } from './VerificationCodeInput';
import { PageHeader } from './common/PageHeader';
import { WinnerSummaryBadges } from './common/WinnerSummaryBadges';
import {
    QuestionnaireQuestion,
    DimensionEvaluation,
    QuestionnaireResponse,
    EVALUATION_DIMENSIONS,
    PageVisitStatus,
    VerificationCodeStatus
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

// Minimum viewing time requirement (milliseconds)
const MIN_VIEW_TIME_MS = 3000; // 3 seconds
const RECOMMENDED_VIEW_TIME_MS = 30000; // 30 seconds

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
    const [pageVisitStatus, setPageVisitStatus] = useState<PageVisitStatus>({});
    const [verificationCodeStatus, setVerificationCodeStatus] = useState<VerificationCodeStatus>({});

    const handleDimensionEvaluation = (evaluation: DimensionEvaluation) => {
        setDimensionEvaluations(prev => {
            const filtered = prev.filter(e => e.dimensionId !== evaluation.dimensionId);
            return [...filtered, evaluation];
        });
    };

    const handlePageVisit = (linkId: string, visited: boolean, duration?: number) => {
        setPageVisitStatus(prev => {
            const currentStatus = prev[linkId] || { visited: false, duration: 0 };

            return {
                ...prev,
                [linkId]: {
                    visited: visited || currentStatus.visited,
                    duration: duration !== undefined ? duration : currentStatus.duration,
                    lastVisited: visited ? Date.now() : currentStatus.lastVisited
                }
            };
        });
    };

    const handleCodeValidation = (linkId: string, isValid: boolean, enteredCode: string) => {
        setVerificationCodeStatus(prev => ({
            ...prev,
            [linkId]: {
                isValid,
                enteredCode,
                attempts: (prev[linkId]?.attempts || 0) + (enteredCode ? 1 : 0)
            }
        }));
    };

    // Check if verification code validation is needed
    const hasVerificationCodes = question.linkA.verificationCode || question.linkB.verificationCode;

    // Check visit status
    const getVisitValidation = () => {
        const linkAStatus = pageVisitStatus[question.linkA.id];
        const linkBStatus = pageVisitStatus[question.linkB.id];

        const bothVisited = linkAStatus?.visited && linkBStatus?.visited;
        // Check if each link's total time exceeds the minimum requirement
        const sufficientTimeA = (linkAStatus?.duration || 0) >= MIN_VIEW_TIME_MS;
        const sufficientTimeB = (linkBStatus?.duration || 0) >= MIN_VIEW_TIME_MS;
        const sufficientTime = sufficientTimeA && sufficientTimeB;

        // Verification code validation
        let verificationPassed = true;
        if (hasVerificationCodes) {
            const linkACodeValid = !question.linkA.verificationCode || verificationCodeStatus[question.linkA.id]?.isValid;
            const linkBCodeValid = !question.linkB.verificationCode || verificationCodeStatus[question.linkB.id]?.isValid;
            verificationPassed = linkACodeValid && linkBCodeValid;
        }

        return {
            bothVisited,
            sufficientTime,
            verificationPassed,
            linkAStatus,
            linkBStatus,
            totalTimeA: linkAStatus?.duration || 0,
            totalTimeB: linkBStatus?.duration || 0
        };
    };

    const isFormValid = () => {
        const allDimensionsEvaluated = EVALUATION_DIMENSIONS.every(dim =>
            dimensionEvaluations.some(evaluation => evaluation.dimensionId === dim.id && evaluation.winner)
        );
        return allDimensionsEvaluated && overallWinner;
    };

    const isFormReadyForSubmission = () => {
        const formValid = isFormValid();
        const { bothVisited, sufficientTime, verificationPassed } = getVisitValidation();
        return formValid && bothVisited && sufficientTime && verificationPassed;
    };

    const handleSubmit = async () => {
        const validation = getVisitValidation();

        if (!isFormValid()) {
            setSubmitError('Please complete all evaluation items.');
            return;
        }

        if (!validation.bothVisited) {
            setSubmitError('Please view both comparison websites before submitting your evaluation.');
            return;
        }

        if (!validation.sufficientTime) {
            setSubmitError(`Please spend sufficient time (total at least ${MIN_VIEW_TIME_MS / 1000} seconds) carefully reviewing each webpage content.`);
            return;
        }

        if (!validation.verificationPassed) {
            setSubmitError('Please correctly enter the verification code shown on the webpage to prove you have carefully reviewed the content.');
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
                submittedAt: new Date(),
                // Add visit data
                metadata: {
                    pageVisitStatus,
                    verificationCodeStatus,
                    totalViewTime: validation.totalTimeA + validation.totalTimeB
                }
            };

            await onSubmit(response);
        } catch (error) {
            setSubmitError('Submission failed. Please try again.');
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
    const validation = getVisitValidation();

    // Format time display
    const formatTime = (milliseconds: number): string => {
        const seconds = Math.floor(milliseconds / 1000);
        if (seconds < 60) return `${seconds}s`;
        const minutes = Math.floor(seconds / 60);
        const remainingSeconds = seconds % 60;
        return `${minutes}m ${remainingSeconds}s`;
    };

    return (
        <div className="max-w-6xl mx-auto space-y-8">
            {/* Header */}
            <PageHeader
                title="Website Comparison Evaluation"
                description={`Please compare these two websites across ${EVALUATION_DIMENSIONS.length} dimensions and determine which performs better overall.`}
                icon={<Trophy className="h-6 w-6" />}
            />

            {/* Visit status reminder */}
            {(!validation.bothVisited || !validation.sufficientTime || !validation.verificationPassed) && (
                <Alert variant="destructive">
                    <AlertTriangle className="h-4 w-4" />
                    <AlertDescription>
                        <div className="space-y-2">
                            <div className="font-medium">Please carefully review the comparison websites first:</div>
                            <ul className="text-sm space-y-1">
                                {!validation.linkAStatus?.visited && (
                                    <li>• Please view Option A webpage</li>
                                )}
                                {!validation.linkBStatus?.visited && (
                                    <li>• Please view Option B webpage</li>
                                )}
                                {validation.bothVisited && !validation.sufficientTime && (
                                    <li>• Please spend more time (total at least {MIN_VIEW_TIME_MS / 1000} seconds) carefully reviewing each webpage content</li>
                                )}
                                {hasVerificationCodes && !validation.verificationPassed && (
                                    <li>• Please correctly enter the verification code displayed on the webpage</li>
                                )}
                            </ul>
                        </div>
                    </AlertDescription>
                </Alert>
            )}

            {/* Visit status summary */}
            {validation.bothVisited && (
                <Card className="border-green-200 bg-green-50 dark:border-green-800 dark:bg-green-950">
                    <CardContent className="pt-6">
                        <div className="flex items-center gap-2 mb-2">
                            <CheckCircle className="h-5 w-5 text-green-600" />
                            <span className="font-medium text-green-800 dark:text-green-200">
                                Webpage Viewing Status
                            </span>
                        </div>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                            <div className="flex items-center justify-between">
                                <span>Option A viewing time:</span>
                                <span className={`font-medium ${validation.totalTimeA >= MIN_VIEW_TIME_MS ? 'text-green-600' : 'text-orange-600'}`}>
                                    {formatTime(validation.totalTimeA)}
                                </span>
                            </div>
                            <div className="flex items-center justify-between">
                                <span>Option B viewing time:</span>
                                <span className={`font-medium ${validation.totalTimeB >= MIN_VIEW_TIME_MS ? 'text-green-600' : 'text-orange-600'}`}>
                                    {formatTime(validation.totalTimeB)}
                                </span>
                            </div>
                        </div>
                        {validation.sufficientTime && validation.verificationPassed && (
                            <div className="mt-2 text-sm text-green-700 dark:text-green-300">
                                ✓ You have sufficiently reviewed both webpages and can start the evaluation
                            </div>
                        )}
                    </CardContent>
                </Card>
            )}

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
                    onPageVisit={handlePageVisit}
                />
                <LinkPreview
                    link={question.linkB}
                    label="Option B"
                    color="green"
                    onPageVisit={handlePageVisit}
                />
            </div>

            {/* Verification code input */}
            {hasVerificationCodes && (
                <div className="space-y-4">
                    <div>
                        <h2 className="text-xl font-semibold">Verification Code Validation</h2>
                        <p className="text-sm text-muted-foreground mt-1">
                            Please review the webpage content and enter the verification code displayed on the page to prove you have read it carefully.
                        </p>
                    </div>
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                        {question.linkA.verificationCode && (
                            <VerificationCodeInput
                                linkId={question.linkA.id}
                                linkTitle={question.linkA.title}
                                expectedCode={question.linkA.verificationCode}
                                onCodeValidation={handleCodeValidation}
                                color="blue"
                            />
                        )}
                        {question.linkB.verificationCode && (
                            <VerificationCodeInput
                                linkId={question.linkB.id}
                                linkTitle={question.linkB.title}
                                expectedCode={question.linkB.verificationCode}
                                onCodeValidation={handleCodeValidation}
                                color="green"
                            />
                        )}
                    </div>
                </div>
            )}

            {/* Dimension Evaluations */}
            <div className="space-y-6">
                <div>
                    <h2 className="text-xl font-semibold">Evaluation Dimensions</h2>
                    <p className="text-sm text-muted-foreground mt-1">
                        For each dimension, please select the better performing option and provide clear reasoning.
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
                            onPageVisit={handlePageVisit}
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
                    disabled={!isFormReadyForSubmission() || isSubmitting}
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