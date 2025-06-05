import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Layers, BarChart3, TrendingDown, Target } from 'lucide-react';
import { DimensionsAnalyticsData } from '@/types';

interface DimensionsOverviewCardsProps {
    dimensionsData: DimensionsAnalyticsData;
}

export default function DimensionsOverviewCards({ dimensionsData }: DimensionsOverviewCardsProps) {
    return (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
            <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">总维度数</CardTitle>
                    <Layers className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                    <div className="text-2xl font-bold">{dimensionsData.overview.totalDimensions}</div>
                    <p className="text-xs text-muted-foreground">
                        总评估次数 {dimensionsData.overview.totalEvaluations}
                    </p>
                </CardContent>
            </Card>

            <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">平均评估数</CardTitle>
                    <BarChart3 className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                    <div className="text-2xl font-bold">{dimensionsData.overview.averageEvaluationsPerDimension}</div>
                    <p className="text-xs text-muted-foreground">
                        每个维度平均评估次数
                    </p>
                </CardContent>
            </Card>

            <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">最具争议维度</CardTitle>
                    <TrendingDown className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                    <div className="text-lg font-bold text-orange-600">
                        {dimensionsData.dimensionAnalyses.find(d => d.dimensionId === dimensionsData.overview.mostContentiousDimension)?.dimensionLabel || 'N/A'}
                    </div>
                    <p className="text-xs text-muted-foreground">
                        平局选择最多的维度
                    </p>
                </CardContent>
            </Card>

            <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">最具决定性维度</CardTitle>
                    <Target className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                    <div className="text-lg font-bold text-green-600">
                        {dimensionsData.dimensionAnalyses.find(d => d.dimensionId === dimensionsData.overview.mostDecisiveDimension)?.dimensionLabel || 'N/A'}
                    </div>
                    <p className="text-xs text-muted-foreground">
                        选择偏好最明确的维度
                    </p>
                </CardContent>
            </Card>
        </div>
    );
} 