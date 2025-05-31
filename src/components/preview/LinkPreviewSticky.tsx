import React, { useState } from 'react';
import { Badge } from '@/components/ui/badge';
import { ComparisonLink, PageVisitStatus } from '@/types/questionnaire';
import { LinkActions } from './LinkActions';

interface LinkPreviewStickyProps {
    link: ComparisonLink;
    label: string;
    color: 'blue' | 'green';
    onPageVisit?: (linkId: string, visited: boolean, duration?: number) => void;
    visitStatus?: {
        visited: boolean;
        duration: number;
        visitCount: number;
        isCurrentlyViewing: boolean;
    };
}

export function LinkPreviewSticky({
    link,
    label,
    color,
    onPageVisit,
    visitStatus
}: LinkPreviewStickyProps) {
    const [showPreview, setShowPreview] = useState(false);

    const colorClasses = {
        blue: 'border-l-blue-400 bg-blue-50/50 dark:bg-blue-950/20',
        green: 'border-l-green-400 bg-green-50/50 dark:bg-green-950/20'
    };

    const badgeVariants = {
        blue: 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200',
        green: 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200'
    };

    const handlePageVisit = (visited: boolean, duration?: number) => {
        if (onPageVisit) {
            onPageVisit(link.id, visited, duration);
        }
    };

    const handleImageClick = () => {
        setShowPreview(true);
    };

    const handlePreviewChange = (newShowPreview: boolean) => {
        setShowPreview(newShowPreview);
    };

    return (
        <div className={`${colorClasses[color]} border-l-4 rounded-r-md p-3 flex items-center gap-3`}>
            {/* Left side: Badge, title and actions */}
            <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-1">
                    <Badge variant="secondary" className={`${badgeVariants[color]} text-xs px-2 py-0.5`}>
                        {label}
                    </Badge>
                    <h3 className="text-sm font-medium truncate">{link.title}</h3>
                </div>

                <div className="flex gap-1">
                    <LinkActions
                        link={link}
                        label={label}
                        color={color}
                        size="sm"
                        variant="outline"
                        showLabels={false}
                        onPageVisit={handlePageVisit}
                        externalShowPreview={showPreview}
                        onPreviewChange={handlePreviewChange}
                        visitStatus={visitStatus}
                    />
                </div>
            </div>

            {/* Right side: Compact screenshot */}
            {link.screenshotUrl && (
                <div className="flex-shrink-0">
                    <div className="border rounded overflow-hidden bg-muted/30 w-20 h-14">
                        <img
                            src={link.screenshotUrl}
                            alt={`Screenshot of ${link.title}`}
                            className="w-20 h-14 object-cover object-top hover:scale-105 transition-transform cursor-pointer"
                            onClick={handleImageClick}
                            title="Click to open fullscreen preview"
                        />
                    </div>
                </div>
            )}
        </div>
    );
} 