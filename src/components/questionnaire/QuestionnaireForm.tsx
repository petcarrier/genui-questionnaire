import React, { useState, useEffect, useRef, useCallback } from 'react';
import { Trophy } from 'lucide-react';
import { LinkPreviewNormal } from '../preview/LinkPreviewNormal';
import { DimensionEvaluationComponent } from './DimensionEvaluation';
import { VerificationCodeInput } from '../auth/VerificationCodeInput';
import { PageHeader } from '../common/PageHeader';
import { WinnerSummaryBadges } from '../common/WinnerSummaryBadges';
import {
    UserQueryDisplay,
    DraftStatusDisplay,
    OverallWinnerSelection,
    VisitStatusSummary,
    ValidationErrors,
    SubmitActions,
    StickyHeaderContent
} from './components';
import {
    useDraftAutoSave,
    usePageVisitTracking,
    useFormValidation
} from './hooks';
import {
    QuestionnaireQuestion,
    DimensionEvaluation,
    QuestionnaireResponse,
    EVALUATION_DIMENSIONS,
    VerificationCodeStatus
} from '@/types/questionnaire';
import { MIN_WORDS_REQUIRED } from '@/utils/evaluationValidation';

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
    const [verificationCodeStatus, setVerificationCodeStatus] = useState<VerificationCodeStatus>({});
    const [isPreviewSticky, setIsPreviewSticky] = useState(false);

    const previewSectionRef = useRef<HTMLDivElement>(null);
    const saveTimeoutRef = useRef<NodeJS.Timeout | null>(null);

    // Custom hooks
    const { isDraftLoaded, lastSavedTime, isSavingDraft, loadedDraft, saveDraft } = useDraftAutoSave({
        annotatorId,
        questionId: question.id,
        questionnaireId,
        taskGroupId
    });

    const { pageVisitStatus, handlePageVisit, getVisitStatusForLink } = usePageVisitTracking(
        loadedDraft.pageVisitStatus || {}
    );

    const hasVerificationCodes = false; // question.linkA.verificationCode || question.linkB.verificationCode;

    const {
        isFormValid,
        isFormReadyForSubmission,
        visitValidation,
        evaluationErrors,
        winnerSummary
    } = useFormValidation({
        dimensionEvaluations,
        overallWinner,
        pageVisitStatus,
        verificationCodeStatus,
        hasVerificationCodes,
        minViewTimeMs: MIN_VIEW_TIME_MS,
        linkAId: question.linkA.id,
        linkBId: question.linkB.id
    });

    // Load draft data when it becomes available
    useEffect(() => {
        if (isDraftLoaded && loadedDraft) {
            if (loadedDraft.dimensionEvaluations) {
                setDimensionEvaluations(loadedDraft.dimensionEvaluations);
            }
            if (loadedDraft.overallWinner) {
                setOverallWinner(loadedDraft.overallWinner);
            }
            if (loadedDraft.verificationCodeStatus) {
                setVerificationCodeStatus(loadedDraft.verificationCodeStatus);
            }
        }
    }, [isDraftLoaded, loadedDraft]);

    // Auto-save draft with debouncing
    const debouncedSaveDraft = useCallback(() => {
        if (saveTimeoutRef.current) {
            clearTimeout(saveTimeoutRef.current);
        }
        saveTimeoutRef.current = setTimeout(() => {
            saveDraft({
                dimensionEvaluations,
                overallWinner,
                pageVisitStatus,
                verificationCodeStatus
            });
        }, 1000);
    }, [saveDraft, dimensionEvaluations, overallWinner, pageVisitStatus, verificationCodeStatus]);

    // Auto-save when data changes
    useEffect(() => {
        if (isDraftLoaded) {
            debouncedSaveDraft();
        }
    }, [dimensionEvaluations, overallWinner, pageVisitStatus, verificationCodeStatus, isDraftLoaded, debouncedSaveDraft]);

    // Handle sticky preview behavior
    useEffect(() => {
        const handleScroll = () => {
            if (previewSectionRef.current) {
                const rect = previewSectionRef.current.getBoundingClientRect();
                const stickyBlockHeight = 112;
                const shouldStick = rect.top <= -stickyBlockHeight;
                setIsPreviewSticky(shouldStick);
            }
        };

        window.addEventListener('scroll', handleScroll);
        return () => window.removeEventListener('scroll', handleScroll);
    }, []);

    // Cleanup effect
    useEffect(() => {
        return () => {
            if (saveTimeoutRef.current) {
                clearTimeout(saveTimeoutRef.current);
            }
        };
    }, []);

    const handleDimensionEvaluation = (evaluation: DimensionEvaluation) => {
        setDimensionEvaluations(prev => {
            const filtered = prev.filter(e => e.dimensionId !== evaluation.dimensionId);
            return [...filtered, evaluation];
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

    const handleSubmit = async () => {
        if (evaluationErrors.length > 0) {
            setSubmitError('Please complete all evaluation requirements. Check the validation errors below.');
            return;
        }

        if (!overallWinner) {
            setSubmitError('Please select an overall winner.');
            return;
        }

        if (!visitValidation.bothVisited) {
            setSubmitError('Please view both comparison websites before submitting your evaluation.');
            return;
        }

        if (!visitValidation.sufficientTime) {
            setSubmitError(`Please spend sufficient time (total at least ${MIN_VIEW_TIME_MS / 1000} seconds) carefully reviewing each webpage content.`);
            return;
        }

        if (!visitValidation.verificationPassed) {
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
                metadata: {
                    pageVisitStatus: Object.fromEntries(
                        Object.entries(pageVisitStatus).map(([linkId, status]) => [
                            linkId,
                            {
                                visited: status.visited,
                                duration: status.duration,
                                lastVisited: status.lastVisited,
                                visitCount: status.visitCount,
                                startTime: status.startTime,
                                isCurrentlyViewing: status.isCurrentlyViewing,
                                sessionStartTime: status.sessionStartTime
                            }
                        ])
                    ),
                    totalViewTime: visitValidation.totalTimeA + visitValidation.totalTimeB
                }
            };

            await onSubmit(response);
        } catch (error) {
            setSubmitError('Submission failed. Please try again.');
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <div className="max-w-6xl mx-auto space-y-8">
            {/* Header */}
            <PageHeader
                title="Website Comparison Evaluation"
                description={`Please compare these two websites across ${EVALUATION_DIMENSIONS.length} dimensions and determine which performs better overall.`}
                icon={<Trophy className="h-6 w-6" />}
            />

            {/* Draft Status Display */}
            <DraftStatusDisplay
                isDraftLoaded={isDraftLoaded}
                isSavingDraft={isSavingDraft}
                lastSavedTime={lastSavedTime}
            />

            {/* User Query Display */}
            <UserQueryDisplay userQuery={question.userQuery} />

            {/* Website Previews - Original Block */}
            <div ref={previewSectionRef} className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <LinkPreviewNormal
                    link={question.linkA}
                    label="Option A"
                    color="blue"
                    onPageVisit={handlePageVisit}
                    visitStatus={getVisitStatusForLink(question.linkA.id)}
                />
                <LinkPreviewNormal
                    link={question.linkB}
                    label="Option B"
                    color="green"
                    onPageVisit={handlePageVisit}
                    visitStatus={getVisitStatusForLink(question.linkB.id)}
                />
            </div>

            {/* Website Previews - Sticky Block */}
            {isPreviewSticky && (
                <StickyHeaderContent
                    isSavingDraft={isSavingDraft}
                    lastSavedTime={lastSavedTime}
                    aWins={winnerSummary.aWins}
                    bWins={winnerSummary.bWins}
                    ties={winnerSummary.ties}
                    overallWinner={overallWinner}
                    userQuery={question.userQuery}
                    linkA={question.linkA}
                    linkB={question.linkB}
                    onPageVisit={handlePageVisit}
                    getVisitStatusForLink={getVisitStatusForLink}
                />
            )}

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
                            userQuery={question.userQuery}
                            allEvaluations={dimensionEvaluations}
                            allDimensions={EVALUATION_DIMENSIONS}
                        />
                    ))}
                </div>
            </div>

            {/* Overall Winner Selection */}
            <OverallWinnerSelection
                linkA={question.linkA}
                linkB={question.linkB}
                overallWinner={overallWinner}
                onWinnerChange={setOverallWinner}
            />

            {/* Visit Status Summary */}
            <VisitStatusSummary
                bothVisited={visitValidation.bothVisited}
                sufficientTime={visitValidation.sufficientTime}
                totalTimeA={visitValidation.totalTimeA}
                totalTimeB={visitValidation.totalTimeB}
                verificationPassed={visitValidation.verificationPassed}
                minViewTimeMs={MIN_VIEW_TIME_MS}
            />

            {/* Validation Errors */}
            <ValidationErrors
                visitErrors={{
                    bothVisited: visitValidation.bothVisited,
                    sufficientTime: visitValidation.sufficientTime,
                    verificationPassed: visitValidation.verificationPassed,
                    hasVerificationCodes,
                    minViewTimeMs: MIN_VIEW_TIME_MS,
                    linkAVisited: visitValidation.linkAStatus?.visited,
                    linkBVisited: visitValidation.linkBStatus?.visited
                }}
                evaluationErrors={evaluationErrors}
                minWordsRequired={MIN_WORDS_REQUIRED}
            />

            {/* Winner Summary */}
            <div className="flex justify-center">
                <WinnerSummaryBadges
                    aWins={winnerSummary.aWins}
                    bWins={winnerSummary.bWins}
                    ties={winnerSummary.ties}
                    linkATitle={question.linkA.title}
                    linkBTitle={question.linkB.title}
                    showTitles={false}
                />
            </div>

            {/* Submit Actions */}
            <SubmitActions
                isFormReadyForSubmission={isFormReadyForSubmission}
                isSubmitting={isSubmitting}
                submitError={submitError}
                onSubmit={handleSubmit}
                showNextButton={showNextButton}
                onNext={onNext}
            />
        </div>
    );
} 