import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { TrendingUp } from 'lucide-react';
import { DashboardData } from '@/types';

interface SubmissionTrendsProps {
    dashboardData: DashboardData;
}

export default function SubmissionTrends({ dashboardData }: SubmissionTrendsProps) {
    return (
        <Card>
            <CardHeader>
                <CardTitle className="flex items-center gap-2">
                    <TrendingUp className="h-5 w-5" />
                    每日提交趋势
                </CardTitle>
            </CardHeader>
            <CardContent>
                <div className="space-y-2 max-h-80 overflow-y-auto">
                    {Object.entries(dashboardData.submissions.submissionsByDate)
                        .sort(([a], [b]) => b.localeCompare(a))
                        .slice(0, 20)
                        .map(([date, count]) => (
                            <div key={date} className="flex justify-between items-center p-2 bg-muted rounded">
                                <span>{date}</span>
                                <div className="flex items-center gap-2">
                                    <Badge variant="secondary">{count} 次提交</Badge>
                                    <div className="w-20 bg-gray-200 rounded-full h-2">
                                        <div
                                            className="bg-blue-600 h-2 rounded-full"
                                            style={{
                                                width: `${Math.min((count as number / Math.max(...Object.values(dashboardData.submissions.submissionsByDate))) * 100, 100)}%`
                                            }}
                                        ></div>
                                    </div>
                                </div>
                            </div>
                        ))}
                </div>
            </CardContent>
        </Card>
    );
} 