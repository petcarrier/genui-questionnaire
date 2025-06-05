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
                    <CardTitle className="text-sm font-medium">页面访问完成率</CardTitle>
                    <CheckCircle className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                    <div className="text-2xl font-bold text-green-600">
                        {dashboardData.summary.pageViewCompletionRate.toFixed(1)}%
                    </div>
                    <p className="text-xs text-muted-foreground">
                        同时访问A、B两个链接的比率
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
                    <CardTitle className="text-sm font-medium">链接访问平衡度</CardTitle>
                    <Scale className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                    <div className="text-2xl font-bold text-blue-600">
                        {(100 - dashboardData.summary.linkAccessBalance).toFixed(1)}%
                    </div>
                    <p className="text-xs text-muted-foreground">
                        A、B链接访问的平衡性
                    </p>
                </CardContent>
            </Card>
        </div>
    );
} 