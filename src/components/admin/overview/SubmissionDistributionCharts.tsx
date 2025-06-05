import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { BarChart3, PieChart, Clock, Calendar } from 'lucide-react';
import { DashboardData } from '@/types';
import { useIsMobile, formatNumberForMobile } from '../common/utils';

interface SubmissionDistributionChartsProps {
    dashboardData: DashboardData;
}

export default function SubmissionDistributionCharts({ dashboardData }: SubmissionDistributionChartsProps) {
    const isMobile = useIsMobile();

    const getTop6Hours = () => {
        return Object.entries(dashboardData.submissions.submissionsByHour)
            .sort(([, a], [, b]) => b - a) // Sort by count descending
            .slice(0, 6); // Show top 6 hours
    };

    const formatHour = (hour: string) => {
        const h = parseInt(hour);
        return isMobile ? `${h}:00` : `${h.toString().padStart(2, '0')}:00`;
    };

    return (
        <div className="grid gap-4 sm:gap-6 lg:grid-cols-2">
            <Card>
                <CardHeader className="pb-3">
                    <CardTitle className="flex items-center gap-2 text-base sm:text-lg">
                        <Clock className="h-4 w-4 sm:h-5 sm:w-5" />
                        <span>Submission Distribution by Hour</span>
                    </CardTitle>
                    {isMobile && (
                        <p className="text-xs text-muted-foreground">
                            Showing top 6 peak hours
                        </p>
                    )}
                </CardHeader>
                <CardContent className="pt-0">
                    {/* Mobile: Show top hours only, Desktop: Show all */}
                    <div className="space-y-2 sm:space-y-3">
                        {(isMobile ? getTop6Hours() :
                            Object.entries(dashboardData.submissions.submissionsByHour)
                                .sort(([a], [b]) => parseInt(a) - parseInt(b))
                                .slice(0, 12)
                        ).map(([hour, count]) => {
                            const maxCount = Math.max(...Object.values(dashboardData.submissions.submissionsByHour));
                            const percentage = (count / maxCount) * 100;

                            return (
                                <div key={hour} className="space-y-2">
                                    <div className="flex justify-between items-center">
                                        <span className="text-sm font-medium">
                                            {formatHour(hour)}
                                        </span>
                                        <Badge variant="secondary" className="text-xs">
                                            {formatNumberForMobile(count, isMobile)} submissions
                                        </Badge>
                                    </div>
                                    {/* Visual bar */}
                                    <div className="w-full bg-muted rounded-full h-2">
                                        <div
                                            className="bg-blue-500 h-2 rounded-full transition-all duration-300"
                                            style={{ width: `${percentage}%` }}
                                        />
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                </CardContent>
            </Card>

            <Card>
                <CardHeader className="pb-3">
                    <CardTitle className="flex items-center gap-2 text-base sm:text-lg">
                        <Calendar className="h-4 w-4 sm:h-5 sm:w-5" />
                        <span>Submission Distribution by Weekday</span>
                    </CardTitle>
                </CardHeader>
                <CardContent className="pt-0">
                    <div className="space-y-2 sm:space-y-3">
                        {Object.entries(dashboardData.submissions.submissionsByWeekday)
                            .map(([weekday, count]) => {
                                const maxCount = Math.max(...Object.values(dashboardData.submissions.submissionsByWeekday));
                                const percentage = (count / maxCount) * 100;

                                return (
                                    <div key={weekday} className="space-y-2">
                                        <div className="flex justify-between items-center">
                                            <span className="text-sm font-medium">
                                                {isMobile ? weekday.slice(0, 3) : weekday}
                                            </span>
                                            <Badge variant="secondary" className="text-xs">
                                                {formatNumberForMobile(count, isMobile)} submissions
                                            </Badge>
                                        </div>
                                        {/* Visual bar */}
                                        <div className="w-full bg-muted rounded-full h-2">
                                            <div
                                                className="bg-green-500 h-2 rounded-full transition-all duration-300"
                                                style={{ width: `${percentage}%` }}
                                            />
                                        </div>
                                    </div>
                                );
                            })}
                    </div>
                </CardContent>
            </Card>
        </div>
    );
} 