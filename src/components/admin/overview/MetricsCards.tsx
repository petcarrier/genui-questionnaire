import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Users, Activity, CheckCircle, Scale } from 'lucide-react';
import { DashboardData, UsersResponse } from '@/types';

interface MetricsCardsProps {
    dashboardData: DashboardData;
    usersData: UsersResponse;
    timeRange: '7d' | '30d' | '90d';
}

export default function MetricsCards({ dashboardData, usersData, timeRange }: MetricsCardsProps) {
    const getTimeRangeLabel = (range: string) => {
        switch (range) {
            case '7d': return '7 days';
            case '30d': return '30 days';
            case '90d': return '90 days';
            default: return '30 days';
        }
    };

    const metrics = [
        {
            title: "Total Submissions",
            icon: Users,
            value: dashboardData.summary.totalSubmissions,
            description: `Added in last ${getTimeRangeLabel(timeRange)}: ${dashboardData.summary.recentSubmissions}`,
            color: "text-blue-600"
        },
        {
            title: "Page Visit Completion Rate",
            icon: CheckCircle,
            value: `${dashboardData.summary.pageViewCompletionRate.toFixed(1)}%`,
            description: "Rate of accessing both A and B links",
            color: "text-green-600"
        },
        {
            title: "Active Users",
            icon: Activity,
            value: usersData.summary.activeUsers,
            description: `Total users: ${usersData.summary.totalUsers}`,
            color: "text-purple-600"
        },
        {
            title: "Link Access Balance",
            icon: Scale,
            value: `${(100 - dashboardData.summary.linkAccessBalance).toFixed(1)}%`,
            description: "Balance of A and B link access",
            color: "text-blue-600"
        }
    ];

    return (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {metrics.map((metric, index) => {
                const IconComponent = metric.icon;
                return (
                    <Card key={index} className="transition-all duration-200 hover:shadow-md">
                        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                            <CardTitle className="text-sm font-medium text-muted-foreground">
                                {metric.title}
                            </CardTitle>
                            <IconComponent className="h-4 w-4 text-muted-foreground" />
                        </CardHeader>
                        <CardContent className="pt-0">
                            <div className={`text-2xl sm:text-3xl font-bold ${metric.color} mb-2`}>
                                {metric.value}
                            </div>
                            <p className="text-xs sm:text-sm text-muted-foreground leading-relaxed">
                                {metric.description}
                            </p>
                        </CardContent>
                    </Card>
                );
            })}
        </div>
    );
} 