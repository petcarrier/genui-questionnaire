import React from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { CheckCircle } from 'lucide-react';

interface VisitStatusSummaryProps {
    bothVisited: boolean;
    sufficientTime: boolean;
    totalTimeA: number;
    totalTimeB: number;
    verificationPassed: boolean;
    minViewTimeMs: number;
}

export function VisitStatusSummary({
    bothVisited,
    sufficientTime,
    totalTimeA,
    totalTimeB,
    verificationPassed,
    minViewTimeMs
}: VisitStatusSummaryProps) {
    // Format time display
    const formatTime = (milliseconds: number): string => {
        const seconds = Math.floor(milliseconds / 1000);
        if (seconds < 60) return `${seconds}s`;
        const minutes = Math.floor(seconds / 60);
        const remainingSeconds = seconds % 60;
        return `${minutes}m ${remainingSeconds}s`;
    };

    if (!bothVisited) return null;

    return (
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
                        <span className={`font-medium ${totalTimeA >= minViewTimeMs ? 'text-green-600' : 'text-orange-600'}`}>
                            {formatTime(totalTimeA)}
                        </span>
                    </div>
                    <div className="flex items-center justify-between">
                        <span>Option B viewing time:</span>
                        <span className={`font-medium ${totalTimeB >= minViewTimeMs ? 'text-green-600' : 'text-orange-600'}`}>
                            {formatTime(totalTimeB)}
                        </span>
                    </div>
                </div>
                {sufficientTime && verificationPassed && (
                    <div className="mt-2 text-sm text-green-700 dark:text-green-300">
                        ✓ You have sufficiently reviewed both webpages and can start the evaluation
                    </div>
                )}
            </CardContent>
        </Card>
    );
} 