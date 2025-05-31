import React, { useState } from 'react';
import { Card, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { ImageIcon, CheckCircle, Eye, Timer } from 'lucide-react';
import { ComparisonLink, PageVisitStatus } from '@/types/questionnaire';
import { LinkActions } from './LinkActions';

interface LinkPreviewNormalProps {
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

export function LinkPreviewNormal({
    link,
    label,
    color,
    onPageVisit,
    visitStatus
}: LinkPreviewNormalProps) {
    const [showPreview, setShowPreview] = useState(false);

    const colorClasses = {
        blue: 'border-blue-200 dark:border-blue-800',
        green: 'border-green-200 dark:border-green-800'
    };

    const badgeVariants = {
        blue: 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200',
        green: 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200'
    };

    const formatTime = (milliseconds: number): string => {
        const seconds = Math.floor(milliseconds / 1000);
        if (seconds < 60) return `${seconds}s`;
        const minutes = Math.floor(seconds / 60);
        const remainingSeconds = seconds % 60;
        return `${minutes}m ${remainingSeconds}s`;
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
        <Card className={`w-full ${colorClasses[color]}`}>
            <CardHeader>
                <div className="w-full space-y-2">
                    <div className="flex items-center gap-2">
                        <Badge variant="secondary" className={badgeVariants[color]}>
                            {label}
                        </Badge>
                        <CardTitle className="text-lg">{link.title}</CardTitle>
                    </div>

                    {link.description && (
                        <p className="text-sm text-muted-foreground">{link.description}</p>
                    )}

                    {/* Screenshot display for normal mode */}
                    {link.screenshotUrl && (
                        <div className="mt-3">
                            <div className="flex items-center gap-2 mb-2">
                                <ImageIcon className="w-4 h-4 text-muted-foreground" />
                                <span className="text-sm font-medium text-muted-foreground">Page Preview</span>
                            </div>
                            <div className="border rounded-lg overflow-hidden bg-muted/30">
                                <img
                                    src={link.screenshotUrl}
                                    alt={`Screenshot of ${link.title}`}
                                    className="w-full h-48 object-cover object-top hover:scale-105 transition-transform cursor-pointer"
                                    onClick={handleImageClick}
                                    title="Click to open fullscreen preview"
                                />
                            </div>
                        </div>
                    )}
                </div>

                <div className="flex gap-2 pt-2">
                    <LinkActions
                        link={link}
                        label={label}
                        color={color}
                        size="sm"
                        variant="outline"
                        showLabels={true}
                        onPageVisit={handlePageVisit}
                        externalShowPreview={showPreview}
                        onPreviewChange={handlePreviewChange}
                        visitStatus={visitStatus}
                        showVisitStatus={false}
                    />
                </div>

                {/* Visit status indicator - moved to separate row in normal mode */}
                {visitStatus && (visitStatus.visited || visitStatus.duration > 0) && (
                    <div className="flex items-center gap-2 text-xs mt-2">
                        <div className="flex items-center gap-1">
                            {visitStatus.visited ? (
                                <CheckCircle className="h-3 w-3 text-green-500" />
                            ) : (
                                <Eye className="h-3 w-3 text-blue-500" />
                            )}
                            <span className={visitStatus.visited ? "text-green-600" : "text-blue-600"}>
                                {visitStatus.visited ? "Viewed" : "Visited"}
                            </span>
                        </div>
                        {visitStatus.duration > 0 && (
                            <div className="flex items-center gap-1">
                                <Timer className="h-3 w-3 text-gray-500" />
                                <span className="text-gray-600">
                                    {formatTime(visitStatus.duration)}
                                </span>
                            </div>
                        )}
                        {visitStatus.visitCount > 1 && (
                            <span className="text-gray-500">
                                ({visitStatus.visitCount} times)
                            </span>
                        )}
                    </div>
                )}
            </CardHeader>
        </Card>
    );
} 