import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ArrowLeft } from 'lucide-react';
import Link from 'next/link';

interface PageHeaderProps {
    title: string;
    description?: string;
    icon?: React.ReactNode;
    showBackButton?: boolean;
    backButtonText?: string;
    backButtonHref?: string;
    badges?: Array<{
        text: string;
        variant?: 'default' | 'secondary' | 'destructive' | 'outline';
    }>;
    actions?: React.ReactNode;
    children?: React.ReactNode;
}

export function PageHeader({
    title,
    description,
    icon,
    showBackButton = false,
    backButtonText = 'Back to Home',
    backButtonHref = '/',
    badges = [],
    actions,
    children
}: PageHeaderProps) {
    return (
        <Card>
            <CardHeader>
                <div className="flex items-center justify-between">
                    <div>
                        <CardTitle className="text-2xl flex items-center gap-3">
                            {icon}
                            {title}
                        </CardTitle>
                        {description && (
                            <p className="text-muted-foreground mt-2">
                                {description}
                            </p>
                        )}
                    </div>
                    <div className="flex items-center gap-2">
                        {badges.map((badge, index) => (
                            <Badge key={index} variant={badge.variant || 'outline'}>
                                {badge.text}
                            </Badge>
                        ))}
                        {showBackButton && (
                            <Link href={backButtonHref}>
                                <Button variant="outline" size="sm" className="flex items-center gap-2">
                                    <ArrowLeft className="h-4 w-4" />
                                    {backButtonText}
                                </Button>
                            </Link>
                        )}
                        {actions}
                    </div>
                </div>
            </CardHeader>
            {children && (
                <CardContent>
                    {children}
                </CardContent>
            )}
        </Card>
    );
} 