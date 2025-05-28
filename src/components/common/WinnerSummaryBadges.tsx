import React from 'react';
import { Badge } from '@/components/ui/badge';

interface WinnerSummaryBadgesProps {
    aWins: number;
    bWins: number;
    ties: number;
    linkATitle?: string;
    linkBTitle?: string;
    showTitles?: boolean;
}

export function WinnerSummaryBadges({
    aWins,
    bWins,
    ties,
    linkATitle = 'Option A',
    linkBTitle = 'Option B',
    showTitles = false
}: WinnerSummaryBadgesProps) {
    return (
        <div className="flex gap-4">
            <Badge variant="outline" className="text-blue-600">
                {showTitles ? linkATitle : 'Option A'}: {aWins} wins
            </Badge>
            <Badge variant="outline" className="text-green-600">
                {showTitles ? linkBTitle : 'Option B'}: {bWins} wins
            </Badge>
            <Badge variant="outline" className="text-gray-600">
                Ties: {ties}
            </Badge>
        </div>
    );
} 