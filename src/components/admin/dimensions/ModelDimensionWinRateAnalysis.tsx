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
import { buildQueryParams } from '@/utils';

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

    const fetchDimensionWinRateData = async () => {
        try {
            setLoading(true);
            const queryParams = filters ? buildQueryParams(filters) : '';
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
                        <span className="text-muted-foreground text-sm">Calculating dimension win rates...</span>
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
                        Retry
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
                    <div className="text-muted-foreground text-sm">No dimension win rate data available</div>
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
                        Model Dimension Win Rate Analysis
                        <Badge variant="secondary" className="ml-auto text-xs">
                            {data.totalDimensions} dimensions · {data.totalEvaluations} evaluations
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
                                    {dimension.totalEvaluations} evals
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
                                            {dimension.oursModelStats.totalEvaluations} evals
                                        </Badge>
                                    </div>

                                    <div className="grid grid-cols-3 gap-2">
                                        <div className="space-y-1">
                                            <div className="flex items-center justify-between">
                                                <span className="text-xs font-medium text-green-600">Win</span>
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
                                                <span className="text-xs font-medium text-yellow-600">Tie</span>
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
                                                <span className="text-xs font-medium text-red-600">Loss</span>
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
                                    Rankings
                                </div>
                                <div className="space-y-1">
                                    {dimension.modelStats.map((model, modelIndex) => (
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

                                            <div className="flex items-center gap-3 shrink-0">
                                                {/* Win Rate Progress */}
                                                <div className="flex flex-col items-center gap-1">
                                                    <div className="text-xs font-medium text-green-600">
                                                        {model.winRate.toFixed(1)}%
                                                    </div>
                                                    <Progress value={model.winRate} className="h-1 w-8" />
                                                    <div className="text-xs text-muted-foreground">
                                                        {model.wins}W
                                                    </div>
                                                </div>

                                                {/* Tie Rate Progress */}
                                                <div className="flex flex-col items-center gap-1">
                                                    <div className="text-xs font-medium text-yellow-600">
                                                        {model.tieRate.toFixed(1)}%
                                                    </div>
                                                    <Progress value={model.tieRate} className="h-1 w-8" />
                                                    <div className="text-xs text-muted-foreground">
                                                        {model.ties}T
                                                    </div>
                                                </div>

                                                {/* Loss Rate Progress */}
                                                <div className="flex flex-col items-center gap-1">
                                                    <div className="text-xs font-medium text-red-600">
                                                        {model.lossRate.toFixed(1)}%
                                                    </div>
                                                    <Progress value={model.lossRate} className="h-1 w-8" />
                                                    <div className="text-xs text-muted-foreground">
                                                        {model.losses}L
                                                    </div>
                                                </div>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        </CardContent>
                    </Card>
                ))}
            </div>
        </div>
    );
} 