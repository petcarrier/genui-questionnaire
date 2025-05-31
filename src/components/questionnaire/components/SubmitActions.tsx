import React from 'react';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { CheckCircle, AlertCircle } from 'lucide-react';

interface SubmitActionsProps {
    isFormReadyForSubmission: boolean;
    isSubmitting: boolean;
    submitError: string;
    onSubmit: () => void;
    showNextButton?: boolean;
    onNext?: () => void;
}

export function SubmitActions({
    isFormReadyForSubmission,
    isSubmitting,
    submitError,
    onSubmit,
    showNextButton = false,
    onNext
}: SubmitActionsProps) {
    return (
        <div className="space-y-4">
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
                    onClick={onSubmit}
                    disabled={!isFormReadyForSubmission || isSubmitting}
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