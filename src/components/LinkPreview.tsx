import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ExternalLink, Maximize } from 'lucide-react';
import { ComparisonLink } from '@/types/questionnaire';
import { LinkActions } from './LinkActions';

interface LinkPreviewProps {
    link: ComparisonLink;
    label: string;
    color: 'blue' | 'green';
}

export function LinkPreview({ link, label, color }: LinkPreviewProps) {
    const colorClasses = {
        blue: 'border-blue-200 dark:border-blue-800',
        green: 'border-green-200 dark:border-green-800'
    };

    const badgeVariants = {
        blue: 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200',
        green: 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200'
    };

    return (
        <>
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
                        <LinkActions
                            link={link}
                            label={label}
                            color={color}
                            size="sm"
                            variant="outline"
                            showLabels={true}
                        />
                    </div>
                </CardHeader>
            </Card>
        </>
    );
} 