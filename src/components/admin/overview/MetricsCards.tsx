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

    return (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
            <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">Total Submissions</CardTitle>
                    <Users className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                    <div className="text-2xl font-bold">{dashboardData.summary.totalSubmissions}</div>
                    <p className="text-xs text-muted-foreground">
                        Added in last {getTimeRangeLabel(timeRange)}: {dashboardData.summary.recentSubmissions}
                    </p>
                </CardContent>
            </Card>

            <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">Page Visit Completion Rate</CardTitle>
                    <CheckCircle className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                    <div className="text-2xl font-bold text-green-600">
                        {dashboardData.summary.pageViewCompletionRate.toFixed(1)}%
                    </div>
                    <p className="text-xs text-muted-foreground">
                        Rate of accessing both A and B links
                    </p>
                </CardContent>
            </Card>

            <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">Active Users</CardTitle>
                    <Activity className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                    <div className="text-2xl font-bold">{usersData.summary.activeUsers}</div>
                    <p className="text-xs text-muted-foreground">
                        Total users: {usersData.summary.totalUsers}
                    </p>
                </CardContent>
            </Card>

            <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">Link Access Balance</CardTitle>
                    <Scale className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                    <div className="text-2xl font-bold text-blue-600">
                        {(100 - dashboardData.summary.linkAccessBalance).toFixed(1)}%
                    </div>
                    <p className="text-xs text-muted-foreground">
                        Balance of A and B link access
                    </p>
                </CardContent>
            </Card>
        </div>
    );
} 