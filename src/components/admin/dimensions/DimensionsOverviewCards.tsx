import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Layers, BarChart3, TrendingDown, Target } from 'lucide-react';
import { DimensionsAnalyticsData } from '@/types';
import { useIsMobile, truncateText, formatNumberForMobile } from '../common/utils';

interface DimensionsOverviewCardsProps {
    dimensionsData: DimensionsAnalyticsData;
}

export default function DimensionsOverviewCards({ dimensionsData }: DimensionsOverviewCardsProps) {
    const isMobile = useIsMobile();

    const metrics = [
        {
            title: "Total Dimensions",
            icon: Layers,
            value: dimensionsData.overview.totalDimensions,
            description: `Total evaluations ${formatNumberForMobile(dimensionsData.overview.totalEvaluations, isMobile)}`,
            color: "text-blue-600"
        },
        {
            title: "Average Evaluations",
            icon: BarChart3,
            value: formatNumberForMobile(dimensionsData.overview.averageEvaluationsPerDimension, isMobile),
            description: "Average evaluations per dimension",
            color: "text-purple-600"
        },
        {
            title: isMobile ? "Most Contentious" : "Most Contentious Dimension",
            icon: TrendingDown,
            value: dimensionsData.dimensionAnalyses.find(d => d.dimensionId === dimensionsData.overview.mostContentiousDimension)?.dimensionLabel || 'N/A',
            description: "Dimension with most tie choices",
            color: "text-orange-600",
            isText: true
        },
        {
            title: isMobile ? "Most Decisive" : "Most Decisive Dimension",
            icon: Target,
            value: dimensionsData.dimensionAnalyses.find(d => d.dimensionId === dimensionsData.overview.mostDecisiveDimension)?.dimensionLabel || 'N/A',
            description: "Dimension with clearest preferences",
            color: "text-green-600",
            isText: true
        }
    ];

    return (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {metrics.map((metric, index) => {
                const IconComponent = metric.icon;
                return (
                    <Card key={index} className="transition-all duration-200 hover:shadow-md">
                        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                            <CardTitle className="text-sm font-medium text-muted-foreground">
                                {metric.title}
                            </CardTitle>
                            <IconComponent className="h-4 w-4 text-muted-foreground" />
                        </CardHeader>
                        <CardContent className="pt-0">
                            <div className={`${metric.isText ? 'text-lg sm:text-xl' : 'text-2xl sm:text-3xl'} font-bold ${metric.color} mb-2`}>
                                {metric.isText ?
                                    truncateText(metric.value.toString(), isMobile ? 15 : 25, isMobile) :
                                    metric.value
                                }
                            </div>
                            <p className="text-xs sm:text-sm text-muted-foreground leading-relaxed">
                                {metric.description}
                            </p>
                        </CardContent>
                    </Card>
                );
            })}
        </div>
    );
}