import React from 'react';
import { CheckCircle, AlertCircle, Trophy, MessageSquare } from 'lucide-react';
import { LinkPreviewSticky } from '../../preview/LinkPreviewSticky';
import { ComparisonLink } from '@/types/questionnaire';

interface StickyHeaderContentProps {
    // Draft status
    isSavingDraft: boolean;
    lastSavedTime: Date | null;

    // Winner summary
    aWins: number;
    bWins: number;
    ties: number;
    overallWinner: 'A' | 'B' | 'tie' | '';

    // User query
    userQuery: string;

    // Links and visit tracking
    linkA: ComparisonLink;
    linkB: ComparisonLink;
    onPageVisit: (linkId: string, visited: boolean, duration?: number) => void;
    getVisitStatusForLink: (linkId: string) => {
        visited: boolean;
        duration: number;
        visitCount: number;
        isCurrentlyViewing: boolean;
    };
}

export function StickyHeaderContent({
    isSavingDraft,
    lastSavedTime,
    aWins,
    bWins,
    ties,
    overallWinner,
    userQuery,
    linkA,
    linkB,
    onPageVisit,
    getVisitStatusForLink
}: StickyHeaderContentProps) {
    return (
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
                        {userQuery}
                    </div>
                </div>

                {/* Third row: Link previews */}
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-2">
                    <LinkPreviewSticky
                        link={linkA}
                        label="Option A"
                        color="blue"
                        onPageVisit={onPageVisit}
                        visitStatus={getVisitStatusForLink(linkA.id)}
                    />
                    <LinkPreviewSticky
                        link={linkB}
                        label="Option B"
                        color="green"
                        onPageVisit={onPageVisit}
                        visitStatus={getVisitStatusForLink(linkB.id)}
                    />
                </div>
            </div>
        </div>
    );
} 