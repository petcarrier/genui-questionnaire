import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Button } from '@/components/ui/button';
import {
    Target,
    BarChart3,
    RefreshCw,
    TrendingUp,
    Award,
    Trophy,
    Zap,
    Crown
} from 'lucide-react';
import { ModelDimensionWinRateAnalysis, AdminFilterOptions } from '@/types/admin';

interface ModelDimensionWinRateAnalysisProps {
    filters?: AdminFilterOptions;
}

export default function ModelDimensionWinRateAnalysisComponent({ filters }: ModelDimensionWinRateAnalysisProps) {
    const [data, setData] = useState<ModelDimensionWinRateAnalysis | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string>('');

    useEffect(() => {
        fetchDimensionWinRateData();
    }, [filters]);

    const buildQueryParams = () => {
        const params = new URLSearchParams();

        if (filters) {
            if (filters.timeRange === 'custom') {
                if (filters.customStartDate) {
                    const startDate = new Date(filters.customStartDate);
                    startDate.setHours(0, 0, 0, 0);
                    params.append('startDate', startDate.toISOString());
                }
                if (filters.customEndDate) {
                    const endDate = new Date(filters.customEndDate);
                    endDate.setHours(23, 59, 59, 999);
                    params.append('endDate', endDate.toISOString());
                }
            } else {
                params.append('timeRange', filters.timeRange);
            }

            if (filters.excludeTrapQuestions) params.append('excludeTraps', 'true');
            if (filters.excludeIncompleteSubmissions) params.append('excludeIncomplete', 'true');
        }

        return params.toString();
    };

    const fetchDimensionWinRateData = async () => {
        try {
            setLoading(true);
            const queryParams = buildQueryParams();
            const response = await fetch(`/api/admin/model-dimension-winrate?${queryParams}`);

            if (!response.ok) {
                throw new Error('Failed to fetch model dimension win rate data');
            }

            const result = await response.json();
            setData(result.data);
        } catch (err) {
            setError(err instanceof Error ? err.message : 'Failed to load dimension win rate data');
        } finally {
            setLoading(false);
        }
    };

    const getModelIcon = (modelName: string, rank: number) => {
        if (modelName === "Ours (Claude 3.7)") {
            return <Crown className="h-3 w-3 text-blue-600" />;
        }
        if (rank === 0) return <Trophy className="h-3 w-3 text-yellow-500" />;
        if (rank === 1) return <Award className="h-3 w-3 text-gray-400" />;
        if (rank === 2) return <Zap className="h-3 w-3 text-orange-500" />;
        return null;
    };

    const getWinRateColor = (winRate: number) => {
        if (winRate >= 60) return 'text-green-600';
        if (winRate >= 40) return 'text-yellow-600';
        return 'text-red-600';
    };

    if (loading) {
        return (
            <Card>
                <CardContent className="flex items-center justify-center py-6">
                    <div className="flex items-center gap-2">
                        <RefreshCw className="h-4 w-4 animate-spin" />
                        <span className="text-muted-foreground text-sm">计算维度赢率中...</span>
                    </div>
                </CardContent>
            </Card>
        );
    }

    if (error) {
        return (
            <Card>
                <CardContent className="flex flex-col items-center justify-center py-6 space-y-2">
                    <div className="text-red-500 text-sm">{error}</div>
                    <Button variant="outline" onClick={fetchDimensionWinRateData} size="sm">
                        <RefreshCw className="h-4 w-4 mr-2" />
                        重试
                    </Button>
                </CardContent>
            </Card>
        );
    }

    if (!data || data.dimensionComparisons.length === 0) {
        return (
            <Card>
                <CardContent className="flex flex-col items-center justify-center py-6">
                    <Target className="h-6 w-6 mb-2 text-muted-foreground" />
                    <div className="text-muted-foreground text-sm">暂无维度赢率数据</div>
                </CardContent>
            </Card>
        );
    }

    return (
        <div className="space-y-4">
            {/* Overview Card */}
            <Card>
                <CardHeader className="pb-3">
                    <CardTitle className="flex items-center gap-2 text-base">
                        <BarChart3 className="h-4 w-4" />
                        模型维度赢率分析
                        <Badge variant="secondary" className="ml-auto text-xs">
                            {data.totalDimensions} 个维度 · {data.totalEvaluations} 次评估
                        </Badge>
                    </CardTitle>
                </CardHeader>
            </Card>

            {/* Dimension-wise Analysis - Compact Grid Layout */}
            <div className="grid gap-3 lg:grid-cols-2">
                {data.dimensionComparisons.map((dimension, dimIndex) => (
                    <Card key={dimIndex}>
                        <CardHeader className="pb-2">
                            <CardTitle className="flex items-center justify-between text-sm">
                                <div className="flex items-center gap-2">
                                    <Target className="h-4 w-4 text-blue-500" />
                                    {dimension.dimensionLabel}
                                </div>
                                <Badge variant="outline" className="text-xs">
                                    {dimension.totalEvaluations} 次
                                </Badge>
                            </CardTitle>
                        </CardHeader>
                        <CardContent className="pt-0">
                            {/* Ours Model Highlight - Compact */}
                            {dimension.oursModelStats && (
                                <div className="mb-3 p-3 bg-blue-50 dark:bg-blue-950/30 rounded border border-blue-200 dark:border-blue-800">
                                    <div className="flex items-center justify-between mb-2">
                                        <div className="flex items-center gap-2">
                                            <Crown className="h-4 w-4 text-blue-600" />
                                            <span className="font-medium text-sm text-blue-900 dark:text-blue-100">
                                                Ours (Claude 3.7)
                                            </span>
                                        </div>
                                        <Badge variant="secondary" className="text-xs">
                                            {dimension.oursModelStats.totalEvaluations} 次
                                        </Badge>
                                    </div>

                                    <div className="grid grid-cols-3 gap-2">
                                        <div className="space-y-1">
                                            <div className="flex items-center justify-between">
                                                <span className="text-xs font-medium text-green-600">胜</span>
                                                <span className="text-xs font-bold text-green-600">
                                                    {dimension.oursModelStats.winRate.toFixed(1)}%
                                                </span>
                                            </div>
                                            <Progress value={dimension.oursModelStats.winRate} className="h-1" />
                                            <div className="text-xs text-muted-foreground text-center">
                                                {dimension.oursModelStats.wins}
                                            </div>
                                        </div>

                                        <div className="space-y-1">
                                            <div className="flex items-center justify-between">
                                                <span className="text-xs font-medium text-yellow-600">平</span>
                                                <span className="text-xs font-bold text-yellow-600">
                                                    {dimension.oursModelStats.tieRate.toFixed(1)}%
                                                </span>
                                            </div>
                                            <Progress value={dimension.oursModelStats.tieRate} className="h-1" />
                                            <div className="text-xs text-muted-foreground text-center">
                                                {dimension.oursModelStats.ties}
                                            </div>
                                        </div>

                                        <div className="space-y-1">
                                            <div className="flex items-center justify-between">
                                                <span className="text-xs font-medium text-red-600">败</span>
                                                <span className="text-xs font-bold text-red-600">
                                                    {dimension.oursModelStats.lossRate.toFixed(1)}%
                                                </span>
                                            </div>
                                            <Progress value={dimension.oursModelStats.lossRate} className="h-1" />
                                            <div className="text-xs text-muted-foreground text-center">
                                                {dimension.oursModelStats.losses}
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            )}

                            {/* All Models for this Dimension - Ultra Compact */}
                            <div className="space-y-2">
                                <div className="text-xs font-medium text-muted-foreground">
                                    排名
                                </div>
                                <div className="space-y-1">
                                    {dimension.modelStats.slice(0, 5).map((model, modelIndex) => (
                                        <div
                                            key={modelIndex}
                                            className={`flex items-center justify-between p-2 rounded text-xs border ${model.modelName === "Ours (Claude 3.7)"
                                                ? 'bg-blue-50 dark:bg-blue-950/20 border-blue-200 dark:border-blue-800'
                                                : 'bg-muted/30'
                                                }`}
                                        >
                                            <div className="flex items-center gap-2 flex-1 min-w-0">
                                                <div className="flex items-center gap-1">
                                                    {getModelIcon(model.modelName, modelIndex)}
                                                    <span className={`font-medium truncate ${model.modelName === "Ours (Claude 3.7)"
                                                        ? 'text-blue-700 dark:text-blue-300'
                                                        : ''
                                                        }`}>
                                                        {model.modelName}
                                                    </span>
                                                </div>
                                                <Badge variant="outline" className="text-xs px-1 py-0 shrink-0">
                                                    {model.totalEvaluations}
                                                </Badge>
                                            </div>

                                            <div className="flex items-center gap-2 shrink-0">
                                                <div className="text-right">
                                                    <div className={`font-medium ${getWinRateColor(model.winRate)}`}>
                                                        {model.winRate.toFixed(1)}%
                                                    </div>
                                                    <div className="text-xs text-muted-foreground">
                                                        {model.wins}胜 {model.ties}平 {model.losses}败
                                                    </div>
                                                </div>
                                                <div className="w-12">
                                                    <Progress value={model.winRate} className="h-1" />
                                                </div>
                                            </div>
                                        </div>
                                    ))}
                                    {dimension.modelStats.length > 5 && (
                                        <div className="text-xs text-muted-foreground text-center py-1">
                                            还有 {dimension.modelStats.length - 5} 个模型...
                                        </div>
                                    )}
                                </div>
                            </div>
                        </CardContent>
                    </Card>
                ))}
            </div>

            {/* Summary Statistics - Compact */}
            <Card>
                <CardHeader className="pb-2">
                    <CardTitle className="flex items-center gap-2 text-sm">
                        <TrendingUp className="h-4 w-4" />
                        总结统计
                    </CardTitle>
                </CardHeader>
                <CardContent className="pt-0">
                    <div className="grid grid-cols-3 gap-4 text-center">
                        <div className="space-y-1">
                            <div className="text-lg font-bold text-blue-600">
                                {data.totalDimensions}
                            </div>
                            <div className="text-xs text-muted-foreground">
                                分析维度数
                            </div>
                        </div>

                        <div className="space-y-1">
                            <div className="text-lg font-bold text-green-600">
                                {data.totalEvaluations}
                            </div>
                            <div className="text-xs text-muted-foreground">
                                总评估次数
                            </div>
                        </div>

                        <div className="space-y-1">
                            <div className="text-lg font-bold text-purple-600">
                                {data.dimensionComparisons.filter(d => d.oursModelStats).length}
                            </div>
                            <div className="text-xs text-muted-foreground">
                                Ours 参与维度
                            </div>
                        </div>
                    </div>
                </CardContent>
            </Card>
        </div>
    );
} 