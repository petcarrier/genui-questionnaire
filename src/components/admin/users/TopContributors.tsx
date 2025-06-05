import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Activity, Clock } from 'lucide-react';
import { UsersResponse } from '@/types';

interface TopContributorsProps {
    usersData: UsersResponse;
}

const formatDate = (date: Date | string) => {
    return new Date(date).toLocaleDateString('en-US', {
        year: 'numeric',
        month: '2-digit',
        day: '2-digit',
        hour: '2-digit',
        minute: '2-digit'
    });
};

export default function TopContributors({ usersData }: TopContributorsProps) {
    // Sort by most recent submission time to show recent contributors
    const recentContributors = [...usersData.users]
        .sort((a, b) => {
            // Sort by last submission time, most recent first
            return new Date(b.lastSubmission).getTime() - new Date(a.lastSubmission).getTime();
        })
        .slice(0, 5);

    return (
        <Card>
            <CardHeader>
                <CardTitle className="flex items-center gap-2 text-base sm:text-lg">
                    <Clock className="h-5 w-5" />
                    Recent Contributors
                    <span className="text-sm text-muted-foreground font-normal">
                        (Most Recently Active)
                    </span>
                </CardTitle>
            </CardHeader>
            <CardContent>
                <div className="space-y-4">
                    {recentContributors.map((user, index) => (
                        <div
                            key={user.userId}
                            className="flex flex-col gap-4 p-4 border rounded-lg sm:flex-row sm:justify-between sm:items-center"
                        >
                            {/* Left section - User info */}
                            <div className="flex items-start gap-3 sm:flex-1">
                                <Badge variant="outline" className="text-xs">
                                    #{index + 1}
                                </Badge>
                                <div className="flex-1 min-w-0">
                                    <div className="font-medium text-sm sm:text-base truncate">
                                        {user.userId}
                                    </div>
                                    <div className="space-y-1 mt-2">
                                        <div className="flex flex-wrap gap-2 text-xs sm:text-sm text-muted-foreground">
                                            <span className="flex items-center gap-1">
                                                <Activity className="h-3 w-3" />
                                                Completion: {user.questionnaireCompletionRate.toFixed(1)}%
                                            </span>
                                            <span>•</span>
                                            <span>Consistency: {user.consistency.toFixed(1)}%</span>
                                        </div>
                                        <div className="flex flex-wrap gap-2 text-xs text-muted-foreground">
                                            <span>Submissions: {user.submissionCount}</span>
                                            <span>•</span>
                                            <span>Rate: {user.completionRate.toFixed(1)}%</span>
                                        </div>
                                    </div>
                                </div>
                            </div>

                            {/* Right section - Stats */}
                            <div className="flex flex-col gap-2 sm:text-right sm:min-w-0 sm:flex-shrink-0">
                                <div className="space-y-1">
                                    <div className="font-bold text-sm sm:text-base">
                                        {user.completedQuestionnaires}/{user.totalQuestionnaires} questionnaires
                                    </div>
                                    <div className="text-xs sm:text-sm text-muted-foreground">
                                        Progress: {user.currentProgress}/{user.totalQuestions} questions
                                    </div>
                                </div>
                                <div className="flex items-center gap-1 text-xs text-muted-foreground sm:justify-end">
                                    <Clock className="h-3 w-3" />
                                    <span className="truncate">
                                        Last: {formatDate(user.lastSubmission)}
                                    </span>
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            </CardContent>
        </Card>
    );
} 