import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ExternalLink, Maximize, X, Eye, Timer, CheckCircle } from 'lucide-react';
import { ComparisonLink } from '@/types/questionnaire';

interface LinkActionsProps {
    link: ComparisonLink;
    label: string;
    color: 'blue' | 'green';
    size?: 'sm' | 'default';
    variant?: 'outline' | 'ghost' | 'default';
    showLabels?: boolean;
    onPageVisit?: (visited: boolean, duration?: number) => void;
}

interface VisitTracker {
    visited: boolean;
    startTime?: number;
    totalTime: number;
    visitCount: number;
}

export function LinkActions({
    link,
    label,
    color,
    size = 'sm',
    variant = 'outline',
    showLabels = false,
    onPageVisit
}: LinkActionsProps) {
    const [showPreview, setShowPreview] = useState(false);
    const [previewError, setPreviewError] = useState(false);
    const [visitTracker, setVisitTracker] = useState<VisitTracker>({
        visited: false,
        totalTime: 0,
        visitCount: 0
    });

    const badgeVariants = {
        blue: 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200',
        green: 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200'
    };

    const trackPageVisit = (visited: boolean) => {
        const now = Date.now();
        setVisitTracker(prev => {
            const newTracker = {
                ...prev,
                visited: visited || prev.visited,
                startTime: visited ? now : prev.startTime,
                visitCount: visited ? prev.visitCount + 1 : prev.visitCount
            };

            if (!visited && prev.startTime) {
                newTracker.totalTime = prev.totalTime + (now - prev.startTime);
                newTracker.startTime = undefined;
            }

            if (onPageVisit) {
                onPageVisit(newTracker.visited, newTracker.totalTime);
            }

            return newTracker;
        });
    };

    const handlePreviewToggle = () => {
        if (!showPreview) {
            trackPageVisit(true);
        } else {
            trackPageVisit(false);
        }
        setShowPreview(!showPreview);
        setPreviewError(false);
    };

    const handleClosePreview = () => {
        trackPageVisit(false);
        setShowPreview(false);
        setPreviewError(false);
    };

    const handleExternalLinkClick = () => {
        trackPageVisit(true);
        const newWindow = window.open(link.url, '_blank', 'noopener,noreferrer');

        if (newWindow) {
            const checkWindowClosed = () => {
                if (newWindow.closed) {
                    trackPageVisit(false);
                } else {
                    setTimeout(checkWindowClosed, 1000); // Check every second
                }
            };
            setTimeout(checkWindowClosed, 1000);
        }
    };

    const handleIframeError = () => {
        setPreviewError(true);
    };

    const formatTime = (milliseconds: number): string => {
        const seconds = Math.floor(milliseconds / 1000);
        if (seconds < 60) return `${seconds}s`;
        const minutes = Math.floor(seconds / 60);
        const remainingSeconds = seconds % 60;
        return `${minutes}m ${remainingSeconds}s`;
    };

    // Prevent background scrolling
    useEffect(() => {
        if (showPreview) {
            document.body.style.overflow = 'hidden';
        } else {
            document.body.style.overflow = 'unset';
        }

        // Cleanup function
        return () => {
            document.body.style.overflow = 'unset';
        };
    }, [showPreview]);

    // Close fullscreen preview with ESC key
    useEffect(() => {
        const handleEscKey = (event: KeyboardEvent) => {
            if (event.key === 'Escape' && showPreview) {
                handleClosePreview();
            }
        };

        document.addEventListener('keydown', handleEscKey);
        return () => document.removeEventListener('keydown', handleEscKey);
    }, [showPreview]);

    // Cleanup: record time if currently visiting when component unmounts
    useEffect(() => {
        return () => {
            if (visitTracker.startTime) {
                trackPageVisit(false);
            }
        };
    }, []);

    return (
        <>
            <div className={showLabels ? "flex gap-2" : "flex gap-1"}>
                <Button
                    variant={variant}
                    size={size}
                    onClick={handlePreviewToggle}
                    className={showLabels ? "flex items-center gap-2" : "flex items-center gap-1"}
                    title="Fullscreen Preview"
                >
                    <Maximize className={showLabels ? "h-4 w-4" : "h-3 w-3"} />
                    {showLabels && 'Fullscreen Preview'}
                </Button>

                <Button
                    variant={variant}
                    size={size}
                    onClick={handleExternalLinkClick}
                    className={showLabels ? "flex items-center gap-2" : "flex items-center gap-1"}
                    title="Open in New Tab"
                    asChild
                >
                    <a href={link.url} target="_blank" rel="noopener noreferrer">
                        <ExternalLink className={showLabels ? "h-4 w-4" : "h-3 w-3"} />
                        {showLabels && 'Open in New Tab'}
                    </a>
                </Button>
            </div>

            {/* Visit status indicator */}
            {(visitTracker.visited || visitTracker.totalTime > 0) && (
                <div className="flex items-center gap-2 mt-2 text-xs">
                    <div className="flex items-center gap-1">
                        {visitTracker.visited ? (
                            <CheckCircle className="h-3 w-3 text-green-500" />
                        ) : (
                            <Eye className="h-3 w-3 text-blue-500" />
                        )}
                        <span className={visitTracker.visited ? "text-green-600" : "text-blue-600"}>
                            {visitTracker.visited ? "Viewed" : "Visited"}
                        </span>
                    </div>
                    {visitTracker.totalTime > 0 && (
                        <div className="flex items-center gap-1">
                            <Timer className="h-3 w-3 text-gray-500" />
                            <span className="text-gray-600">
                                {formatTime(visitTracker.totalTime)}
                            </span>
                        </div>
                    )}
                    {visitTracker.visitCount > 1 && (
                        <span className="text-gray-500">
                            ({visitTracker.visitCount} times)
                        </span>
                    )}
                </div>
            )}

            {/* Fullscreen preview modal */}
            {showPreview && (
                <div className="fixed inset-0 z-50 bg-background">
                    {/* Top toolbar */}
                    <div className="flex items-center justify-between p-4 border-b bg-background/95 backdrop-blur">
                        <div className="flex items-center gap-3">
                            <Badge variant="secondary" className={badgeVariants[color]}>
                                {label}
                            </Badge>
                            <h2 className="text-lg font-semibold">{link.title}</h2>
                        </div>
                        <div className="flex items-center gap-2">
                            <Button
                                variant="outline"
                                size="sm"
                                onClick={handleExternalLinkClick}
                                className="flex items-center gap-2"
                                asChild
                            >
                                <a href={link.url} target="_blank" rel="noopener noreferrer">
                                    <ExternalLink className="h-4 w-4" />
                                    Open in New Tab
                                </a>
                            </Button>
                            <Button
                                variant="outline"
                                size="sm"
                                onClick={handleClosePreview}
                                className="flex items-center gap-2"
                            >
                                <X className="h-4 w-4" />
                                Close
                            </Button>
                        </div>
                    </div>

                    {/* URL information */}
                    <div className="px-4 py-2 border-b bg-muted/50">
                        <div className="flex items-center gap-2 text-sm text-muted-foreground">
                            <span>URL:</span>
                            <code className="bg-background px-2 py-1 rounded text-xs break-all">
                                {link.url}
                            </code>
                        </div>
                    </div>

                    {/* Preview content */}
                    <div className="flex-1 relative" style={{ height: 'calc(100vh - 120px)' }}>
                        {!previewError ? (
                            <iframe
                                src={link.url}
                                className="w-full h-full border-0"
                                title={`Fullscreen preview of ${link.title}`}
                                sandbox="allow-scripts allow-same-origin allow-forms allow-popups allow-top-navigation"
                                onError={handleIframeError}
                                loading="lazy"
                            />
                        ) : (
                            <div className="flex flex-col items-center justify-center h-full bg-muted/50">
                                <ExternalLink className="h-16 w-16 text-muted-foreground mb-6" />
                                <h3 className="text-xl font-semibold mb-2">Unable to preview this website</h3>
                                <p className="text-muted-foreground text-center mb-6 max-w-md">
                                    This website may block embedding or require direct access for security reasons.
                                </p>
                                <Button onClick={handleExternalLinkClick} asChild>
                                    <a href={link.url} target="_blank" rel="noopener noreferrer">
                                        <ExternalLink className="h-4 w-4 mr-2" />
                                        Open Website Directly
                                    </a>
                                </Button>
                            </div>
                        )}
                    </div>
                </div>
            )}
        </>
    );
} 