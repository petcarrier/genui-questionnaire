import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ExternalLink, Eye, EyeOff } from 'lucide-react';
import { ComparisonLink } from '@/types/questionnaire';

interface LinkPreviewProps {
    link: ComparisonLink;
    label: string;
    color: 'blue' | 'green';
}

export function LinkPreview({ link, label, color }: LinkPreviewProps) {
    const [showPreview, setShowPreview] = useState(false);
    const [previewError, setPreviewError] = useState(false);

    const colorClasses = {
        blue: 'border-blue-200 dark:border-blue-800',
        green: 'border-green-200 dark:border-green-800'
    };

    const badgeVariants = {
        blue: 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200',
        green: 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200'
    };

    const handlePreviewToggle = () => {
        setShowPreview(!showPreview);
        setPreviewError(false);
    };

    const handleIframeError = () => {
        setPreviewError(true);
    };

    return (
        <Card className={`w-full ${colorClasses[color]}`}>
            <CardHeader>
                <div className="flex items-start justify-between">
                    <div className="space-y-2">
                        <div className="flex items-center gap-2">
                            <Badge variant="secondary" className={badgeVariants[color]}>
                                {label}
                            </Badge>
                            <CardTitle className="text-lg">{link.title}</CardTitle>
                        </div>
                        {link.description && (
                            <p className="text-sm text-muted-foreground">{link.description}</p>
                        )}
                    </div>
                </div>

                <div className="flex gap-2 pt-2">
                    <Button
                        variant="outline"
                        size="sm"
                        onClick={handlePreviewToggle}
                        className="flex items-center gap-2"
                    >
                        {showPreview ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                        {showPreview ? 'Hide Preview' : 'Show Preview'}
                    </Button>

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
                </div>
            </CardHeader>

            {showPreview && (
                <CardContent>
                    <div className="space-y-3">
                        <div className="flex items-center gap-2 text-sm text-muted-foreground">
                            <span>URL:</span>
                            <code className="bg-muted px-2 py-1 rounded text-xs break-all">
                                {link.url}
                            </code>
                        </div>

                        {!previewError ? (
                            <div className="relative">
                                <iframe
                                    src={link.url}
                                    className="w-full h-96 border rounded-lg"
                                    title={`Preview of ${link.title}`}
                                    sandbox="allow-scripts allow-same-origin allow-forms"
                                    onError={handleIframeError}
                                    loading="lazy"
                                />
                                <div className="absolute top-2 right-2">
                                    <Badge variant="secondary" className="text-xs">
                                        Preview
                                    </Badge>
                                </div>
                            </div>
                        ) : (
                            <div className="flex flex-col items-center justify-center h-96 border rounded-lg bg-muted/50">
                                <ExternalLink className="h-12 w-12 text-muted-foreground mb-4" />
                                <p className="text-muted-foreground text-center mb-4">
                                    Unable to preview this website.<br />
                                    It may block embedding or require direct access.
                                </p>
                                <Button variant="outline" asChild>
                                    <a href={link.url} target="_blank" rel="noopener noreferrer">
                                        Open Website Directly
                                    </a>
                                </Button>
                            </div>
                        )}
                    </div>
                </CardContent>
            )}
        </Card>
    );
} 