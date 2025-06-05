import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Target } from 'lucide-react';
import { DashboardData, UsersResponse } from '@/types';

interface PerformanceMetricsProps {
    dashboardData: DashboardData;
    usersData: UsersResponse;
}

export default function PerformanceMetrics({ dashboardData, usersData }: PerformanceMetricsProps) {
    return (
        <Card>
            <CardHeader>
                <CardTitle className="flex items-center gap-2">
                    <Target className="h-5 w-5" />
                    性能指标分析
                </CardTitle>
            </CardHeader>
            <CardContent>
                <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                    <div className="p-4 border rounded">
                        <div className="text-sm text-muted-foreground">完成率</div>
                        <div className="text-2xl font-bold text-green-600">
                            {dashboardData.recentActivity.userEngagement.completionRate.toFixed(1)}%
                        </div>
                    </div>
                    <div className="p-4 border rounded">
                        <div className="text-sm text-muted-foreground">跳出率</div>
                        <div className="text-2xl font-bold text-red-600">
                            {dashboardData.recentActivity.userEngagement.bounceRate}%
                        </div>
                    </div>
                    <div className="p-4 border rounded">
                        <div className="text-sm text-muted-foreground">平均用户会话</div>
                        <div className="text-2xl font-bold text-blue-600">
                            {dashboardData.pageViews.averageVisitCount.toFixed(1)}
                        </div>
                    </div>
                </div>
            </CardContent>
        </Card>
    );
} 