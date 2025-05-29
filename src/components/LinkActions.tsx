import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ExternalLink, Maximize, X } from 'lucide-react';
import { ComparisonLink } from '@/types/questionnaire';

interface LinkActionsProps {
    link: ComparisonLink;
    label: string;
    color: 'blue' | 'green';
    size?: 'sm' | 'default';
    variant?: 'outline' | 'ghost' | 'default';
    showLabels?: boolean;
}

export function LinkActions({ link, label, color, size = 'sm', variant = 'outline', showLabels = false }: LinkActionsProps) {
    const [showPreview, setShowPreview] = useState(false);
    const [previewError, setPreviewError] = useState(false);

    const badgeVariants = {
        blue: 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200',
        green: 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200'
    };

    const handlePreviewToggle = () => {
        setShowPreview(!showPreview);
        setPreviewError(false);
    };

    const handleClosePreview = () => {
        setShowPreview(false);
        setPreviewError(false);
    };

    const handleIframeError = () => {
        setPreviewError(true);
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
                    asChild
                    className={showLabels ? "flex items-center gap-2" : "flex items-center gap-1"}
                    title="Open in New Tab"
                >
                    <a href={link.url} target="_blank" rel="noopener noreferrer">
                        <ExternalLink className={showLabels ? "h-4 w-4" : "h-3 w-3"} />
                        {showLabels && 'Open in New Tab'}
                    </a>
                </Button>
            </div>

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
                                asChild
                                className="flex items-center gap-2"
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
                                <Button asChild>
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