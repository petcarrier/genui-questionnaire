import React from 'react';
import { CheckCircle, AlertCircle } from 'lucide-react';

interface DraftStatusDisplayProps {
    isDraftLoaded: boolean;
    isSavingDraft: boolean;
    lastSavedTime: Date | null;
}

export function DraftStatusDisplay({
    isDraftLoaded,
    isSavingDraft,
    lastSavedTime
}: DraftStatusDisplayProps) {
    if (!isDraftLoaded) return null;

    return (
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
        </div>
    );
} 