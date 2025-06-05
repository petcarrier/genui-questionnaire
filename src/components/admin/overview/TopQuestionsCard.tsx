import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Star } from 'lucide-react';
import { DashboardData } from '@/types';

interface TopQuestionsCardProps {
    dashboardData: DashboardData;
}

export default function TopQuestionsCard({ dashboardData }: TopQuestionsCardProps) {
    return (
        <Card>
            <CardHeader>
                <CardTitle className="flex items-center gap-2">
                    <Star className="h-5 w-5" />
                    Top 5 Popular Questions
                </CardTitle>
            </CardHeader>
            <CardContent>
                <div className="space-y-3">
                    {dashboardData.recentActivity.topQuestions.map((question, index) => (
                        <div key={question.questionId} className="flex justify-between items-center p-3 border rounded">
                            <div className="flex items-center gap-3">
                                <Badge className="bg-blue-100 text-blue-800">#{index + 1}</Badge>
                                <span className="font-medium">{question.questionId}</span>
                            </div>
                            <Badge variant="outline">{question.count} responses</Badge>
                        </div>
                    ))}
                </div>
            </CardContent>
        </Card>
    );
} 