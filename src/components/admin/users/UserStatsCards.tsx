import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { UsersResponse } from '@/types';

interface UserStatsCardsProps {
    usersData: UsersResponse;
}

export default function UserStatsCards({ usersData }: UserStatsCardsProps) {
    // Calculate questionnaire-related statistics
    const totalQuestionnaires = usersData.users.reduce((sum, user) => sum + user.totalQuestionnaires, 0);
    const completedQuestionnaires = usersData.users.reduce((sum, user) => sum + user.completedQuestionnaires, 0);
    const avgQuestionnaireCompletionRate = usersData.users.length > 0
        ? usersData.users.reduce((sum, user) => sum + user.questionnaireCompletionRate, 0) / usersData.users.length
        : 0;

    return (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
            <Card>
                <CardHeader>
                    <CardTitle className="text-sm">Total Users</CardTitle>
                </CardHeader>
                <CardContent>
                    <div className="text-2xl font-bold">{usersData.summary.totalUsers}</div>
                </CardContent>
            </Card>

            <Card>
                <CardHeader>
                    <CardTitle className="text-sm">Active Users (Last 7 days)</CardTitle>
                </CardHeader>
                <CardContent>
                    <div className="text-2xl font-bold">{usersData.summary.activeUsers}</div>
                </CardContent>
            </Card>

            <Card>
                <CardHeader>
                    <CardTitle className="text-sm">Total Questionnaires</CardTitle>
                </CardHeader>
                <CardContent>
                    <div className="text-2xl font-bold">{totalQuestionnaires}</div>
                    <p className="text-xs text-muted-foreground">
                        Completed: {completedQuestionnaires}
                    </p>
                </CardContent>
            </Card>

            <Card>
                <CardHeader>
                    <CardTitle className="text-sm">Average Completion Rate</CardTitle>
                </CardHeader>
                <CardContent>
                    <div className="text-2xl font-bold">
                        {avgQuestionnaireCompletionRate.toFixed(1)}%
                    </div>
                    <p className="text-xs text-muted-foreground">
                        Questionnaire completion rate
                    </p>
                </CardContent>
            </Card>
        </div>
    );
} 