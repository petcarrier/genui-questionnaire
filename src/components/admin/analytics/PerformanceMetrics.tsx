import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Target } from 'lucide-react';
import { DashboardData, UsersResponse } from '@/types';

interface PerformanceMetricsProps {
    dashboardData: DashboardData;
    usersData: UsersResponse;
}

export default function PerformanceMetrics({ dashboardData, usersData }: PerformanceMetricsProps) {
    // 计算更有意义的指标
    const averagePageViewsPerSubmission = dashboardData.pageViews.averageViewsPerSubmission || 0;
    const linkCompletionRate = dashboardData.pageViews.uniqueSubmissions > 0
        ? (dashboardData.pageViews.completedSubmissions / dashboardData.pageViews.uniqueSubmissions) * 100
        : 0;

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
                        <div className="text-sm text-muted-foreground">提交完成率</div>
                        <div className="text-2xl font-bold text-green-600">
                            {dashboardData.recentActivity.userEngagement.completionRate.toFixed(1)}%
                        </div>
                    </div>
                    <div className="p-4 border rounded">
                        <div className="text-sm text-muted-foreground">页面访问跳出率</div>
                        <div className="text-2xl font-bold text-red-600">
                            {dashboardData.recentActivity.userEngagement.bounceRate}%
                        </div>
                    </div>
                    <div className="p-4 border rounded">
                        <div className="text-sm text-muted-foreground">平均页面浏览数</div>
                        <div className="text-2xl font-bold text-blue-600">
                            {averagePageViewsPerSubmission.toFixed(1)}
                        </div>
                        <div className="text-xs text-muted-foreground mt-1">
                            每次评估平均访问页面数
                        </div>
                    </div>
                    <div className="p-4 border rounded">
                        <div className="text-sm text-muted-foreground">链接访问完成率</div>
                        <div className="text-2xl font-bold text-purple-600">
                            {linkCompletionRate.toFixed(1)}%
                        </div>
                        <div className="text-xs text-muted-foreground mt-1">
                            A、B两个链接都访问的比率
                        </div>
                    </div>
                </div>
            </CardContent>
        </Card>
    );
} 