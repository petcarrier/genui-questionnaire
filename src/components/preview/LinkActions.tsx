import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ExternalLink, Maximize, Eye, Timer, CheckCircle } from 'lucide-react';
import { ComparisonLink } from '@/types/questionnaire';
import { FullscreenPreviewModal } from './FullscreenPreviewModal';
import { useExternalWindow } from '@/contexts/ExternalWindowContext';

interface LinkActionsProps {
    link: ComparisonLink;
    label: string;
    color: 'blue' | 'green';
    size?: 'sm' | 'default';
    variant?: 'outline' | 'ghost' | 'default';
    showLabels?: boolean;
    onPageVisit?: (visited: boolean, totalTime?: number) => void;
    externalShowPreview?: boolean;
    onPreviewChange?: (showPreview: boolean) => void;
    // New props for unified visit tracking
    visitStatus?: {
        visited: boolean;
        duration: number;
        visitCount: number;
        isCurrentlyViewing?: boolean;
    };
    // New prop to control visibility of visit status
    showVisitStatus?: boolean;
}

export function LinkActions({
    link,
    label,
    color,
    size = 'sm',
    variant = 'outline',
    showLabels = false,
    onPageVisit,
    externalShowPreview,
    onPreviewChange,
    visitStatus = { visited: false, duration: 0, visitCount: 0 },
    showVisitStatus = true
}: LinkActionsProps) {
    const [internalShowPreview, setInternalShowPreview] = useState(false);
    const { openWindow, closeWindow, isWindowOpen } = useExternalWindow();

    // Use external control if provided, otherwise use internal state
    const showPreview = externalShowPreview !== undefined ? externalShowPreview : internalShowPreview;

    const updateShowPreview = (newShowPreview: boolean) => {
        if (externalShowPreview !== undefined && onPreviewChange) {
            onPreviewChange(newShowPreview);
        } else {
            setInternalShowPreview(newShowPreview);
        }
    };

    const handlePreviewToggle = () => {
        const newShowPreview = !showPreview;
        if (newShowPreview) {
            // Close external window if it exists when opening fullscreen preview
            if (isWindowOpen) {
                console.log('Closing external window to open fullscreen preview');
                closeWindow();
            }
            onPageVisit?.(true);
        } else {
            onPageVisit?.(false);
        }
        updateShowPreview(newShowPreview);
    };

    const handleClosePreview = () => {
        onPageVisit?.(false);
        updateShowPreview(false);
    };

    const handleExternalLinkClick = () => {
        // Close fullscreen preview if it's currently open to prevent duplicate timing
        if (showPreview) {
            handleClosePreview();
        }

        // Use global window manager to open external window
        const success = openWindow(link.url, {
            onVisitStart: (visited) => {
                onPageVisit?.(visited);
            },
            onVisitEnd: (visited, totalTime) => {
                onPageVisit?.(visited, totalTime);
            },
        });

        if (!success) {
            console.error('Failed to open external window');
        }
    };

    // Effect to handle external preview state changes
    useEffect(() => {
        if (externalShowPreview !== undefined) {
            if (externalShowPreview && !visitStatus.isCurrentlyViewing) {
                onPageVisit?.(true);
            } else if (!externalShowPreview && visitStatus.isCurrentlyViewing) {
                onPageVisit?.(false);
            }
        }
    }, [externalShowPreview]);

    const formatTime = (milliseconds: number): string => {
        const seconds = Math.floor(milliseconds / 1000);
        if (seconds < 60) return `${seconds}s`;
        const minutes = Math.floor(seconds / 60);
        const remainingSeconds = seconds % 60;
        return `${minutes}m ${remainingSeconds}s`;
    };

    // Cleanup: record time if currently visiting when component unmounts
    useEffect(() => {
        return () => {
            if (visitStatus.isCurrentlyViewing) {
                onPageVisit?.(false);
            }
            // Note: We don't close the global external window when component unmounts
            // as it should persist across components
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
                >
                    <ExternalLink className={showLabels ? "h-4 w-4" : "h-3 w-3"} />
                    {showLabels && 'Open in New Tab'}
                </Button>
            </div>

            {/* Visit status indicator */}
            {showVisitStatus && (visitStatus.visited || visitStatus.duration > 0) && (
                <div className="flex items-center gap-2 text-xs">
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

            {/* Fullscreen preview modal */}
            <FullscreenPreviewModal
                isOpen={showPreview}
                onClose={handleClosePreview}
                link={link}
                label={label}
                color={color}
                onExternalLinkClick={handleExternalLinkClick}
                visitStatus={visitStatus}
            />
        </>
    );
} 