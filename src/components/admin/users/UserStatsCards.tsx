import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Users, Activity, FileText, TrendingUp } from 'lucide-react';
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

    const stats = [
        {
            title: "Total Users",
            value: usersData.summary.totalUsers,
            icon: Users,
            color: "text-blue-600",
            description: "Registered users"
        },
        {
            title: "Active Users",
            subtitle: "(Last 7 days)",
            value: usersData.summary.activeUsers,
            icon: Activity,
            color: "text-green-600",
            description: "Recently active"
        },
        {
            title: "Total Questionnaires",
            value: totalQuestionnaires,
            icon: FileText,
            color: "text-purple-600",
            description: `Completed: ${completedQuestionnaires}`
        },
        {
            title: "Average Completion Rate",
            value: `${avgQuestionnaireCompletionRate.toFixed(1)}%`,
            icon: TrendingUp,
            color: "text-orange-600",
            description: "Questionnaire completion rate"
        }
    ];

    return (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {stats.map((stat, index) => {
                const IconComponent = stat.icon;
                return (
                    <Card key={index} className="transition-all duration-200 hover:shadow-md">
                        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                            <CardTitle className="text-sm font-medium text-muted-foreground">
                                {stat.title}
                                {stat.subtitle && (
                                    <div className="text-xs text-muted-foreground mt-1">
                                        {stat.subtitle}
                                    </div>
                                )}
                            </CardTitle>
                            <IconComponent className="h-4 w-4 text-muted-foreground" />
                        </CardHeader>
                        <CardContent className="pt-0">
                            <div className={`text-2xl sm:text-3xl font-bold ${stat.color} mb-2`}>
                                {stat.value}
                            </div>
                            <p className="text-xs sm:text-sm text-muted-foreground leading-relaxed">
                                {stat.description}
                            </p>
                        </CardContent>
                    </Card>
                );
            })}
        </div>
    );
} 