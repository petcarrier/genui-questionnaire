import React from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { RefreshCw } from 'lucide-react';

interface LoadingScreenProps {
    message?: string;
    showCard?: boolean;
}

export function LoadingScreen({
    message = 'Loading...',
    showCard = true
}: LoadingScreenProps) {
    const content = (
        <div className="flex items-center justify-center gap-2">
            <RefreshCw className="h-4 w-4 animate-spin" />
            <span>{message}</span>
        </div>
    );

    if (!showCard) {
        return content;
    }

    return (
        <div className="max-w-4xl mx-auto text-center">
            <Card>
                <CardContent className="pt-6">
                    {content}
                </CardContent>
            </Card>
        </div>
    );
} 