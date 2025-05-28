import React from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';

interface ProgressCardProps {
    current: number;
    total: number;
    label?: string;
    showPercentage?: boolean;
    badges?: Array<{
        text: string;
        variant?: 'default' | 'secondary' | 'destructive' | 'outline';
        className?: string;
    }>;
    children?: React.ReactNode;
}

export function ProgressCard({
    current,
    total,
    label = 'Progress',
    showPercentage = true,
    badges = [],
    children
}: ProgressCardProps) {
    const progress = total > 0 ? (current / total) * 100 : 0;

    return (
        <Card>
            <CardContent className="pt-6">
                <div className="flex items-center justify-between text-sm mb-2">
                    <span>
                        {label}: {current}/{total}
                        {children && ` ${children}`}
                    </span>
                    <div className="flex items-center gap-2">
                        {badges.map((badge, index) => (
                            <Badge
                                key={index}
                                variant={badge.variant || 'outline'}
                                className={badge.className}
                            >
                                {badge.text}
                            </Badge>
                        ))}
                        {showPercentage && (
                            <span>{Math.round(progress)}% Complete</span>
                        )}
                    </div>
                </div>
                <div className="w-full bg-muted rounded-full h-2">
                    <div
                        className="bg-primary h-2 rounded-full transition-all"
                        style={{ width: `${progress}%` }}
                    />
                </div>
            </CardContent>
        </Card>
    );
} 