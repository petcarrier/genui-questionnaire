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
                    <CardTitle className="text-sm font-medium">Total Dimensions</CardTitle>
                    <Layers className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                    <div className="text-2xl font-bold">{dimensionsData.overview.totalDimensions}</div>
                    <p className="text-xs text-muted-foreground">
                        Total evaluations {dimensionsData.overview.totalEvaluations}
                    </p>
                </CardContent>
            </Card>

            <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">Average Evaluations</CardTitle>
                    <BarChart3 className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                    <div className="text-2xl font-bold">{dimensionsData.overview.averageEvaluationsPerDimension}</div>
                    <p className="text-xs text-muted-foreground">
                        Average evaluations per dimension
                    </p>
                </CardContent>
            </Card>

            <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">Most Contentious Dimension</CardTitle>
                    <TrendingDown className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                    <div className="text-lg font-bold text-orange-600">
                        {dimensionsData.dimensionAnalyses.find(d => d.dimensionId === dimensionsData.overview.mostContentiousDimension)?.dimensionLabel || 'N/A'}
                    </div>
                    <p className="text-xs text-muted-foreground">
                        Dimension with most tie choices
                    </p>
                </CardContent>
            </Card>

            <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">Most Decisive Dimension</CardTitle>
                    <Target className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                    <div className="text-lg font-bold text-green-600">
                        {dimensionsData.dimensionAnalyses.find(d => d.dimensionId === dimensionsData.overview.mostDecisiveDimension)?.dimensionLabel || 'N/A'}
                    </div>
                    <p className="text-xs text-muted-foreground">
                        Dimension with clearest preferences
                    </p>
                </CardContent>
            </Card>
        </div>
    );
} 