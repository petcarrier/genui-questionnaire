import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { AlertTriangle, CheckCircle, XCircle, Clock, TrendingUp, TrendingDown } from 'lucide-react';
import { cn } from '@/utils/utils';

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
            setError('');

            const response = await fetch(`/api/admin/trap-analysis?timeRange=${timeRange}`);

            if (!response.ok) {
                const errorText = await response.text();
                throw new Error(`Failed to fetch trap analysis data: ${response.status} ${response.statusText}`);
            }

            const result = await response.json();

            if (result.success && result.data) {
                setData(result.data);
            } else {
                throw new Error(result.message || 'Invalid response format');
            }
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
            case 'excellent': return <CheckCircle className="h-3 w-3" />;
            case 'good': return <TrendingUp className="h-3 w-3" />;
            case 'warning': return <AlertTriangle className="h-3 w-3" />;
            case 'poor': return <XCircle className="h-3 w-3" />;
            default: return <Clock className="h-3 w-3" />;
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
            <Card className="h-48">
                <CardHeader className="pb-3">
                    <CardTitle className="flex items-center gap-2 text-lg">
                        <AlertTriangle className="h-4 w-4" />
                        Trap Question Analysis
                    </CardTitle>
                </CardHeader>
                <CardContent>
                    <div className="animate-pulse space-y-3">
                        <div className="h-3 bg-gray-200 rounded w-3/4"></div>
                        <div className="h-3 bg-gray-200 rounded w-1/2"></div>
                        <div className="h-3 bg-gray-200 rounded w-2/3"></div>
                    </div>
                </CardContent>
            </Card>
        );
    }

    if (error) {
        return (
            <Card>
                <CardHeader className="pb-3">
                    <CardTitle className="flex items-center gap-2 text-lg text-red-600">
                        <XCircle className="h-4 w-4" />
                        Trap Question Analysis - Load Failed
                    </CardTitle>
                </CardHeader>
                <CardContent>
                    <p className="text-red-600 text-sm mb-3">{error}</p>
                    <button
                        onClick={fetchTrapAnalysisData}
                        className="px-3 py-1.5 text-sm bg-red-600 text-white rounded hover:bg-red-700"
                    >
                        Retry
                    </button>
                </CardContent>
            </Card>
        );
    }

    if (!data) {
        return (
            <Card>
                <CardHeader className="pb-3">
                    <CardTitle className="flex items-center gap-2 text-lg">
                        <AlertTriangle className="h-4 w-4" />
                        Trap Question Analysis
                    </CardTitle>
                </CardHeader>
                <CardContent>
                    <p className="text-gray-500 text-sm mb-3">No trap question data available</p>
                    <button
                        onClick={fetchTrapAnalysisData}
                        className="px-3 py-1.5 text-sm bg-blue-600 text-white rounded hover:bg-blue-700"
                    >
                        Reload Data
                    </button>
                </CardContent>
            </Card>
        );
    }

    // Handle case where there are no trap responses
    if (data.totalTrapResponses === 0) {
        return (
            <Card>
                <CardHeader className="pb-3">
                    <CardTitle className="flex items-center gap-2 text-lg">
                        <AlertTriangle className="h-4 w-4" />
                        Trap Question Analysis
                    </CardTitle>
                </CardHeader>
                <CardContent>
                    <div className="text-center py-6">
                        <AlertTriangle className="h-8 w-8 text-yellow-500 mx-auto mb-3" />
                        <h3 className="text-base font-medium text-gray-900 mb-2">No Trap Question Responses</h3>
                        <p className="text-gray-500 text-sm mb-3">
                            No trap question responses found for the selected time range ({timeRange}).
                        </p>
                        <div className="text-xs text-gray-400">
                            <p>Total trap questions configured: {data.totalTrapQuestions}</p>
                        </div>
                    </div>
                </CardContent>
            </Card>
        );
    }

    return (
        <div className="space-y-4">
            {/* Overall Overview - Compact */}
            <Card>
                <CardHeader className="pb-3">
                    <CardTitle className="flex items-center gap-2 text-lg">
                        <AlertTriangle className="h-4 w-4" />
                        Trap Question Performance
                    </CardTitle>
                </CardHeader>
                <CardContent className="pt-0">
                    <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-4">
                        <div className="text-center">
                            <div className="text-xl font-bold text-blue-600">{data.totalTrapQuestions}</div>
                            <div className="text-xs text-gray-500">Total Questions</div>
                        </div>
                        <div className="text-center">
                            <div className="text-xl font-bold text-green-600">{data.correctTrapResponses}</div>
                            <div className="text-xs text-gray-500">Correct</div>
                        </div>
                        <div className="text-center">
                            <div className="text-xl font-bold text-red-600">{data.incorrectTrapResponses}</div>
                            <div className="text-xs text-gray-500">Incorrect</div>
                        </div>
                        <div className="text-center">
                            <div className="text-xl font-bold text-purple-600">{data.accuracy.toFixed(1)}%</div>
                            <div className="text-xs text-gray-500">Accuracy</div>
                        </div>
                    </div>
                    <div className="flex justify-between text-xs mb-1">
                        <span>Overall Quality</span>
                        <span>{data.accuracy.toFixed(1)}%</span>
                    </div>
                    <Progress value={data.accuracy} className="h-1.5" />
                </CardContent>
            </Card>

            {/* Two Column Layout for User Performance and Trap Types */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                {/* User Performance - Compact */}
                <Card>
                    <CardHeader className="pb-3">
                        <CardTitle className="text-base">User Performance</CardTitle>
                    </CardHeader>
                    <CardContent className="pt-0">
                        {data.userPerformance.length === 0 ? (
                            <p className="text-gray-500 text-center text-sm py-3">No user performance data</p>
                        ) : (
                            <div className="space-y-2 max-h-64 overflow-y-auto">
                                {data.userPerformance.slice(0, 10).map((user, index) => (
                                    <div key={user.annotatorId} className="flex items-center justify-between p-2 border rounded text-sm">
                                        <div className="flex items-center gap-2 min-w-0 flex-1">
                                            <div className="text-xs font-medium w-6">#{index + 1}</div>
                                            <div className="min-w-0 flex-1">
                                                <div className="font-medium truncate">{user.annotatorId}</div>
                                                <div className="text-xs text-gray-500">
                                                    {user.correctTraps}/{user.totalTraps}
                                                </div>
                                            </div>
                                        </div>
                                        <div className="flex items-center gap-2 flex-shrink-0">
                                            <div className="text-right">
                                                <div className="font-medium text-sm">{user.accuracy.toFixed(1)}%</div>
                                                <Badge className={cn("text-xs px-1 py-0", getStatusColor(user.status))}>
                                                    {getStatusIcon(user.status)}
                                                    <span className="ml-1">{getStatusText(user.status)}</span>
                                                </Badge>
                                            </div>
                                        </div>
                                    </div>
                                ))}
                                {data.userPerformance.length > 10 && (
                                    <div className="text-xs text-gray-500 text-center py-1">
                                        +{data.userPerformance.length - 10} more users
                                    </div>
                                )}
                            </div>
                        )}
                    </CardContent>
                </Card>

                {/* Trap Type Analysis - Compact */}
                <Card>
                    <CardHeader className="pb-3">
                        <CardTitle className="text-base">Trap Type Performance</CardTitle>
                    </CardHeader>
                    <CardContent className="pt-0">
                        {data.trapTypeAnalysis.length === 0 ? (
                            <p className="text-gray-500 text-center text-sm py-3">No trap type data</p>
                        ) : (
                            <div className="space-y-3">
                                {data.trapTypeAnalysis.map((trapType) => (
                                    <div key={trapType.trapType} className="space-y-1">
                                        <div className="flex justify-between items-center">
                                            <span className="font-medium text-sm truncate">{trapType.trapType}</span>
                                            <span className="text-xs text-gray-500 flex-shrink-0 ml-2">
                                                {trapType.correct}/{trapType.total} ({trapType.accuracy.toFixed(1)}%)
                                            </span>
                                        </div>
                                        <Progress value={trapType.accuracy} className="h-1.5" />
                                    </div>
                                ))}
                            </div>
                        )}
                    </CardContent>
                </Card>
            </div>

            {/* Recent Failures - Compact */}
            {data.recentTrapFailures.length > 0 && (
                <Card>
                    <CardHeader className="pb-3">
                        <CardTitle className="flex items-center gap-2 text-base text-red-600">
                            <XCircle className="h-4 w-4" />
                            Recent Failures ({data.recentTrapFailures.length})
                        </CardTitle>
                    </CardHeader>
                    <CardContent className="pt-0">
                        <div className="space-y-2 max-h-48 overflow-y-auto">
                            {data.recentTrapFailures.slice(0, 15).map((failure, index) => (
                                <div key={index} className="flex flex-col gap-2 p-3 bg-red-50 border border-red-200 rounded text-sm sm:flex-row sm:items-center sm:justify-between sm:gap-4">
                                    {/* User and Question Info */}
                                    <div className="min-w-0 flex-1">
                                        <div className="flex flex-col gap-1 sm:flex-row sm:items-center">
                                            <span className="font-medium text-sm">{failure.annotatorId}</span>
                                            <span className="text-xs text-gray-500 break-all sm:ml-2 sm:truncate">
                                                {failure.questionId}
                                            </span>
                                        </div>
                                    </div>

                                    {/* Trap Type and Date */}
                                    <div className="flex justify-between items-center sm:flex-col sm:text-right sm:flex-shrink-0">
                                        <div className="text-xs font-medium text-red-700">{failure.trapType}</div>
                                        <div className="text-xs text-gray-500">
                                            {new Date(failure.submittedAt).toLocaleDateString('en-US', {
                                                month: 'short',
                                                day: 'numeric',
                                                hour: '2-digit',
                                                minute: '2-digit'
                                            })}
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