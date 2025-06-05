import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { BarChart3, PieChart } from 'lucide-react';
import { DashboardData } from '@/types';

interface SubmissionDistributionChartsProps {
    dashboardData: DashboardData;
}

export default function SubmissionDistributionCharts({ dashboardData }: SubmissionDistributionChartsProps) {
    return (
        <div className="grid gap-6 md:grid-cols-2">
            <Card>
                <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                        <BarChart3 className="h-5 w-5" />
                        Submission Distribution by Hour
                    </CardTitle>
                </CardHeader>
                <CardContent>
                    <div className="space-y-2">
                        {Object.entries(dashboardData.submissions.submissionsByHour)
                            .sort(([a], [b]) => parseInt(a) - parseInt(b))
                            .slice(0, 12)
                            .map(([hour, count]) => (
                                <div key={hour} className="flex justify-between items-center p-2 bg-muted rounded text-sm">
                                    <span>{hour}:00</span>
                                    <Badge variant="secondary">{count} submissions</Badge>
                                </div>
                            ))}
                    </div>
                </CardContent>
            </Card>

            <Card>
                <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                        <PieChart className="h-5 w-5" />
                        Submission Distribution by Weekday
                    </CardTitle>
                </CardHeader>
                <CardContent>
                    <div className="space-y-2">
                        {Object.entries(dashboardData.submissions.submissionsByWeekday)
                            .map(([weekday, count]) => (
                                <div key={weekday} className="flex justify-between items-center p-2 bg-muted rounded text-sm">
                                    <span>{weekday}</span>
                                    <Badge variant="secondary">{count} submissions</Badge>
                                </div>
                            ))}
                    </div>
                </CardContent>
            </Card>
        </div>
    );
} 