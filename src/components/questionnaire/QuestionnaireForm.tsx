import React, { useState, useEffect, useRef, useCallback } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Label } from '@/components/ui/label';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { CheckCircle, AlertCircle, Trophy, AlertTriangle, MessageSquare } from 'lucide-react';
import { LinkPreviewNormal } from '../preview/LinkPreviewNormal';
import { LinkPreviewSticky } from '../preview/LinkPreviewSticky';
import { DimensionEvaluationComponent } from './DimensionEvaluation';
import { VerificationCodeInput } from '../auth/VerificationCodeInput';
import { PageHeader } from '../common/PageHeader';
import { WinnerSummaryBadges } from '../common/WinnerSummaryBadges';
import {
    QuestionnaireQuestion,
    DimensionEvaluation,
    QuestionnaireResponse,
    EVALUATION_DIMENSIONS,
    VerificationCodeStatus
} from '@/types/questionnaire';
import { getEvaluationValidationErrors, MIN_WORDS_REQUIRED } from '@/utils/evaluationValidation';
import { QuestionnaireDraft } from '@/lib/db/drafts';

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

// Enhanced PageVisitStatus interface
interface EnhancedPageVisitStatus {
    [linkId: string]: {
        visited: boolean;
        duration: number;
        lastVisited?: number;
        visitCount: number;
        startTime?: number;
        isCurrentlyViewing: boolean;
        sessionStartTime?: number; // 第一次开始观看的时间
    };
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
    const [pageVisitStatus, setPageVisitStatus] = useState<EnhancedPageVisitStatus>({});
    const [verificationCodeStatus, setVerificationCodeStatus] = useState<VerificationCodeStatus>({});
    const [isPreviewSticky, setIsPreviewSticky] = useState(false);
    const [isDraftLoaded, setIsDraftLoaded] = useState(false);
    const [lastSavedTime, setLastSavedTime] = useState<Date | null>(null);
    const [isSavingDraft, setIsSavingDraft] = useState(false);

    const previewSectionRef = useRef<HTMLDivElement>(null);
    const saveTimeoutRef = useRef<NodeJS.Timeout | null>(null);

    // 加载草稿数据
    useEffect(() => {
        const loadDraft = async () => {
            try {
                const response = await fetch(
                    `/api/questionnaire/draft?annotatorId=${annotatorId}&questionId=${question.id}&questionnaireId=${questionnaireId}`
                );
                const result = await response.json();

                if (result.success && result.draft) {
                    const draft: QuestionnaireDraft = result.draft;

                    // 恢复评估数据
                    if (draft.dimensionEvaluations) {
                        setDimensionEvaluations(draft.dimensionEvaluations);
                    }

                    // 恢复总体胜者
                    if (draft.overallWinner) {
                        setOverallWinner(draft.overallWinner);
                    }

                    // 恢复页面访问状态
                    if (draft.pageVisitStatus) {
                        setPageVisitStatus(draft.pageVisitStatus as EnhancedPageVisitStatus);
                    }

                    // 恢复验证码状态
                    if (draft.verificationCodeStatus) {
                        setVerificationCodeStatus(draft.verificationCodeStatus);
                    }

                    console.log('Draft loaded successfully');
                }
            } catch (error) {
                console.error('Error loading draft:', error);
            } finally {
                setIsDraftLoaded(true);
            }
        };

        loadDraft();
    }, [annotatorId, question.id, questionnaireId]);

    // 防抖保存草稿函数
    const saveDraft = useCallback(async () => {
        if (!isDraftLoaded) return; // 等待草稿加载完成后再保存

        setIsSavingDraft(true);
        try {
            const draftData: QuestionnaireDraft = {
                annotatorId,
                questionId: question.id,
                questionnaireId,
                taskGroupId,
                dimensionEvaluations: dimensionEvaluations.length > 0 ? dimensionEvaluations : undefined,
                overallWinner: overallWinner || undefined,
                pageVisitStatus: Object.keys(pageVisitStatus).length > 0 ? pageVisitStatus as any : undefined,
                verificationCodeStatus: Object.keys(verificationCodeStatus).length > 0 ? verificationCodeStatus : undefined
            };

            const response = await fetch('/api/questionnaire/draft', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(draftData)
            });

            if (response.ok) {
                setLastSavedTime(new Date());
                console.log('Draft saved automatically');
            }
        } catch (error) {
            console.error('Error saving draft:', error);
        } finally {
            setIsSavingDraft(false);
        }
    }, [isDraftLoaded, annotatorId, question.id, questionnaireId, taskGroupId, dimensionEvaluations, overallWinner, pageVisitStatus, verificationCodeStatus]);

    // 延迟保存草稿
    const debouncedSaveDraft = useCallback(() => {
        if (saveTimeoutRef.current) {
            clearTimeout(saveTimeoutRef.current);
        }
        saveTimeoutRef.current = setTimeout(saveDraft, 1000); // 1秒后保存
    }, [saveDraft]);

    // 监听数据变化，自动保存草稿
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
                // Estimate sticky block height: padding (32px) + compact preview height (~80px) = ~112px
                const stickyBlockHeight = 112;
                // Show sticky block when hidden part exceeds sticky block height
                const shouldStick = rect.top <= -stickyBlockHeight;
                setIsPreviewSticky(shouldStick);
            }
        };

        window.addEventListener('scroll', handleScroll);
        return () => window.removeEventListener('scroll', handleScroll);
    }, []);

    // Real-time timer for updating visit durations
    useEffect(() => {
        const interval = setInterval(() => {
            setPageVisitStatus(prev => {
                const hasActiveViewing = Object.values(prev).some(status => status.isCurrentlyViewing);
                if (!hasActiveViewing) return prev;

                // Force a re-render to update display times
                return { ...prev };
            });
        }, 1000); // Update every second

        return () => clearInterval(interval);
    }, []);

    // Cleanup effect to handle component unmount
    useEffect(() => {
        return () => {
            // 清理定时器
            if (saveTimeoutRef.current) {
                clearTimeout(saveTimeoutRef.current);
            }

            // End all active viewing sessions when component unmounts
            setPageVisitStatus(prev => {
                const now = Date.now();
                const updated = { ...prev };
                let hasChanges = false;

                Object.keys(updated).forEach(linkId => {
                    const status = updated[linkId];
                    if (status.isCurrentlyViewing && status.startTime) {
                        const sessionDuration = now - status.startTime;
                        updated[linkId] = {
                            ...status,
                            duration: status.duration + sessionDuration,
                            startTime: undefined,
                            isCurrentlyViewing: false,
                            lastVisited: now,
                            // 保持sessionStartTime不变
                            sessionStartTime: status.sessionStartTime
                        };
                        hasChanges = true;
                    }
                });

                return hasChanges ? updated : prev;
            });
        };
    }, []);

    const handleDimensionEvaluation = (evaluation: DimensionEvaluation) => {
        setDimensionEvaluations(prev => {
            const filtered = prev.filter(e => e.dimensionId !== evaluation.dimensionId);
            return [...filtered, evaluation];
        });
    };

    const handlePageVisit = (linkId: string, visited: boolean, duration?: number) => {
        const now = Date.now();
        setPageVisitStatus(prev => {
            const currentStatus = prev[linkId] || {
                visited: false,
                duration: 0,
                visitCount: 0,
                isCurrentlyViewing: false
            };

            let newStatus = { ...currentStatus };

            if (visited) {
                // Start viewing
                if (!currentStatus.isCurrentlyViewing) {
                    newStatus.startTime = now;
                    newStatus.isCurrentlyViewing = true;
                    newStatus.visitCount = currentStatus.visitCount + 1;
                    newStatus.visited = true;

                    // 记录第一次开始观看的时间
                    if (!currentStatus.sessionStartTime) {
                        newStatus.sessionStartTime = now;
                    }
                }
            } else {
                // Stop viewing
                if (currentStatus.isCurrentlyViewing && currentStatus.startTime) {
                    const sessionDuration = now - currentStatus.startTime;
                    newStatus.duration = currentStatus.duration + sessionDuration;
                    newStatus.startTime = undefined; // 清除当前会话开始时间
                    newStatus.isCurrentlyViewing = false;
                    newStatus.lastVisited = now;
                    // 保持sessionStartTime不变，不清除
                }
            }

            return {
                ...prev,
                [linkId]: newStatus
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
    // const hasVerificationCodes = question.linkA.verificationCode || question.linkB.verificationCode;
    const hasVerificationCodes = false;

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
            dimensionEvaluations.some(evaluation => evaluation.dimensionId === dim.id && evaluation.winner && evaluation.winner.length > 0)
        );
        const allNotesValid = getEvaluationValidationErrors(dimensionEvaluations, EVALUATION_DIMENSIONS).length === 0;
        return allDimensionsEvaluated && allNotesValid && overallWinner;
    };

    const isFormReadyForSubmission = () => {
        const formValid = isFormValid();
        const { bothVisited, sufficientTime, verificationPassed } = getVisitValidation();
        return formValid && bothVisited && sufficientTime && verificationPassed;
    };

    const handleSubmit = async () => {
        const validation = getVisitValidation();
        const evaluationErrors = getEvaluationValidationErrors(dimensionEvaluations, EVALUATION_DIMENSIONS);

        if (evaluationErrors.length > 0) {
            setSubmitError('Please complete all evaluation requirements. Check the validation errors below.');
            return;
        }

        if (!overallWinner) {
            setSubmitError('Please select an overall winner.');
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
                // Add visit data - convert EnhancedPageVisitStatus to PageVisitStatus
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
    const evaluationErrors = getEvaluationValidationErrors(dimensionEvaluations, EVALUATION_DIMENSIONS);

    // Format time display
    const formatTime = (milliseconds: number): string => {
        const seconds = Math.floor(milliseconds / 1000);
        if (seconds < 60) return `${seconds}s`;
        const minutes = Math.floor(seconds / 60);
        const remainingSeconds = seconds % 60;
        return `${minutes}m ${remainingSeconds}s`;
    };

    // Get visit status for LinkActions
    const getVisitStatusForLink = (linkId: string) => {
        const status = pageVisitStatus[linkId];
        if (!status) {
            return { visited: false, duration: 0, visitCount: 0, isCurrentlyViewing: false };
        }

        // Calculate current duration if currently viewing
        let currentDuration = status.duration;
        if (status.isCurrentlyViewing && status.startTime) {
            currentDuration += Date.now() - status.startTime;
        }

        return {
            visited: status.visited,
            duration: currentDuration,
            visitCount: status.visitCount,
            isCurrentlyViewing: status.isCurrentlyViewing
        };
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
            {isDraftLoaded && (
                <div className="flex justify-between items-center text-sm text-muted-foreground bg-muted/30 px-4 py-2 rounded-lg">
                    <div className="flex items-center gap-2">
                        {isSavingDraft ? (
                            <>
                                <div className="animate-spin rounded-full h-3 w-3 border-b-2 border-blue-600"></div>
                                <span>Saving draft...</span>
                            </>
                        ) : lastSavedTime ? (
                            <>
                                <CheckCircle className="h-3 w-3 text-green-600" />
                                <span>Draft auto-saved at {lastSavedTime.toLocaleTimeString()}</span>
                            </>
                        ) : (
                            <>
                                <AlertCircle className="h-3 w-3 text-orange-600" />
                                <span>Preparing auto-save...</span>
                            </>
                        )}
                    </div>
                    <span className="text-xs text-muted-foreground">
                        Content is auto-saved, page refresh will not lose progress
                    </span>
                </div>
            )}

            {/* User Query Display */}
            <Card className="border-purple-200 bg-purple-50 dark:border-purple-800 dark:bg-purple-950">
                <CardHeader>
                    <CardTitle className="flex items-center gap-2 text-purple-800 dark:text-purple-200">
                        <MessageSquare className="h-5 w-5" />
                        User Query
                    </CardTitle>
                </CardHeader>
                <CardContent>
                    <div className="bg-white dark:bg-gray-800 rounded-lg p-4 border border-purple-200 dark:border-purple-700">
                        <p className="text-gray-800 dark:text-gray-200 leading-relaxed">
                            {question.userQuery}
                        </p>
                    </div>
                    <p className="text-sm text-purple-600 dark:text-purple-400 mt-3">
                        Please evaluate both websites based on how well they address this user query.
                    </p>
                </CardContent>
            </Card>

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
                <div className="fixed top-0 left-0 right-0 z-50 bg-background/98 backdrop-blur-sm border-b border-border">
                    <div className="max-w-6xl mx-auto px-4 py-2">
                        {/* First row: Draft status and Winner Summary */}
                        <div className="flex items-center justify-between mb-1 gap-4">
                            {/* Draft Save Status - Compact */}
                            <div className="flex items-center gap-2 text-xs text-muted-foreground">
                                {isSavingDraft ? (
                                    <>
                                        <div className="animate-spin rounded-full h-3 w-3 border-b-2 border-blue-600"></div>
                                        <span>Saving...</span>
                                    </>
                                ) : lastSavedTime ? (
                                    <>
                                        <CheckCircle className="h-3 w-3 text-green-600" />
                                        <span>Saved {lastSavedTime.toLocaleTimeString()}</span>
                                    </>
                                ) : (
                                    <>
                                        <AlertCircle className="h-3 w-3 text-orange-600" />
                                        <span>Preparing...</span>
                                    </>
                                )}
                            </div>

                            {/* Winner Summary - Compact */}
                            <div className="flex items-center gap-1 text-xs text-muted-foreground">
                                {aWins > 0 && (
                                    <span className="px-1.5 py-0.5 bg-blue-100 text-blue-700 rounded text-xs">A:{aWins}</span>
                                )}
                                {bWins > 0 && (
                                    <span className="px-1.5 py-0.5 bg-green-100 text-green-700 rounded text-xs">B:{bWins}</span>
                                )}
                                {ties > 0 && (
                                    <span className="px-1.5 py-0.5 bg-gray-100 text-gray-700 rounded text-xs">Tie:{ties}</span>
                                )}
                                {overallWinner && (
                                    <div className="flex items-center gap-1 ml-2">
                                        <Trophy className="h-3 w-3 text-yellow-600" />
                                        <span className="text-xs font-medium">
                                            {overallWinner === 'A' ? 'A' : overallWinner === 'B' ? 'B' : 'Tie'}
                                        </span>
                                    </div>
                                )}
                            </div>
                        </div>

                        {/* Second row: User Query - Full width */}
                        <div className="flex items-center gap-2 mb-2">
                            <MessageSquare className="h-3 w-3 text-purple-600 flex-shrink-0" />
                            <span className="text-xs text-purple-600 font-medium">Query:</span>
                            <div className="text-xs text-gray-600 dark:text-gray-400 line-clamp-2 flex-1">
                                {question.userQuery}
                            </div>
                        </div>

                        {/* Third row: Link previews */}
                        <div className="grid grid-cols-1 lg:grid-cols-2 gap-2">
                            <LinkPreviewSticky
                                link={question.linkA}
                                label="Option A"
                                color="blue"
                                onPageVisit={handlePageVisit}
                                visitStatus={getVisitStatusForLink(question.linkA.id)}
                            />
                            <LinkPreviewSticky
                                link={question.linkB}
                                label="Option B"
                                color="green"
                                onPageVisit={handlePageVisit}
                                visitStatus={getVisitStatusForLink(question.linkB.id)}
                            />
                        </div>
                    </div>
                </div>
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

            {/* Evaluation Validation Errors */}
            {evaluationErrors.length > 0 && (
                <Alert variant="destructive">
                    <AlertCircle className="h-4 w-4" />
                    <AlertDescription>
                        <div className="space-y-2">
                            <div className="font-medium">Please complete the following evaluation requirements:</div>
                            <ul className="text-sm space-y-1">
                                {evaluationErrors.map((error, index) => (
                                    <li key={index}>
                                        • <strong>{error.dimensionLabel}:</strong> {error.error}
                                    </li>
                                ))}
                            </ul>
                            <div className="mt-2 text-xs text-muted-foreground">
                                <strong>Requirements for evaluation reasons:</strong>
                                <br />• Must be at least {MIN_WORDS_REQUIRED} words long
                                <br />• Must provide meaningful explanation (not just "good" or "bad")
                                <br />• Should clearly explain why one option is better than the other
                            </div>
                        </div>
                    </AlertDescription>
                </Alert>
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