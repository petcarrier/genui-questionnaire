import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { CheckCircle } from 'lucide-react';
import { DashboardData } from '@/types';

interface RecentSubmissionsProps {
    dashboardData: DashboardData;
}

const formatDate = (date: Date | string) => {
    return new Date(date).toLocaleDateString('zh-CN', {
        year: 'numeric',
        month: '2-digit',
        day: '2-digit',
        hour: '2-digit',
        minute: '2-digit'
    });
};

const getWinnerDisplay = (winner: 'A' | 'B' | 'tie' | '') => {
    if (winner === '' || !winner) {
        return <Badge className="bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-300">No Selection</Badge>;
    }

    const styles = {
        A: 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-300',
        B: 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300',
        tie: 'bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-300'
    };

    const labels = {
        A: 'Option A',
        B: 'Option B',
        tie: 'Tie'
    };

    return <Badge className={styles[winner]}>{labels[winner]}</Badge>;
};

export default function RecentSubmissions({ dashboardData }: RecentSubmissionsProps) {
    return (
        <Card>
            <CardHeader>
                <CardTitle className="flex items-center gap-2">
                    <CheckCircle className="h-5 w-5" />
                    最近提交记录
                </CardTitle>
            </CardHeader>
            <CardContent>
                <div className="space-y-4">
                    {dashboardData.recentActivity.recentSubmissions.map((submission, index) => (
                        <div key={index} className="border rounded-lg p-4 space-y-3">
                            <div className="flex justify-between items-start">
                                <div>
                                    <div className="font-medium">问题 ID: {submission.questionId}</div>
                                    <div className="text-sm text-muted-foreground">
                                        标注者: {submission.annotatorId || '匿名'}
                                    </div>
                                    <div className="text-sm text-muted-foreground">
                                        提交时间: {formatDate(submission.submittedAt)}
                                    </div>
                                </div>
                                <div className="text-right">
                                    <div className="text-sm text-muted-foreground mb-1">总体胜者</div>
                                    {getWinnerDisplay(submission.overallWinner)}
                                </div>
                            </div>

                            <div>
                                <div className="text-sm font-medium mb-2">维度评估结果:</div>
                                <div className="grid gap-2 md:grid-cols-2 lg:grid-cols-3">
                                    {submission.dimensionEvaluations.map((evaluation, evalIndex) => (
                                        <div key={evalIndex} className="flex justify-between items-center p-2 bg-muted rounded text-sm">
                                            <span className="truncate mr-2">{evaluation.dimensionId}</span>
                                            {getWinnerDisplay(evaluation.winner)}
                                        </div>
                                    ))}
                                </div>
                            </div>
                        </div>
                    ))}

                    {dashboardData.recentActivity.recentSubmissions.length === 0 && (
                        <div className="text-center py-8 text-muted-foreground">
                            暂无提交数据
                        </div>
                    )}
                </div>
            </CardContent>
        </Card>
    );
} 