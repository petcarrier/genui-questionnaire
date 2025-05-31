import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ExternalLink, X, Eye, Timer, Loader2 } from 'lucide-react';
import { ComparisonLink } from '@/types/questionnaire';

interface FullscreenPreviewModalProps {
    isOpen: boolean;
    onClose: () => void;
    link: ComparisonLink;
    label: string;
    color: 'blue' | 'green';
    onExternalLinkClick: () => void;
    visitStatus?: {
        visited: boolean;
        duration: number;
        visitCount: number;
        isCurrentlyViewing?: boolean;
    };
}

export function FullscreenPreviewModal({
    isOpen,
    onClose,
    link,
    label,
    color,
    onExternalLinkClick,
    visitStatus = { visited: false, duration: 0, visitCount: 0 }
}: FullscreenPreviewModalProps) {
    const [previewError, setPreviewError] = useState(false);
    const [isLoading, setIsLoading] = useState(false);

    console.log('visitStatus', visitStatus);

    const badgeVariants = {
        blue: 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200',
        green: 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200'
    };

    const handleClosePreview = () => {
        onClose();
        setPreviewError(false);
        setIsLoading(false);
    };

    const handleIframeError = () => {
        setPreviewError(true);
        setIsLoading(false);
    };

    const handleIframeLoad = () => {
        setIsLoading(false);
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
        if (isOpen) {
            document.body.style.overflow = 'hidden';
            setIsLoading(true); // Start loading when opening preview
        } else {
            document.body.style.overflow = 'unset';
            setIsLoading(false); // Reset loading state when closing
        }

        // Cleanup function
        return () => {
            document.body.style.overflow = 'unset';
        };
    }, [isOpen]);

    // Close fullscreen preview with ESC key
    useEffect(() => {
        const handleEscKey = (event: KeyboardEvent) => {
            if (event.key === 'Escape' && isOpen) {
                handleClosePreview();
            }
        };

        document.addEventListener('keydown', handleEscKey);
        return () => document.removeEventListener('keydown', handleEscKey);
    }, [isOpen]);

    // Reset error state when modal opens
    useEffect(() => {
        if (isOpen) {
            setPreviewError(false);
        }
    }, [isOpen]);

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-[60] bg-background">
            {/* Top toolbar */}
            <div className="flex items-center justify-between gap-2 p-3 sm:p-4 border-b bg-background/95 backdrop-blur">
                {/* Left section: Badge, title, and stats */}
                <div className="flex items-center gap-2 min-w-0 flex-1 overflow-hidden">
                    <Badge variant="secondary" className={`${badgeVariants[color]} shrink-0`}>
                        {label}
                    </Badge>
                    <h2 className="text-sm sm:text-lg font-semibold truncate">{link.title}</h2>

                    {/* Stats - compact display */}
                    {(visitStatus.duration > 0 || visitStatus.visitCount > 0) && (
                        <div className="hidden sm:flex items-center gap-3 text-xs text-muted-foreground shrink-0">
                            {visitStatus.duration > 0 && (
                                <div className="flex items-center gap-1">
                                    <Timer className="h-3 w-3" />
                                    <span>{formatTime(visitStatus.duration)}</span>
                                </div>
                            )}
                            {visitStatus.visitCount > 0 && (
                                <div className="flex items-center gap-1">
                                    <Eye className="h-3 w-3" />
                                    <span>{visitStatus.visitCount}</span>
                                </div>
                            )}
                        </div>
                    )}
                </div>

                {/* Right section: Action buttons */}
                <div className="flex items-center gap-1 sm:gap-2 shrink-0">
                    {/* Mobile stats - very compact */}
                    {(visitStatus.duration > 0 || visitStatus.visitCount > 0) && (
                        <div className="sm:hidden flex items-center gap-2 text-xs text-muted-foreground mr-2">
                            {visitStatus.duration > 0 && (
                                <span className="flex items-center gap-1">
                                    <Timer className="h-3 w-3" />
                                    {formatTime(visitStatus.duration)}
                                </span>
                            )}
                            {visitStatus.visitCount > 0 && (
                                <span className="flex items-center gap-1">
                                    <Eye className="h-3 w-3" />
                                    {visitStatus.visitCount}
                                </span>
                            )}
                        </div>
                    )}

                    <Button
                        variant="outline"
                        size="sm"
                        onClick={onExternalLinkClick}
                        className="flex items-center gap-1 sm:gap-2 text-xs sm:text-sm"
                    >
                        <ExternalLink className="h-3 w-3 sm:h-4 sm:w-4" />
                        <span className="hidden sm:inline">Open in New Tab</span>
                        <span className="sm:hidden">Open</span>
                    </Button>
                    <Button
                        variant="outline"
                        size="sm"
                        onClick={handleClosePreview}
                        className="flex items-center gap-1 sm:gap-2 text-xs sm:text-sm"
                    >
                        <X className="h-3 w-3 sm:h-4 sm:w-4" />
                        <span className="hidden sm:inline">Close</span>
                    </Button>
                </div>
            </div>

            {/* Preview content */}
            <div className="flex-1 relative" style={{ height: 'calc(100vh - 120px)' }}>
                {/* Loading overlay */}
                {isLoading && (
                    <div className="absolute inset-0 z-10 bg-black/90 backdrop-blur-sm flex items-center justify-center">
                        <div className="flex flex-col items-center gap-4">
                            <Loader2 className="h-8 w-8 animate-spin text-white" />
                            <div className="text-center">
                                <div className="text-lg font-medium text-white">Loading website...</div>
                                <div className="text-sm text-white/70">Please wait while the page loads</div>
                            </div>
                        </div>
                    </div>
                )}

                {!previewError ? (
                    <iframe
                        src={link.url}
                        className="w-full h-full border-0 bg-white"
                        title={`Fullscreen preview of ${link.title}`}
                        sandbox="allow-scripts allow-same-origin allow-forms allow-popups allow-top-navigation"
                        onError={handleIframeError}
                        onLoad={handleIframeLoad}
                        loading="lazy"
                    />
                ) : (
                    <div className="flex flex-col items-center justify-center h-full bg-muted/50">
                        <ExternalLink className="h-16 w-16 text-muted-foreground mb-6" />
                        <h3 className="text-xl font-semibold mb-2">Unable to preview this website</h3>
                        <p className="text-muted-foreground text-center mb-6 max-w-md">
                            This website may block embedding or require direct access for security reasons.
                        </p>
                        <Button onClick={onExternalLinkClick}>
                            <ExternalLink className="h-4 w-4 mr-2" />
                            Open Website Directly
                        </Button>
                    </div>
                )}
            </div>
        </div>
    );
} 