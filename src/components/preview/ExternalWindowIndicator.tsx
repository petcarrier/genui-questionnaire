import React from 'react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { ExternalLink, X } from 'lucide-react';
import { useExternalWindow } from '@/contexts/ExternalWindowContext';

interface ExternalWindowIndicatorProps {
    className?: string;
    showCloseButton?: boolean;
}

export function ExternalWindowIndicator({
    className = '',
    showCloseButton = true
}: ExternalWindowIndicatorProps) {
    const { isWindowOpen, closeWindow } = useExternalWindow();

    if (!isWindowOpen) {
        return null;
    }

    return (
        <div className={`flex items-center gap-2 ${className}`}>
            <Badge variant="outline" className="flex items-center gap-1">
                <ExternalLink className="h-3 w-3" />
                External window open
            </Badge>
            {showCloseButton && (
                <Button
                    variant="ghost"
                    size="sm"
                    onClick={closeWindow}
                    className="h-6 w-6 p-0"
                    title="Close external window"
                >
                    <X className="h-3 w-3" />
                </Button>
            )}
        </div>
    );
} 