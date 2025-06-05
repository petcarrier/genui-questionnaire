import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { BarChart3 } from 'lucide-react';
import { DashboardData } from '@/types';

interface QuestionPopularityProps {
    dashboardData: DashboardData;
}

export default function QuestionPopularity({ dashboardData }: QuestionPopularityProps) {
    return (
        <Card>
            <CardHeader>
                <CardTitle className="flex items-center gap-2">
                    <BarChart3 className="h-5 w-5" />
                    Question Popularity
                </CardTitle>
            </CardHeader>
            <CardContent>
                <div className="space-y-3">
                    {Object.entries(dashboardData.submissions.submissionsByQuestion)
                        .sort(([, a], [, b]) => (b as number) - (a as number))
                        .slice(0, 8)
                        .map(([questionId, count], index) => (
                            <div key={questionId} className="flex justify-between items-center">
                                <div className="flex items-center gap-2">
                                    <Badge variant="outline">#{index + 1}</Badge>
                                    <span className="text-sm truncate max-w-32">{questionId}</span>
                                </div>
                                <div className="flex items-center gap-2">
                                    <span className="text-sm font-medium">{count}</span>
                                    <div className="w-16 bg-gray-200 rounded-full h-2">
                                        <div
                                            className="bg-green-600 h-2 rounded-full"
                                            style={{
                                                width: `${((count as number) / Math.max(...Object.values(dashboardData.submissions.submissionsByQuestion))) * 100}%`
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