import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { PageLayout } from '@/components/layout/PageLayout';
import { PageHeader } from '@/components/common/PageHeader';
import { LoadingScreen } from '@/components/common/LoadingScreen';
import { ErrorScreen } from '@/components/common/ErrorScreen';
import { QuestionnaireResponse } from '@/types/questionnaire';
import { Download, Database, Users, Calendar } from 'lucide-react';

interface SubmissionStats {
    totalSubmissions: number;
    submissionsByQuestion: { [questionId: string]: number };
    submissionsByDate: { [date: string]: number };
}

interface AdminData {
    metadata: {
        exportDate: string;
        totalSubmissions: number;
        submissionsByQuestion: { [questionId: string]: number };
        submissionsByDate: { [date: string]: number };
    };
    submissions: QuestionnaireResponse[];
}

export default function AdminPage() {
    const [data, setData] = useState<AdminData | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string>('');
    const [isExporting, setIsExporting] = useState(false);

    useEffect(() => {
        fetchData();
    }, []);

    const fetchData = async () => {
        try {
            setLoading(true);
            const response = await fetch('/api/questionnaire/export');

            if (!response.ok) {
                throw new Error('Failed to fetch data');
            }

            const result = await response.json();
            setData(result);
        } catch (err) {
            setError(err instanceof Error ? err.message : 'Failed to load data');
        } finally {
            setLoading(false);
        }
    };

    const handleExport = async () => {
        try {
            setIsExporting(true);
            const response = await fetch('/api/questionnaire/export');

            if (!response.ok) {
                throw new Error('Failed to export data');
            }

            const blob = await response.blob();
            const url = window.URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.style.display = 'none';
            a.href = url;
            a.download = `questionnaire-export-${new Date().toISOString().split('T')[0]}.json`;
            document.body.appendChild(a);
            a.click();
            window.URL.revokeObjectURL(url);
            document.body.removeChild(a);
        } catch (err) {
            console.error('Export error:', err);
        } finally {
            setIsExporting(false);
        }
    };

    const formatDate = (date: Date | string) => {
        return new Date(date).toLocaleDateString('zh-CN', {
            year: 'numeric',
            month: '2-digit',
            day: '2-digit',
            hour: '2-digit',
            minute: '2-digit'
        });
    };

    const getWinnerDisplay = (winner: 'A' | 'B' | 'tie') => {
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

    if (loading) {
        return <LoadingScreen message="Loading submission data..." />;
    }

    if (error) {
        return (
            <PageLayout maxWidth="4xl">
                <ErrorScreen
                    error={error}
                    onRetry={fetchData}
                    onGoHome={() => window.location.href = '/'}
                />
            </PageLayout>
        );
    }

    if (!data) {
        return (
            <PageLayout maxWidth="4xl">
                <ErrorScreen
                    error="No data available"
                    onRetry={fetchData}
                    onGoHome={() => window.location.href = '/'}
                />
            </PageLayout>
        );
    }

    const { metadata, submissions } = data;

    return (
        <PageLayout maxWidth="7xl">
            <PageHeader
                title="管理面板"
                description="查看问卷提交数据和统计信息"
                icon={<Database className="h-8 w-8" />}
            >
                <Button onClick={handleExport} disabled={isExporting} className="flex items-center gap-2">
                    <Download className="h-4 w-4" />
                    {isExporting ? '导出中...' : '导出数据'}
                </Button>
            </PageHeader>

            {/* 统计信息卡片 */}
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3 mb-8">
                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">总提交数</CardTitle>
                        <Users className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">{metadata.totalSubmissions}</div>
                    </CardContent>
                </Card>

                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">问题数量</CardTitle>
                        <Database className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">
                            {Object.keys(metadata.submissionsByQuestion).length}
                        </div>
                    </CardContent>
                </Card>

                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">最后更新</CardTitle>
                        <Calendar className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold text-sm">
                            {formatDate(metadata.exportDate)}
                        </div>
                    </CardContent>
                </Card>
            </div>

            {/* 每日提交统计 */}
            <Card className="mb-8">
                <CardHeader>
                    <CardTitle>每日提交统计</CardTitle>
                </CardHeader>
                <CardContent>
                    <div className="space-y-2">
                        {Object.entries(metadata.submissionsByDate)
                            .sort(([a], [b]) => b.localeCompare(a))
                            .slice(0, 10)
                            .map(([date, count]) => (
                                <div key={date} className="flex justify-between items-center p-2 bg-muted rounded">
                                    <span>{date}</span>
                                    <Badge variant="secondary">{count} 次提交</Badge>
                                </div>
                            ))}
                    </div>
                </CardContent>
            </Card>

            {/* 提交详情列表 */}
            <Card>
                <CardHeader>
                    <CardTitle>提交详情</CardTitle>
                </CardHeader>
                <CardContent>
                    <div className="space-y-4">
                        {submissions.map((submission, index) => (
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

                        {submissions.length === 0 && (
                            <div className="text-center py-8 text-muted-foreground">
                                暂无提交数据
                            </div>
                        )}
                    </div>
                </CardContent>
            </Card>
        </PageLayout>
    );
} 