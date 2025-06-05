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
import { buildQueryParams } from '@/utils';

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

    const fetchWinRateData = async () => {
        try {
            setLoading(true);
            const queryParams = filters ? buildQueryParams(filters) : '';
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
                        <span className="text-muted-foreground text-sm">Calculating model win rates...</span>
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
                        Retry
                    </Button>
                </CardContent>
            </Card>
        );
    }

    if (!data) {
        return (
            <Card>
                <CardContent className="flex items-center justify-center py-6">
                    <div className="text-muted-foreground text-sm">No win rate data available</div>
                </CardContent>
            </Card>
        );
    }

    const { oursAnalysis } = data;

    return (
        <div className="space-y-4 sm:space-y-6">
            {/* Main Win Rate Card */}
            <Card>
                <CardHeader className="pb-3">
                    <CardTitle className="flex flex-col gap-2 sm:flex-row sm:items-center text-base">
                        <div className="flex items-center gap-2">
                            <Trophy className="h-4 w-4 text-yellow-500" />
                            <span>Ours (Claude 3.7) Model Win Rate Analysis</span>
                        </div>
                        <Badge variant="secondary" className="text-xs sm:ml-auto">
                            {oursAnalysis.totalComparisons} comparisons
                        </Badge>
                    </CardTitle>
                </CardHeader>
                <CardContent className="pt-0">
                    {oursAnalysis.totalComparisons > 0 ? (
                        <div className="space-y-4 sm:space-y-6">
                            {/* Main Stats - Mobile optimized Grid */}
                            <div className="grid grid-cols-1 gap-4 sm:grid-cols-3 sm:gap-3">
                                <div className="space-y-2">
                                    <div className="flex items-center justify-between">
                                        <span className="text-sm font-medium text-green-600">Win Rate</span>
                                        <span className="text-lg sm:text-sm font-bold text-green-600">
                                            {oursAnalysis.winRate.toFixed(1)}%
                                        </span>
                                    </div>
                                    <Progress value={oursAnalysis.winRate} className="h-2 sm:h-1.5" />
                                    <div className="text-sm sm:text-xs text-muted-foreground">
                                        {oursAnalysis.wins} wins
                                    </div>
                                </div>

                                <div className="space-y-2">
                                    <div className="flex items-center justify-between">
                                        <span className="text-sm font-medium text-yellow-600">Tie Rate</span>
                                        <span className="text-lg sm:text-sm font-bold text-yellow-600">
                                            {oursAnalysis.tieRate.toFixed(1)}%
                                        </span>
                                    </div>
                                    <Progress value={oursAnalysis.tieRate} className="h-2 sm:h-1.5" />
                                    <div className="text-sm sm:text-xs text-muted-foreground">
                                        {oursAnalysis.ties} ties
                                    </div>
                                </div>

                                <div className="space-y-2">
                                    <div className="flex items-center justify-between">
                                        <span className="text-sm font-medium text-red-600">Loss Rate</span>
                                        <span className="text-lg sm:text-sm font-bold text-red-600">
                                            {oursAnalysis.lossRate.toFixed(1)}%
                                        </span>
                                    </div>
                                    <Progress value={oursAnalysis.lossRate} className="h-2 sm:h-1.5" />
                                    <div className="text-sm sm:text-xs text-muted-foreground">
                                        {oursAnalysis.losses} losses
                                    </div>
                                </div>
                            </div>

                            {/* Visual Win Rate Bar */}
                            <div className="space-y-3">
                                <div className="text-sm font-medium">Overall Performance</div>
                                <div className="relative h-6 sm:h-4 bg-muted rounded-full overflow-hidden">
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
                                    <span>Win {oursAnalysis.winRate.toFixed(1)}%</span>
                                    <span>Tie {oursAnalysis.tieRate.toFixed(1)}%</span>
                                    <span>Loss {oursAnalysis.lossRate.toFixed(1)}%</span>
                                </div>
                            </div>
                        </div>
                    ) : (
                        <div className="flex flex-col items-center justify-center py-8 text-muted-foreground">
                            <Target className="h-8 w-8 mb-3" />
                            <div className="text-base">No comparison data available</div>
                        </div>
                    )}
                </CardContent>
            </Card>

            {/* Compact Layout: VS Models and All Models in Grid - Mobile optimized */}
            <div className="grid gap-4 xl:grid-cols-2">
                {/* Detailed Breakdown vs Other Models */}
                {oursAnalysis.vsModels.length > 0 && (
                    <Card>
                        <CardHeader className="pb-3">
                            <CardTitle className="flex items-center gap-2 text-sm sm:text-base">
                                <BarChart3 className="h-4 w-4" />
                                <span className="truncate">Ours (Claude 3.7) vs Other Models</span>
                            </CardTitle>
                        </CardHeader>
                        <CardContent className="pt-0">
                            <div className="space-y-3">
                                {oursAnalysis.vsModels
                                    .sort((a, b) => b.comparisons - a.comparisons)
                                    .map((vs, index) => {
                                        const tieRate = vs.comparisons > 0 ? (vs.ties / vs.comparisons) * 100 : 0;
                                        const lossRate = vs.comparisons > 0 ? (vs.losses / vs.comparisons) * 100 : 0;

                                        return (
                                            <div key={index} className="p-3 border rounded-lg space-y-3">
                                                {/* Header with opponent model name and comparisons */}
                                                <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
                                                    <div className="flex items-center gap-2">
                                                        <Users className="h-3 w-3 text-muted-foreground" />
                                                        <span className="font-medium text-sm truncate">vs {vs.opponentModel}</span>
                                                    </div>
                                                    <Badge variant="outline" className="text-xs px-2 py-1 self-start sm:self-auto">
                                                        {vs.comparisons} comps
                                                    </Badge>
                                                </div>

                                                {/* Detailed stats grid - Mobile optimized */}
                                                <div className="grid grid-cols-3 gap-3">
                                                    <div className="text-center">
                                                        <div className="text-sm font-medium text-green-600">
                                                            {vs.winRate.toFixed(1)}%
                                                        </div>
                                                        <div className="text-xs text-muted-foreground">
                                                            Win Rate ({vs.wins})
                                                        </div>
                                                    </div>
                                                    <div className="text-center">
                                                        <div className="text-sm font-medium text-yellow-600">
                                                            {tieRate.toFixed(1)}%
                                                        </div>
                                                        <div className="text-xs text-muted-foreground">
                                                            Tie Rate ({vs.ties})
                                                        </div>
                                                    </div>
                                                    <div className="text-center">
                                                        <div className="text-sm font-medium text-red-600">
                                                            {lossRate.toFixed(1)}%
                                                        </div>
                                                        <div className="text-xs text-muted-foreground">
                                                            Loss Rate ({vs.losses})
                                                        </div>
                                                    </div>
                                                </div>

                                                {/* Visual progress bar */}
                                                <div className="relative h-3 sm:h-2 bg-muted rounded-full overflow-hidden">
                                                    <div
                                                        className="absolute left-0 top-0 h-full bg-green-500 transition-all duration-300"
                                                        style={{ width: `${vs.winRate}%` }}
                                                    />
                                                    <div
                                                        className="absolute top-0 h-full bg-yellow-500 transition-all duration-300"
                                                        style={{
                                                            left: `${vs.winRate}%`,
                                                            width: `${tieRate}%`
                                                        }}
                                                    />
                                                    <div
                                                        className="absolute top-0 h-full bg-red-500 transition-all duration-300"
                                                        style={{
                                                            left: `${vs.winRate + tieRate}%`,
                                                            width: `${lossRate}%`
                                                        }}
                                                    />
                                                </div>
                                            </div>
                                        );
                                    })}
                            </div>
                        </CardContent>
                    </Card>
                )}

                {/* All Models Summary */}
                <Card>
                    <CardHeader className="pb-3">
                        <CardTitle className="flex items-center gap-2 text-sm sm:text-base">
                            <Award className="h-4 w-4" />
                            All Models Overview
                        </CardTitle>
                    </CardHeader>
                    <CardContent className="pt-0">
                        <div className="space-y-3">
                            {data.allModels
                                .sort((a, b) => b.winRate - a.winRate)
                                .map((model, index) => (
                                    <div key={index} className="p-3 border rounded-lg space-y-3">
                                        {/* Header with model name and total comparisons */}
                                        <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
                                            <div className="flex items-center gap-2">
                                                {index === 0 && <Trophy className="h-3 w-3 text-yellow-500" />}
                                                {index === 1 && <Award className="h-3 w-3 text-gray-400" />}
                                                {index === 2 && <Zap className="h-3 w-3 text-orange-500" />}
                                                <span className={`text-sm font-medium truncate ${model.modelName === "Ours (Claude 3.7)" ? 'text-blue-600' : ''
                                                    }`}>
                                                    {model.modelName}
                                                </span>
                                            </div>
                                            <Badge variant="outline" className="text-xs px-2 py-1 self-start sm:self-auto">
                                                {model.totalComparisons} comps
                                            </Badge>
                                        </div>

                                        {/* Detailed stats grid - Mobile optimized */}
                                        <div className="grid grid-cols-3 gap-3">
                                            <div className="text-center">
                                                <div className="text-sm font-medium text-green-600">
                                                    {model.winRate.toFixed(1)}%
                                                </div>
                                                <div className="text-xs text-muted-foreground">
                                                    Win Rate ({model.wins})
                                                </div>
                                            </div>
                                            <div className="text-center">
                                                <div className="text-sm font-medium text-yellow-600">
                                                    {model.tieRate.toFixed(1)}%
                                                </div>
                                                <div className="text-xs text-muted-foreground">
                                                    Tie Rate ({model.ties})
                                                </div>
                                            </div>
                                            <div className="text-center">
                                                <div className="text-sm font-medium text-red-600">
                                                    {model.lossRate.toFixed(1)}%
                                                </div>
                                                <div className="text-xs text-muted-foreground">
                                                    Loss Rate ({model.losses})
                                                </div>
                                            </div>
                                        </div>

                                        {/* Visual progress bar */}
                                        <div className="relative h-3 sm:h-2 bg-muted rounded-full overflow-hidden">
                                            <div
                                                className="absolute left-0 top-0 h-full bg-green-500 transition-all duration-300"
                                                style={{ width: `${model.winRate}%` }}
                                            />
                                            <div
                                                className="absolute top-0 h-full bg-yellow-500 transition-all duration-300"
                                                style={{
                                                    left: `${model.winRate}%`,
                                                    width: `${model.tieRate}%`
                                                }}
                                            />
                                            <div
                                                className="absolute top-0 h-full bg-red-500 transition-all duration-300"
                                                style={{
                                                    left: `${model.winRate + model.tieRate}%`,
                                                    width: `${model.lossRate}%`
                                                }}
                                            />
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