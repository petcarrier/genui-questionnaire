import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { AlertTriangle, CheckCircle, XCircle, Clock, TrendingUp, TrendingDown } from 'lucide-react';
import { cn } from '@/lib/utils';

interface TrapAnalysisData {
    totalTrapQuestions: number;
    totalTrapResponses: number;
    correctTrapResponses: number;
    incorrectTrapResponses: number;
    accuracy: number;
    userPerformance: Array<{
        annotatorId: string;
        totalTraps: number;
        correctTraps: number;
        accuracy: number;
        status: 'excellent' | 'good' | 'warning' | 'poor';
    }>;
    trapTypeAnalysis: Array<{
        trapType: string;
        total: number;
        correct: number;
        accuracy: number;
    }>;
    recentTrapFailures: Array<{
        annotatorId: string;
        questionId: string;
        submittedAt: string;
        trapType: string;
    }>;
}

interface TrapQuestionAnalysisProps {
    timeRange?: string;
}

export default function TrapQuestionAnalysis({ timeRange = '30d' }: TrapQuestionAnalysisProps) {
    const [data, setData] = useState<TrapAnalysisData | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string>('');

    useEffect(() => {
        fetchTrapAnalysisData();
    }, [timeRange]);

    const fetchTrapAnalysisData = async () => {
        try {
            setLoading(true);
            const response = await fetch(`/api/admin/trap-analysis?timeRange=${timeRange}`);

            if (!response.ok) {
                throw new Error('Failed to fetch trap analysis data');
            }

            const result = await response.json();
            setData(result.data);
        } catch (err) {
            setError(err instanceof Error ? err.message : 'Failed to load trap analysis data');
        } finally {
            setLoading(false);
        }
    };

    const getStatusColor = (status: string) => {
        switch (status) {
            case 'excellent': return 'bg-green-100 text-green-800 border-green-200';
            case 'good': return 'bg-blue-100 text-blue-800 border-blue-200';
            case 'warning': return 'bg-yellow-100 text-yellow-800 border-yellow-200';
            case 'poor': return 'bg-red-100 text-red-800 border-red-200';
            default: return 'bg-gray-100 text-gray-800 border-gray-200';
        }
    };

    const getStatusIcon = (status: string) => {
        switch (status) {
            case 'excellent': return <CheckCircle className="h-4 w-4" />;
            case 'good': return <TrendingUp className="h-4 w-4" />;
            case 'warning': return <AlertTriangle className="h-4 w-4" />;
            case 'poor': return <XCircle className="h-4 w-4" />;
            default: return <Clock className="h-4 w-4" />;
        }
    };

    const getStatusText = (status: string) => {
        switch (status) {
            case 'excellent': return 'Excellent';
            case 'good': return 'Good';
            case 'warning': return 'Warning';
            case 'poor': return 'Poor';
            default: return 'Unknown';
        }
    };

    if (loading) {
        return (
            <Card>
                <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                        <AlertTriangle className="h-5 w-5" />
                        Trap Question Analysis
                    </CardTitle>
                </CardHeader>
                <CardContent>
                    <div className="animate-pulse space-y-4">
                        <div className="h-4 bg-gray-200 rounded w-3/4"></div>
                        <div className="h-4 bg-gray-200 rounded w-1/2"></div>
                        <div className="h-4 bg-gray-200 rounded w-2/3"></div>
                    </div>
                </CardContent>
            </Card>
        );
    }

    if (error) {
        return (
            <Card>
                <CardHeader>
                    <CardTitle className="flex items-center gap-2 text-red-600">
                        <XCircle className="h-5 w-5" />
                        Trap Question Analysis - Load Failed
                    </CardTitle>
                </CardHeader>
                <CardContent>
                    <p className="text-red-600">{error}</p>
                </CardContent>
            </Card>
        );
    }

    if (!data) {
        return (
            <Card>
                <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                        <AlertTriangle className="h-5 w-5" />
                        Trap Question Analysis
                    </CardTitle>
                </CardHeader>
                <CardContent>
                    <p className="text-gray-500">No trap question data available</p>
                </CardContent>
            </Card>
        );
    }

    return (
        <div className="space-y-6">
            {/* Overall Overview */}
            <Card>
                <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                        <AlertTriangle className="h-5 w-5" />
                        Trap Question Overall Performance
                    </CardTitle>
                </CardHeader>
                <CardContent>
                    <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                        <div className="text-center">
                            <div className="text-2xl font-bold text-blue-600">{data.totalTrapQuestions}</div>
                            <div className="text-sm text-gray-500">Total Trap Questions</div>
                        </div>
                        <div className="text-center">
                            <div className="text-2xl font-bold text-green-600">{data.correctTrapResponses}</div>
                            <div className="text-sm text-gray-500">Correct Answers</div>
                        </div>
                        <div className="text-center">
                            <div className="text-2xl font-bold text-red-600">{data.incorrectTrapResponses}</div>
                            <div className="text-sm text-gray-500">Incorrect Answers</div>
                        </div>
                        <div className="text-center">
                            <div className="text-2xl font-bold text-purple-600">{data.accuracy.toFixed(1)}%</div>
                            <div className="text-sm text-gray-500">Accuracy Rate</div>
                        </div>
                    </div>
                    <div className="mt-4">
                        <div className="flex justify-between text-sm mb-2">
                            <span>Overall Quality Score</span>
                            <span>{data.accuracy.toFixed(1)}%</span>
                        </div>
                        <Progress value={data.accuracy} className="h-2" />
                    </div>
                </CardContent>
            </Card>

            {/* User Performance Analysis */}
            <Card>
                <CardHeader>
                    <CardTitle>User Performance Rankings</CardTitle>
                </CardHeader>
                <CardContent>
                    <div className="space-y-3">
                        {data.userPerformance.map((user, index) => (
                            <div key={user.annotatorId} className="flex items-center justify-between p-3 border rounded-lg">
                                <div className="flex items-center gap-3">
                                    <div className="text-sm font-medium w-8">#{index + 1}</div>
                                    <div>
                                        <div className="font-medium">{user.annotatorId}</div>
                                        <div className="text-sm text-gray-500">
                                            {user.correctTraps}/{user.totalTraps} correct
                                        </div>
                                    </div>
                                </div>
                                <div className="flex items-center gap-2">
                                    <div className="text-right">
                                        <div className="font-medium">{user.accuracy.toFixed(1)}%</div>
                                        <Badge className={cn("text-xs", getStatusColor(user.status))}>
                                            {getStatusIcon(user.status)}
                                            <span className="ml-1">{getStatusText(user.status)}</span>
                                        </Badge>
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                </CardContent>
            </Card>

            {/* Trap Question Type Analysis */}
            <Card>
                <CardHeader>
                    <CardTitle>Trap Question Type Performance</CardTitle>
                </CardHeader>
                <CardContent>
                    <div className="space-y-4">
                        {data.trapTypeAnalysis.map((trapType) => (
                            <div key={trapType.trapType} className="space-y-2">
                                <div className="flex justify-between items-center">
                                    <span className="font-medium">{trapType.trapType}</span>
                                    <span className="text-sm text-gray-500">
                                        {trapType.correct}/{trapType.total} ({trapType.accuracy.toFixed(1)}%)
                                    </span>
                                </div>
                                <Progress value={trapType.accuracy} className="h-2" />
                            </div>
                        ))}
                    </div>
                </CardContent>
            </Card>

            {/* Recent Failure Records */}
            {data.recentTrapFailures.length > 0 && (
                <Card>
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2 text-red-600">
                            <XCircle className="h-5 w-5" />
                            Recent Trap Question Failure Records
                        </CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="space-y-2">
                            {data.recentTrapFailures.map((failure, index) => (
                                <div key={index} className="flex items-center justify-between p-2 bg-red-50 border border-red-200 rounded">
                                    <div>
                                        <span className="font-medium">{failure.annotatorId}</span>
                                        <span className="text-sm text-gray-500 ml-2">
                                            Question: {failure.questionId}
                                        </span>
                                    </div>
                                    <div className="text-right">
                                        <div className="text-sm font-medium">{failure.trapType}</div>
                                        <div className="text-xs text-gray-500">
                                            {new Date(failure.submittedAt).toLocaleString('en-US')}
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </CardContent>
                </Card>
            )}
        </div>
    );
} 