import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
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
    // Re-sort contributors based on questionnaire completion
    const topContributorsByQuestionnaire = [...usersData.users]
        .sort((a, b) => {
            // First sort by completed questionnaire count, then by completion rate
            if (a.completedQuestionnaires !== b.completedQuestionnaires) {
                return b.completedQuestionnaires - a.completedQuestionnaires;
            }
            return b.questionnaireCompletionRate - a.questionnaireCompletionRate;
        })
        .slice(0, 5);

    return (
        <Card>
            <CardHeader>
                <CardTitle>Top Contributors (Based on Questionnaire Completion)</CardTitle>
            </CardHeader>
            <CardContent>
                <div className="space-y-4">
                    {topContributorsByQuestionnaire.map((user, index) => (
                        <div key={user.userId} className="flex justify-between items-center p-4 border rounded">
                            <div className="flex items-center gap-4">
                                <Badge className="bg-yellow-100 text-yellow-800">#{index + 1}</Badge>
                                <div>
                                    <div className="font-medium">{user.userId}</div>
                                    <div className="text-sm text-muted-foreground">
                                        Questionnaire completion rate: {user.questionnaireCompletionRate.toFixed(1)}% |
                                        Response consistency: {user.consistency.toFixed(1)}%
                                    </div>
                                    <div className="text-xs text-muted-foreground">
                                        Total submissions: {user.submissionCount} |
                                        Completion rate: {user.completionRate.toFixed(1)}%
                                    </div>
                                </div>
                            </div>
                            <div className="text-right">
                                <div className="font-bold">
                                    {user.completedQuestionnaires}/{user.totalQuestionnaires} questionnaires
                                </div>
                                <div className="text-sm text-muted-foreground">
                                    Progress: {user.currentProgress}/{user.totalQuestions} questions
                                </div>
                                <div className="text-xs text-muted-foreground">
                                    Last active: {formatDate(user.lastSubmission)}
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            </CardContent>
        </Card>
    );
} 