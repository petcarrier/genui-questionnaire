import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Users, TrendingUp, Activity, Clock } from 'lucide-react';
import { DashboardData, UsersResponse } from '@/types';

interface MetricsCardsProps {
    dashboardData: DashboardData;
    usersData: UsersResponse;
    timeRange: '7d' | '30d' | '90d';
}

const formatDuration = (seconds: number) => {
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = Math.round(seconds % 60);
    return `${minutes}分${remainingSeconds}秒`;
};

export default function MetricsCards({ dashboardData, usersData, timeRange }: MetricsCardsProps) {
    const getTimeRangeLabel = (range: string) => {
        switch (range) {
            case '7d': return '7天';
            case '30d': return '30天';
            case '90d': return '90天';
            default: return '30天';
        }
    };

    return (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
            <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">总提交数</CardTitle>
                    <Users className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                    <div className="text-2xl font-bold">{dashboardData.summary.totalSubmissions}</div>
                    <p className="text-xs text-muted-foreground">
                        最近{getTimeRangeLabel(timeRange)}新增 {dashboardData.summary.recentSubmissions} 个
                    </p>
                </CardContent>
            </Card>

            <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">页面浏览量</CardTitle>
                    <TrendingUp className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                    <div className="text-2xl font-bold">{dashboardData.summary.totalPageViews}</div>
                    <p className="text-xs text-muted-foreground">
                        完成率 {dashboardData.recentActivity.userEngagement.completionRate.toFixed(1)}%
                    </p>
                </CardContent>
            </Card>

            <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">活跃用户</CardTitle>
                    <Activity className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                    <div className="text-2xl font-bold">{usersData.summary.activeUsers}</div>
                    <p className="text-xs text-muted-foreground">
                        总用户数 {usersData.summary.totalUsers}
                    </p>
                </CardContent>
            </Card>

            <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">平均响应时间</CardTitle>
                    <Clock className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                    <div className="text-2xl font-bold">
                        {formatDuration(dashboardData.summary.averageCompletionTime)}
                    </div>
                    <p className="text-xs text-muted-foreground">
                        跳出率 {dashboardData.recentActivity.userEngagement.bounceRate}%
                    </p>
                </CardContent>
            </Card>
        </div>
    );
} 