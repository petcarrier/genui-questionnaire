import { useState, useEffect, useCallback, useRef } from 'react';
import { DimensionEvaluation, VerificationCodeStatus } from '@/types/questionnaire';
import { QuestionnaireDraft } from '@/db/drafts';

interface EnhancedPageVisitStatus {
    [linkId: string]: {
        visited: boolean;
        duration: number;
        lastVisited?: number;
        visitCount: number;
        startTime?: number;
        isCurrentlyViewing: boolean;
        sessionStartTime?: number;
    };
}

interface UseDraftAutoSaveProps {
    annotatorId: string;
    questionId: string;
    questionnaireId: string;
    taskGroupId: string;
}

interface UseDraftAutoSaveResult {
    isDraftLoaded: boolean;
    lastSavedTime: Date | null;
    isSavingDraft: boolean;
    loadedDraft: {
        dimensionEvaluations?: DimensionEvaluation[];
        overallWinner?: 'A' | 'B' | 'tie';
        pageVisitStatus?: EnhancedPageVisitStatus;
        verificationCodeStatus?: VerificationCodeStatus;
    };
    saveDraft: (data: {
        dimensionEvaluations: DimensionEvaluation[];
        overallWinner: 'A' | 'B' | 'tie' | '';
        pageVisitStatus: EnhancedPageVisitStatus;
        verificationCodeStatus: VerificationCodeStatus;
    }) => Promise<void>;
}

export function useDraftAutoSave({
    annotatorId,
    questionId,
    questionnaireId,
    taskGroupId
}: UseDraftAutoSaveProps): UseDraftAutoSaveResult {
    const [isDraftLoaded, setIsDraftLoaded] = useState(false);
    const [lastSavedTime, setLastSavedTime] = useState<Date | null>(null);
    const [isSavingDraft, setIsSavingDraft] = useState(false);
    const [loadedDraft, setLoadedDraft] = useState<{
        dimensionEvaluations?: DimensionEvaluation[];
        overallWinner?: 'A' | 'B' | 'tie';
        pageVisitStatus?: EnhancedPageVisitStatus;
        verificationCodeStatus?: VerificationCodeStatus;
    }>({});

    const saveTimeoutRef = useRef<NodeJS.Timeout | null>(null);

    // Load draft data on mount
    useEffect(() => {
        const loadDraft = async () => {
            try {
                const response = await fetch(
                    `/api/questionnaire/draft?annotatorId=${annotatorId}&questionId=${questionId}&questionnaireId=${questionnaireId}`
                );
                const result = await response.json();

                if (result.success && result.draft) {
                    const draft: QuestionnaireDraft = result.draft;
                    setLoadedDraft({
                        dimensionEvaluations: draft.dimensionEvaluations,
                        overallWinner: draft.overallWinner,
                        pageVisitStatus: draft.pageVisitStatus as EnhancedPageVisitStatus,
                        verificationCodeStatus: draft.verificationCodeStatus
                    });
                    console.log('Draft loaded successfully');
                }
            } catch (error) {
                console.error('Error loading draft:', error);
            } finally {
                setIsDraftLoaded(true);
            }
        };

        loadDraft();
    }, [annotatorId, questionId, questionnaireId]);

    // Save draft function
    const saveDraft = useCallback(async (data: {
        dimensionEvaluations: DimensionEvaluation[];
        overallWinner: 'A' | 'B' | 'tie' | '';
        pageVisitStatus: EnhancedPageVisitStatus;
        verificationCodeStatus: VerificationCodeStatus;
    }) => {
        if (!isDraftLoaded) return;

        setIsSavingDraft(true);
        try {
            const draftData: QuestionnaireDraft = {
                annotatorId,
                questionId,
                questionnaireId,
                taskGroupId,
                dimensionEvaluations: data.dimensionEvaluations.length > 0 ? data.dimensionEvaluations : undefined,
                overallWinner: data.overallWinner || undefined,
                pageVisitStatus: Object.keys(data.pageVisitStatus).length > 0 ? data.pageVisitStatus as any : undefined,
                verificationCodeStatus: Object.keys(data.verificationCodeStatus).length > 0 ? data.verificationCodeStatus : undefined
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
    }, [isDraftLoaded, annotatorId, questionId, questionnaireId, taskGroupId]);

    // Cleanup timeout on unmount
    useEffect(() => {
        return () => {
            if (saveTimeoutRef.current) {
                clearTimeout(saveTimeoutRef.current);
            }
        };
    }, []);

    return {
        isDraftLoaded,
        lastSavedTime,
        isSavingDraft,
        loadedDraft,
        saveDraft
    };
} 