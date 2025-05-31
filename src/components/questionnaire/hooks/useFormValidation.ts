import { useMemo } from 'react';
import {
    DimensionEvaluation,
    VerificationCodeStatus,
    EVALUATION_DIMENSIONS
} from '@/types/questionnaire';
import { getEvaluationValidationErrors } from '@/utils/evaluationValidation';
import { EnhancedPageVisitStatus } from './usePageVisitTracking';

interface UseFormValidationProps {
    dimensionEvaluations: DimensionEvaluation[];
    overallWinner: 'A' | 'B' | 'tie' | '';
    pageVisitStatus: EnhancedPageVisitStatus;
    verificationCodeStatus: VerificationCodeStatus;
    hasVerificationCodes: boolean;
    minViewTimeMs: number;
    linkAId: string;
    linkBId: string;
}

interface UseFormValidationResult {
    // Form validity
    isFormValid: boolean;
    isFormReadyForSubmission: boolean;

    // Visit validation
    visitValidation: {
        bothVisited: boolean;
        sufficientTime: boolean;
        verificationPassed: boolean;
        linkAStatus: any;
        linkBStatus: any;
        totalTimeA: number;
        totalTimeB: number;
    };

    // Evaluation validation
    evaluationErrors: Array<{ dimensionLabel: string; error: string }>;

    // Winner summary
    winnerSummary: {
        aWins: number;
        bWins: number;
        ties: number;
    };
}

export function useFormValidation({
    dimensionEvaluations,
    overallWinner,
    pageVisitStatus,
    verificationCodeStatus,
    hasVerificationCodes,
    minViewTimeMs,
    linkAId,
    linkBId
}: UseFormValidationProps): UseFormValidationResult {

    // Visit validation
    const visitValidation = useMemo(() => {
        const linkAStatus = pageVisitStatus[linkAId];
        const linkBStatus = pageVisitStatus[linkBId];

        const bothVisited = linkAStatus?.visited && linkBStatus?.visited;
        const sufficientTimeA = (linkAStatus?.duration || 0) >= minViewTimeMs;
        const sufficientTimeB = (linkBStatus?.duration || 0) >= minViewTimeMs;
        const sufficientTime = sufficientTimeA && sufficientTimeB;

        let verificationPassed = true;
        if (hasVerificationCodes) {
            const linkACodeValid = verificationCodeStatus[linkAId]?.isValid;
            const linkBCodeValid = verificationCodeStatus[linkBId]?.isValid;
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
    }, [pageVisitStatus, verificationCodeStatus, hasVerificationCodes, minViewTimeMs, linkAId, linkBId]);

    // Evaluation validation
    const evaluationErrors = useMemo(() => {
        return getEvaluationValidationErrors(dimensionEvaluations, EVALUATION_DIMENSIONS);
    }, [dimensionEvaluations]);

    // Form validity checks
    const isFormValid = useMemo(() => {
        const allDimensionsEvaluated = EVALUATION_DIMENSIONS.every(dim =>
            dimensionEvaluations.some(evaluation =>
                evaluation.dimensionId === dim.id &&
                evaluation.winner &&
                evaluation.winner.length > 0
            )
        );
        const allNotesValid = evaluationErrors.length === 0;
        return allDimensionsEvaluated && allNotesValid && !!overallWinner;
    }, [dimensionEvaluations, evaluationErrors, overallWinner]);

    const isFormReadyForSubmission = useMemo(() => {
        return isFormValid &&
            visitValidation.bothVisited &&
            visitValidation.sufficientTime &&
            visitValidation.verificationPassed;
    }, [isFormValid, visitValidation]);

    // Winner summary
    const winnerSummary = useMemo(() => {
        const aWins = dimensionEvaluations.filter(e => e.winner === 'A').length;
        const bWins = dimensionEvaluations.filter(e => e.winner === 'B').length;
        const ties = dimensionEvaluations.filter(e => e.winner === 'tie').length;

        return { aWins, bWins, ties };
    }, [dimensionEvaluations]);

    return {
        isFormValid,
        isFormReadyForSubmission,
        visitValidation,
        evaluationErrors,
        winnerSummary
    };
} 