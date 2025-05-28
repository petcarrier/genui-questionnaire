import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';
import { AlertCircle } from 'lucide-react';

interface ErrorScreenProps {
    error: string;
    title?: string;
    onRetry?: () => void;
    onGoHome?: () => void;
    retryText?: string;
    homeText?: string;
    showCard?: boolean;
}

export function ErrorScreen({
    error,
    title,
    onRetry,
    onGoHome,
    retryText = 'Try Again',
    homeText = 'Start Over',
    showCard = true
}: ErrorScreenProps) {
    const content = (
        <>
            {title && (
                <CardHeader>
                    <CardTitle className="text-2xl flex items-center gap-3 text-red-600">
                        <AlertCircle className="h-6 w-6" />
                        {title}
                    </CardTitle>
                </CardHeader>
            )}
            <CardContent className="space-y-4">
                <Alert variant="destructive">
                    <AlertDescription className="text-center">
                        <strong>Error:</strong> {error}
                    </AlertDescription>
                </Alert>

                <div className="flex gap-4 justify-center">
                    {onRetry && (
                        <Button variant="outline" onClick={onRetry}>
                            {retryText}
                        </Button>
                    )}
                    {onGoHome && (
                        <Button variant="outline" onClick={onGoHome}>
                            {homeText}
                        </Button>
                    )}
                </div>
            </CardContent>
        </>
    );

    if (!showCard) {
        return <div className="space-y-4">{content}</div>;
    }

    return (
        <div className="max-w-4xl mx-auto text-center space-y-8">
            <Card>
                {content}
            </Card>
        </div>
    );
} 