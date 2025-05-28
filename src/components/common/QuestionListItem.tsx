import React from 'react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Copy, ExternalLink, CheckCircle } from 'lucide-react';
import Link from 'next/link';
import { QuestionnaireQuestion } from '@/types/questionnaire';

interface QuestionListItemProps {
    question: QuestionnaireQuestion;
    copySuccess?: boolean;
    showBadges?: boolean;
    showDescription?: boolean;
    maxDescriptionLength?: number;
}

const copyQuestionLink = (question: QuestionnaireQuestion) => {
    const fullUrl = `${window.location.origin}/q/${question.id}`;
    navigator.clipboard.writeText(fullUrl);
};

export function QuestionListItem({
    question,
    copySuccess = false,
    showBadges = true,
    showDescription = true,
    maxDescriptionLength = 50
}: QuestionListItemProps) {
    const questionUrl = `/q/${question.id}`;

    const handleCopyLink = () => {
        copyQuestionLink(question);
    };

    const truncatedDescription = showDescription && question.userQuery ?
        (question.userQuery.length > maxDescriptionLength ?
            `${question.userQuery.substring(0, maxDescriptionLength)}...` :
            question.userQuery) :
        '';

    return (
        <div className="flex items-center justify-between p-4 border rounded-lg hover:bg-muted/50 transition-colors">
            <div className="flex-1">
                <div className="flex items-center gap-3 mb-2">
                    <Badge variant="outline">#{question.id}</Badge>
                    <span className="font-medium">Question ID: {question.id}</span>
                </div>
                {showDescription && truncatedDescription && (
                    <p className="text-sm text-muted-foreground line-clamp-2">
                        {truncatedDescription}
                    </p>
                )}
                {showBadges && question.linkA && question.linkB && (
                    <div className="flex gap-2 mt-2">
                        <Badge variant="secondary" className="text-xs">
                            Link A: {question.linkA.title}
                        </Badge>
                        <Badge variant="secondary" className="text-xs">
                            Link B: {question.linkB.title}
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