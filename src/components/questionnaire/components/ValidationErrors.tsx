import React from 'react';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { AlertCircle, AlertTriangle } from 'lucide-react';

interface ValidationError {
    dimensionLabel: string;
    error: string;
}

interface ValidationErrorsProps {
    visitErrors: {
        bothVisited: boolean;
        sufficientTime: boolean;
        verificationPassed: boolean;
        hasVerificationCodes: boolean;
        minViewTimeMs: number;
        linkAVisited?: boolean;
        linkBVisited?: boolean;
    };
    evaluationErrors: ValidationError[];
    minWordsRequired: number;
}

export function ValidationErrors({ visitErrors, evaluationErrors, minWordsRequired }: ValidationErrorsProps) {
    const hasVisitErrors = !visitErrors.bothVisited || !visitErrors.sufficientTime || !visitErrors.verificationPassed;

    if (!hasVisitErrors && evaluationErrors.length === 0) {
        return null;
    }

    return (
        <div className="space-y-4">
            {/* Visit status reminder */}
            {hasVisitErrors && (
                <Alert variant="destructive">
                    <AlertTriangle className="h-4 w-4" />
                    <AlertDescription>
                        <div className="space-y-2">
                            <div className="font-medium">Please carefully review the comparison websites first:</div>
                            <ul className="text-sm space-y-1">
                                {!visitErrors.linkAVisited && (
                                    <li>• Please view Option A webpage</li>
                                )}
                                {!visitErrors.linkBVisited && (
                                    <li>• Please view Option B webpage</li>
                                )}
                                {visitErrors.bothVisited && !visitErrors.sufficientTime && (
                                    <li>• Please spend more time (total at least {visitErrors.minViewTimeMs / 1000} seconds) carefully reviewing each webpage content</li>
                                )}
                                {visitErrors.hasVerificationCodes && !visitErrors.verificationPassed && (
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
                                <br />• Must be at least {minWordsRequired} words long
                                <br />• Must provide meaningful explanation (not just "good" or "bad")
                                <br />• Should clearly explain why one option is better than the other
                            </div>
                        </div>
                    </AlertDescription>
                </Alert>
            )}
        </div>
    );
} 