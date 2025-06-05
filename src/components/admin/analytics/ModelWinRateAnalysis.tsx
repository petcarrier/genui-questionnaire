import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Button } from '@/components/ui/button';
import {
    Trophy,
    Target,
    BarChart3,
    TrendingUp,
    Users,
    RefreshCw,
    Award,
    Zap
} from 'lucide-react';
import { ModelWinRateAnalysis, AdminFilterOptions } from '@/types/admin';

interface ModelWinRateAnalysisProps {
    filters?: AdminFilterOptions;
}

export default function ModelWinRateAnalysisComponent({ filters }: ModelWinRateAnalysisProps) {
    const [data, setData] = useState<ModelWinRateAnalysis | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string>('');

    useEffect(() => {
        fetchWinRateData();
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

    const fetchWinRateData = async () => {
        try {
            setLoading(true);
            const queryParams = buildQueryParams();
            const response = await fetch(`/api/admin/model-winrate?${queryParams}`);

            if (!response.ok) {
                throw new Error('Failed to fetch model win rate data');
            }

            const result = await response.json();
            setData(result.data);
        } catch (err) {
            setError(err instanceof Error ? err.message : 'Failed to load win rate data');
        } finally {
            setLoading(false);
        }
    };

    if (loading) {
        return (
            <Card>
                <CardContent className="flex items-center justify-center py-6">
                    <div className="flex items-center gap-2">
                        <RefreshCw className="h-4 w-4 animate-spin" />
                        <span className="text-muted-foreground text-sm">计算模型赢率中...</span>
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
                    <Button variant="outline" onClick={fetchWinRateData} size="sm">
                        <RefreshCw className="h-4 w-4 mr-2" />
                        重试
                    </Button>
                </CardContent>
            </Card>
        );
    }

    if (!data) {
        return (
            <Card>
                <CardContent className="flex items-center justify-center py-6">
                    <div className="text-muted-foreground text-sm">暂无赢率数据</div>
                </CardContent>
            </Card>
        );
    }

    const { oursAnalysis } = data;

    return (
        <div className="space-y-4">
            {/* Main Win Rate Card */}
            <Card>
                <CardHeader className="pb-3">
                    <CardTitle className="flex items-center gap-2 text-base">
                        <Trophy className="h-4 w-4 text-yellow-500" />
                        Ours (Claude 3.7) 模型赢率分析
                        <Badge variant="secondary" className="ml-auto text-xs">
                            {oursAnalysis.totalComparisons} 次对比
                        </Badge>
                    </CardTitle>
                </CardHeader>
                <CardContent className="pt-0">
                    {oursAnalysis.totalComparisons > 0 ? (
                        <div className="space-y-4">
                            {/* Main Stats - Compact Grid */}
                            <div className="grid grid-cols-3 gap-3">
                                <div className="space-y-1">
                                    <div className="flex items-center justify-between">
                                        <span className="text-xs font-medium text-green-600">胜率</span>
                                        <span className="text-sm font-bold text-green-600">
                                            {oursAnalysis.winRate.toFixed(1)}%
                                        </span>
                                    </div>
                                    <Progress value={oursAnalysis.winRate} className="h-1.5" />
                                    <div className="text-xs text-muted-foreground">
                                        {oursAnalysis.wins} 胜
                                    </div>
                                </div>

                                <div className="space-y-1">
                                    <div className="flex items-center justify-between">
                                        <span className="text-xs font-medium text-yellow-600">平率</span>
                                        <span className="text-sm font-bold text-yellow-600">
                                            {oursAnalysis.tieRate.toFixed(1)}%
                                        </span>
                                    </div>
                                    <Progress value={oursAnalysis.tieRate} className="h-1.5" />
                                    <div className="text-xs text-muted-foreground">
                                        {oursAnalysis.ties} 平
                                    </div>
                                </div>

                                <div className="space-y-1">
                                    <div className="flex items-center justify-between">
                                        <span className="text-xs font-medium text-red-600">败率</span>
                                        <span className="text-sm font-bold text-red-600">
                                            {oursAnalysis.lossRate.toFixed(1)}%
                                        </span>
                                    </div>
                                    <Progress value={oursAnalysis.lossRate} className="h-1.5" />
                                    <div className="text-xs text-muted-foreground">
                                        {oursAnalysis.losses} 败
                                    </div>
                                </div>
                            </div>

                            {/* Visual Win Rate Bar */}
                            <div className="space-y-2">
                                <div className="text-xs font-medium">综合表现</div>
                                <div className="relative h-4 bg-muted rounded-full overflow-hidden">
                                    <div
                                        className="absolute left-0 top-0 h-full bg-green-500 transition-all duration-500"
                                        style={{ width: `${oursAnalysis.winRate}%` }}
                                    />
                                    <div
                                        className="absolute top-0 h-full bg-yellow-500 transition-all duration-500"
                                        style={{
                                            left: `${oursAnalysis.winRate}%`,
                                            width: `${oursAnalysis.tieRate}%`
                                        }}
                                    />
                                    <div
                                        className="absolute top-0 h-full bg-red-500 transition-all duration-500"
                                        style={{
                                            left: `${oursAnalysis.winRate + oursAnalysis.tieRate}%`,
                                            width: `${oursAnalysis.lossRate}%`
                                        }}
                                    />
                                </div>
                                <div className="flex justify-between text-xs text-muted-foreground">
                                    <span>胜 {oursAnalysis.winRate.toFixed(1)}%</span>
                                    <span>平 {oursAnalysis.tieRate.toFixed(1)}%</span>
                                    <span>败 {oursAnalysis.lossRate.toFixed(1)}%</span>
                                </div>
                            </div>
                        </div>
                    ) : (
                        <div className="flex flex-col items-center justify-center py-6 text-muted-foreground">
                            <Target className="h-6 w-6 mb-2" />
                            <div className="text-sm">暂无对比数据</div>
                        </div>
                    )}
                </CardContent>
            </Card>

            {/* Compact Layout: VS Models and All Models in Grid */}
            <div className="grid gap-4 lg:grid-cols-2">
                {/* Detailed Breakdown vs Other Models */}
                {oursAnalysis.vsModels.length > 0 && (
                    <Card>
                        <CardHeader className="pb-3">
                            <CardTitle className="flex items-center gap-2 text-sm">
                                <BarChart3 className="h-4 w-4" />
                                对比各模型详细数据
                            </CardTitle>
                        </CardHeader>
                        <CardContent className="pt-0">
                            <div className="space-y-2">
                                {oursAnalysis.vsModels
                                    .sort((a, b) => b.comparisons - a.comparisons)
                                    .map((vs, index) => (
                                        <div key={index} className="space-y-1 p-2 border rounded text-xs">
                                            <div className="flex items-center justify-between">
                                                <div className="flex items-center gap-2">
                                                    <Users className="h-3 w-3 text-muted-foreground" />
                                                    <span className="font-medium text-xs">{vs.opponentModel}</span>
                                                    <Badge variant="outline" className="text-xs px-1 py-0">
                                                        {vs.comparisons}次
                                                    </Badge>
                                                </div>
                                                <span className="text-xs font-medium text-green-600">
                                                    {vs.winRate.toFixed(1)}%
                                                </span>
                                            </div>

                                            <div className="flex justify-between text-xs text-muted-foreground">
                                                <span className="text-green-600">{vs.wins}胜</span>
                                                <span className="text-yellow-600">{vs.ties}平</span>
                                                <span className="text-red-600">{vs.losses}败</span>
                                            </div>

                                            <Progress value={vs.winRate} className="h-1" />
                                        </div>
                                    ))}
                            </div>
                        </CardContent>
                    </Card>
                )}

                {/* All Models Summary */}
                <Card>
                    <CardHeader className="pb-3">
                        <CardTitle className="flex items-center gap-2 text-sm">
                            <Award className="h-4 w-4" />
                            所有模型概览
                        </CardTitle>
                    </CardHeader>
                    <CardContent className="pt-0">
                        <div className="space-y-2">
                            {data.allModels
                                .sort((a, b) => b.winRate - a.winRate)
                                .map((model, index) => (
                                    <div key={index} className="flex items-center justify-between p-2 border rounded">
                                        <div className="flex items-center gap-2">
                                            <div className="flex items-center gap-1">
                                                {index === 0 && <Trophy className="h-3 w-3 text-yellow-500" />}
                                                {index === 1 && <Award className="h-3 w-3 text-gray-400" />}
                                                {index === 2 && <Zap className="h-3 w-3 text-orange-500" />}
                                                <span className={`text-xs font-medium ${model.modelName === "Ours (Claude 3.7)" ? 'text-blue-600' : ''
                                                    }`}>
                                                    {model.modelName}
                                                </span>
                                            </div>
                                            <Badge variant="outline" className="text-xs px-1 py-0">
                                                {model.totalComparisons}次
                                            </Badge>
                                        </div>
                                        <div className="flex items-center gap-2">
                                            <div className="text-right">
                                                <div className="text-xs font-medium text-green-600">
                                                    {model.winRate.toFixed(1)}%
                                                </div>
                                                <div className="text-xs text-muted-foreground">
                                                    {model.wins}胜 {model.ties}平 {model.losses}败
                                                </div>
                                            </div>
                                            <div className="w-16">
                                                <Progress value={model.winRate} className="h-1" />
                                            </div>
                                        </div>
                                    </div>
                                ))}
                        </div>
                    </CardContent>
                </Card>
            </div>
        </div>
    );
} 