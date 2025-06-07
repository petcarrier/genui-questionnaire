import React, { useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { ChartContainer, ChartTooltip, ChartTooltipContent, ChartLegend, ChartLegendContent } from '@/components/ui/chart';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, ResponsiveContainer } from 'recharts';
import { BarChart3 } from 'lucide-react';
import { DimensionsAnalyticsData, SafeDimensionsAnalyticsData } from '@/types';
import {
    createSafeDimensionsAnalytics,
    safeLength
} from '@/utils/safeTypeGuards';

interface AgreementDistributionChartProps {
    dimensionsData: DimensionsAnalyticsData;
}

// Agreement levels for histogram bins
const AGREEMENT_BINS = [
    { range: '[-1.0, -0.5)', label: 'Poor Agreement (-1.0 to -0.5)', min: -1.0, max: -0.5, color: '#ef4444' },
    { range: '[-0.5, 0.0)', label: 'Slight Disagreement (-0.5 to 0.0)', min: -0.5, max: 0.0, color: '#f97316' },
    { range: '[0.0, 0.2)', label: 'No Agreement (0.0 to 0.2)', min: 0.0, max: 0.2, color: '#eab308' },
    { range: '[0.2, 0.4)', label: 'Fair Agreement (0.2 to 0.4)', min: 0.2, max: 0.4, color: '#a3a3a3' },
    { range: '[0.4, 0.6)', label: 'Moderate Agreement (0.4 to 0.6)', min: 0.4, max: 0.6, color: '#3b82f6' },
    { range: '[0.6, 0.8)', label: 'Substantial Agreement (0.6 to 0.8)', min: 0.6, max: 0.8, color: '#8b5cf6' },
    { range: '[0.8, 1.0]', label: 'Almost Perfect Agreement (0.8 to 1.0)', min: 0.8, max: 1.0, color: '#22c55e' }
];

const chartConfig = {
    frequency: {
        label: "Frequency",
    },
    ...AGREEMENT_BINS.reduce((config, bin, index) => {
        config[`bin${index}`] = {
            label: bin.label,
            color: bin.color,
        };
        return config;
    }, {} as any),
};

export default function AgreementDistributionChart({ dimensionsData }: AgreementDistributionChartProps) {
    // Create safe data with guaranteed arrays and valid values
    const safeData: SafeDimensionsAnalyticsData = useMemo(() =>
        createSafeDimensionsAnalytics(dimensionsData),
        [dimensionsData]
    );

    // Process data for histogram
    const histogramData = useMemo(() => {
        const allKappaScores: Array<{
            kappa: number;
            dimensionLabel: string;
            questionId: string;
        }> = [];

        // Collect all Kappa scores from all dimensions
        safeData.dimensionComparisons.forEach(comparison => {
            if (comparison.questionKappaScores && comparison.questionKappaScores.length > 0) {
                comparison.questionKappaScores.forEach(questionScore => {
                    if (!isNaN(questionScore.kappa) && questionScore.kappa !== null && questionScore.kappa !== undefined) {
                        allKappaScores.push({
                            kappa: questionScore.kappa,
                            dimensionLabel: comparison.dimensionLabel,
                            questionId: questionScore.questionId
                        });
                    }
                });
            }
        });

        // Create histogram bins
        const histogram = AGREEMENT_BINS.map(bin => {
            const scoresInBin = allKappaScores.filter(score => {
                if (bin.max === 1.0) {
                    return score.kappa >= bin.min && score.kappa <= bin.max;
                }
                return score.kappa >= bin.min && score.kappa < bin.max;
            });

            // Group by dimension for stacked bars
            const byDimension: { [key: string]: number } = {};
            scoresInBin.forEach(score => {
                byDimension[score.dimensionLabel] = (byDimension[score.dimensionLabel] || 0) + 1;
            });

            return {
                range: bin.range,
                label: bin.label,
                frequency: scoresInBin.length,
                color: bin.color,
                byDimension,
                details: scoresInBin
            };
        }).filter(bin => bin.frequency > 0); // Only show bins with data

        return histogram;
    }, [safeData]);

    // Get all unique dimension labels for legend
    const dimensionLabels = useMemo(() => {
        const labels = new Set<string>();
        safeData.dimensionComparisons.forEach(comparison => {
            labels.add(comparison.dimensionLabel);
        });
        return Array.from(labels);
    }, [safeData]);

    // Generate colors for dimensions
    const dimensionColors = useMemo(() => {
        const colors = ['#3b82f6', '#ef4444', '#22c55e', '#f59e0b', '#8b5cf6', '#06b6d4', '#ec4899'];
        const colorMap: { [key: string]: string } = {};
        dimensionLabels.forEach((label, index) => {
            colorMap[label] = colors[index % colors.length];
        });
        return colorMap;
    }, [dimensionLabels]);

    // Prepare data for stacked bar chart
    const chartData = useMemo(() => {
        return histogramData.map(bin => {
            const dataPoint: any = {
                range: bin.range,
                label: bin.label,
                total: bin.frequency,
            };

            // Add each dimension as a separate field
            dimensionLabels.forEach(dimensionLabel => {
                dataPoint[dimensionLabel] = bin.byDimension[dimensionLabel] || 0;
            });

            return dataPoint;
        });
    }, [histogramData, dimensionLabels]);

    // Calculate total questions analyzed
    const totalQuestions = useMemo(() => {
        return safeData.dimensionComparisons.reduce((total, comparison) => {
            return total + safeLength(comparison.questionKappaScores);
        }, 0);
    }, [safeData]);

    // Early return if no data
    if (histogramData.length === 0) {
        return (
            <Card>
                <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                        <BarChart3 className="h-5 w-5" />
                        Agreement Distribution Histogram
                    </CardTitle>
                </CardHeader>
                <CardContent>
                    <div className="text-center text-muted-foreground py-8">
                        No agreement data available for histogram
                    </div>
                </CardContent>
            </Card>
        );
    }

    return (
        <Card>
            <CardHeader>
                <CardTitle className="flex items-center gap-2">
                    <BarChart3 className="h-5 w-5" />
                    Agreement Distribution Histogram (Fleiss' Kappa)
                </CardTitle>
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    <Badge variant="outline">
                        Total Questions: {totalQuestions}
                    </Badge>
                    <Badge variant="outline">
                        Questionnaire Groups: {dimensionLabels.length}
                    </Badge>
                </div>
            </CardHeader>
            <CardContent>
                <ChartContainer config={chartConfig} className="h-96">
                    <BarChart data={chartData} margin={{ top: 20, right: 30, left: 20, bottom: 60 }}>
                        <CartesianGrid strokeDasharray="3 3" />
                        <XAxis
                            dataKey="range"
                            angle={-45}
                            textAnchor="end"
                            height={80}
                            interval={0}
                        />
                        <YAxis
                            label={{ value: 'Frequency (Number of Questions)', angle: -90, position: 'insideLeft' }}
                        />
                        <ChartTooltip content={<ChartTooltipContent />} />
                        <ChartLegend content={<ChartLegendContent />} />

                        {/* Stacked bars for each dimension */}
                        {dimensionLabels.map((dimensionLabel, index) => (
                            <Bar
                                key={dimensionLabel}
                                dataKey={dimensionLabel}
                                stackId="agreement"
                                fill={dimensionColors[dimensionLabel]}
                                name={dimensionLabel}
                            />
                        ))}
                    </BarChart>
                </ChartContainer>

                {/* Summary Statistics */}
                <div className="mt-6 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {histogramData.map((bin, index) => (
                        <div key={bin.range} className="p-3 border rounded-lg">
                            <div className="text-sm font-medium mb-1">{bin.range}</div>
                            <div className="text-xs text-muted-foreground mb-2">{bin.label}</div>
                            <div className="text-lg font-bold" style={{ color: bin.color }}>
                                {bin.frequency}
                            </div>
                            <div className="text-xs text-muted-foreground">
                                {((bin.frequency / totalQuestions) * 100).toFixed(1)}% of all questions
                            </div>
                        </div>
                    ))}
                </div>

                {/* Interpretation Guide */}
                <div className="mt-6 p-4 bg-blue-50 border border-blue-200 rounded-lg">
                    <div className="text-sm text-blue-800">
                        <strong>Fleiss' Kappa Agreement Interpretation:</strong>
                        <div className="mt-2 grid grid-cols-1 md:grid-cols-2 gap-2 text-xs">
                            <div>• <strong>Almost Perfect (0.8-1.0):</strong> Excellent agreement among raters</div>
                            <div>• <strong>Substantial (0.6-0.8):</strong> Good agreement among raters</div>
                            <div>• <strong>Moderate (0.4-0.6):</strong> Moderate agreement among raters</div>
                            <div>• <strong>Fair (0.2-0.4):</strong> Fair agreement among raters</div>
                            <div>• <strong>Slight (0.0-0.2):</strong> Poor agreement among raters</div>
                            <div>• <strong>Below 0.0:</strong> No agreement or systematic disagreement</div>
                        </div>
                    </div>
                </div>
            </CardContent>
        </Card>
    );
} 