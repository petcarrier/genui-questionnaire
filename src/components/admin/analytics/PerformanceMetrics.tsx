import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Target } from 'lucide-react';
import { DashboardData, UsersResponse } from '@/types';

interface PerformanceMetricsProps {
    dashboardData: DashboardData;
    usersData: UsersResponse;
}

export default function PerformanceMetrics({ dashboardData, usersData }: PerformanceMetricsProps) {
    // Calculate more meaningful metrics
    const averagePageViewsPerSubmission = dashboardData.pageViews.averageViewsPerSubmission || 0;
    const linkCompletionRate = dashboardData.pageViews.uniqueSubmissions > 0
        ? (dashboardData.pageViews.completedSubmissions / dashboardData.pageViews.uniqueSubmissions) * 100
        : 0;

    return (
        <Card>
            <CardHeader>
                <CardTitle className="flex items-center gap-2">
                    <Target className="h-5 w-5" />
                    Performance Metrics Analysis
                </CardTitle>
            </CardHeader>
            <CardContent>
                <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                    <div className="p-4 border rounded">
                        <div className="text-sm text-muted-foreground">Submission Completion Rate</div>
                        <div className="text-2xl font-bold text-green-600">
                            {dashboardData.recentActivity.userEngagement.completionRate.toFixed(1)}%
                        </div>
                    </div>
                    <div className="p-4 border rounded">
                        <div className="text-sm text-muted-foreground">Page Bounce Rate</div>
                        <div className="text-2xl font-bold text-red-600">
                            {dashboardData.recentActivity.userEngagement.bounceRate}%
                        </div>
                    </div>
                    <div className="p-4 border rounded">
                        <div className="text-sm text-muted-foreground">Average Page Views</div>
                        <div className="text-2xl font-bold text-blue-600">
                            {averagePageViewsPerSubmission.toFixed(1)}
                        </div>
                        <div className="text-xs text-muted-foreground mt-1">
                            Average pages visited per evaluation
                        </div>
                    </div>
                    <div className="p-4 border rounded">
                        <div className="text-sm text-muted-foreground">Link Access Completion Rate</div>
                        <div className="text-2xl font-bold text-purple-600">
                            {linkCompletionRate.toFixed(1)}%
                        </div>
                        <div className="text-xs text-muted-foreground mt-1">
                            Rate of accessing both A and B links
                        </div>
                    </div>
                </div>
            </CardContent>
        </Card>
    );
} 