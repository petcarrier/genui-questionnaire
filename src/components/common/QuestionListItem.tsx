import React from 'react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Copy, ExternalLink, CheckCircle } from 'lucide-react';
import Link from 'next/link';

interface QuestionListItemProps {
    id: string;
    index: number;
    userQuery: string;
    linkA?: {
        title: string;
        url?: string;
    };
    linkB?: {
        title: string;
        url?: string;
    };
    directUrl?: string;
    baseUrl?: string;
    onCopyLink?: (link: string) => void;
    copySuccess?: boolean;
    showBadges?: boolean;
    showDescription?: boolean;
    maxDescriptionLength?: number;
}

export function QuestionListItem({
    id,
    index,
    userQuery,
    linkA,
    linkB,
    directUrl,
    baseUrl = '',
    onCopyLink,
    copySuccess = false,
    showBadges = true,
    showDescription = true,
    maxDescriptionLength = 50
}: QuestionListItemProps) {
    const questionUrl = directUrl || `/q/${id}`;
    const fullUrl = `${baseUrl}${questionUrl}`;

    const handleCopyLink = () => {
        if (onCopyLink) {
            onCopyLink(fullUrl);
        } else {
            navigator.clipboard.writeText(fullUrl);
        }
    };

    const truncatedDescription = showDescription && userQuery ?
        (userQuery.length > maxDescriptionLength ?
            `${userQuery.substring(0, maxDescriptionLength)}...` :
            userQuery) :
        '';

    return (
        <div className="flex items-center justify-between p-4 border rounded-lg hover:bg-muted/50 transition-colors">
            <div className="flex-1">
                <div className="flex items-center gap-3 mb-2">
                    <Badge variant="outline">#{index}</Badge>
                    <span className="font-medium">Question ID: {id}</span>
                </div>
                {showDescription && truncatedDescription && (
                    <p className="text-sm text-muted-foreground line-clamp-2">
                        {truncatedDescription}
                    </p>
                )}
                {showBadges && linkA && linkB && (
                    <div className="flex gap-2 mt-2">
                        <Badge variant="secondary" className="text-xs">
                            Link A: {linkA.title}
                        </Badge>
                        <Badge variant="secondary" className="text-xs">
                            Link B: {linkB.title}
                        </Badge>
                    </div>
                )}
            </div>
            <div className="flex items-center gap-2 ml-4">
                <Button
                    variant="outline"
                    size="sm"
                    onClick={handleCopyLink}
                    className="flex items-center gap-1"
                >
                    {copySuccess ? <CheckCircle className="h-3 w-3" /> : <Copy className="h-3 w-3" />}
                    {copySuccess ? 'Copied' : 'Copy Link'}
                </Button>
                <Link href={questionUrl}>
                    <Button size="sm" className="flex items-center gap-1">
                        <ExternalLink className="h-3 w-3" />
                        Open
                    </Button>
                </Link>
            </div>
        </div>
    );
} 