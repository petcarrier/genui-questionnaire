import React, { useState, useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Activity, ChevronDown, ChevronUp, Info } from 'lucide-react';
import { DimensionsAnalyticsData, SafeDimensionsAnalyticsData } from '@/types';
import {
    createSafeDimensionsAnalytics,
    safeToFixed,
    safeLength,
    hasValidKappaScores,
    getSafeKappaInterpretation
} from '@/utils/safeTypeGuards';

interface DimensionComparisonCardProps {
    dimensionsData: DimensionsAnalyticsData;
}

const getKappaColor = (kappa: number) => {
    if (isNaN(kappa) || kappa === null || kappa === undefined) return 'text-gray-600 bg-gray-50 border-gray-200';
    if (kappa >= 0.8) return 'text-green-600 bg-green-50 border-green-200'; // High Agreement
    if (kappa >= 0.6) return 'text-blue-600 bg-blue-50 border-blue-200'; // Moderate Agreement
    return 'text-orange-600 bg-orange-50 border-orange-200'; // Low Agreement
};

const getKappaProgressColor = (kappa: number) => {
    if (isNaN(kappa) || kappa === null || kappa === undefined) return 'bg-gray-500';
    if (kappa >= 0.8) return 'bg-green-500'; // High Agreement
    if (kappa >= 0.6) return 'bg-blue-500'; // Moderate Agreement
    return 'bg-orange-500'; // Low Agreement
};

const getInterpretationLabel = (interpretation: string) => {
    // Map old interpretations to new simplified ones
    const labels = {
        'poor': 'Low Agreement',
        'slight': 'Low Agreement',
        'fair': 'Low Agreement',
        'moderate': 'Moderate Agreement',
        'substantial': 'Moderate Agreement',
        'almost_perfect': 'High Agreement'
    };
    return labels[interpretation as keyof typeof labels] || 'No Data';
};

const getKappaProgressWidth = (kappa: number): number => {
    if (isNaN(kappa) || kappa === null || kappa === undefined) return 0;
    return Math.max(0, Math.min(100, (kappa + 1) * 50));
};

export default function DimensionComparisonCard({ dimensionsData }: DimensionComparisonCardProps) {
    const [expandedDimension, setExpandedDimension] = useState<string | null>(null);

    // Create safe data with guaranteed arrays and valid values
    const safeData: SafeDimensionsAnalyticsData = useMemo(() =>
        createSafeDimensionsAnalytics(dimensionsData),
        [dimensionsData]
    );

    const toggleExpansion = (dimensionId: string) => {
        setExpandedDimension(expandedDimension === dimensionId ? null : dimensionId);
    };

    // Early return if no data
    if (safeLength(safeData.dimensionComparisons) === 0) {
        return (
            <Card>
                <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                        <Activity className="h-5 w-5" />
                        Inter-Rater Reliability Analysis (Fleiss' Kappa)
                    </CardTitle>
                </CardHeader>
                <CardContent>
                    <div className="text-center text-muted-foreground py-8">
                        No dimension comparison data available
                    </div>
                </CardContent>
            </Card>
        );
    }

    return (
        <Card>
            <CardHeader>
                <CardTitle className="flex items-center gap-2">
                    <Activity className="h-5 w-5" />
                    Inter-Rater Reliability Analysis (Fleiss' Kappa)
                </CardTitle>
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    <Info className="h-4 w-4" />
                    <span>Measures agreement between multiple raters for each evaluation dimension</span>
                </div>
            </CardHeader>
            <CardContent>
                <div className="space-y-4 max-h-96 overflow-y-auto">
                    {safeData.dimensionComparisons
                        .sort((a, b) => (b.fleissKappa || 0) - (a.fleissKappa || 0))
                        .map((comparison) => (
                            <div key={comparison.dimensionId} className="border rounded-lg">
                                <div className="p-4">
                                    <div className="flex justify-between items-start mb-3">
                                        <div className="flex-1">
                                            <h4 className="font-medium text-sm mb-1">{comparison.dimensionLabel}</h4>
                                            <Badge variant="outline" className="text-xs">
                                                {comparison.dimensionId}
                                            </Badge>
                                        </div>
                                        <div className="flex items-center gap-2">
                                            <Badge
                                                className={`text-xs ${getKappaColor(comparison.fleissKappa)}`}
                                                variant="outline"
                                            >
                                                {getInterpretationLabel(getSafeKappaInterpretation(comparison.kappaInterpretation))}
                                            </Badge>
                                        </div>
                                    </div>

                                    <div className="grid grid-cols-1 gap-4 mb-3">
                                        <div className="text-center">
                                            <div className="text-lg font-bold" style={{ color: getKappaProgressColor(comparison.fleissKappa).replace('bg-', '') }}>
                                                {safeToFixed(comparison.fleissKappa)}
                                            </div>
                                            <div className="text-xs text-muted-foreground mb-1">Fleiss' Kappa</div>
                                            <div className="w-full bg-gray-200 rounded-full h-2">
                                                <div
                                                    className={`h-2 rounded-full ${getKappaProgressColor(comparison.fleissKappa)}`}
                                                    style={{ width: `${getKappaProgressWidth(comparison.fleissKappa)}%` }}
                                                ></div>
                                            </div>
                                        </div>
                                    </div>

                                    <div className="flex justify-between items-center">
                                        <div className="text-xs text-muted-foreground">
                                            Questions: {safeLength(comparison.questionKappaScores)} |
                                            Avg Kappa: {safeToFixed(comparison.avgKappaPerQuestion)}
                                        </div>
                                        <Button
                                            variant="ghost"
                                            size="sm"
                                            onClick={() => toggleExpansion(comparison.dimensionId)}
                                            className="h-6 px-2"
                                        >
                                            {expandedDimension === comparison.dimensionId ? (
                                                <>
                                                    <ChevronUp className="h-3 w-3 mr-1" />
                                                    Hide Details
                                                </>
                                            ) : (
                                                <>
                                                    <ChevronDown className="h-3 w-3 mr-1" />
                                                    Show Details
                                                </>
                                            )}
                                        </Button>
                                    </div>
                                </div>

                                {expandedDimension === comparison.dimensionId && hasValidKappaScores(comparison) && (
                                    <div className="border-t bg-gray-50 p-4">
                                        <h5 className="font-medium text-sm mb-3">Per-Question Kappa Scores</h5>
                                        <div className="space-y-2 max-h-48 overflow-y-auto">
                                            {comparison.questionKappaScores
                                                .sort((a, b) => (b.kappa || 0) - (a.kappa || 0))
                                                .map((questionScore) => (
                                                    <div key={questionScore.questionId} className="flex items-center justify-between p-2 bg-white rounded border">
                                                        <div className="flex-1">
                                                            <div className="text-xs font-mono text-muted-foreground truncate">
                                                                {questionScore.questionId || 'Unknown Question'}
                                                            </div>
                                                            <div className="text-xs text-muted-foreground mt-1">
                                                                Raters: {questionScore.raters || 0} |
                                                                A: {questionScore.categories?.A || 0},
                                                                B: {questionScore.categories?.B || 0},
                                                                Tie: {questionScore.categories?.tie || 0}
                                                            </div>
                                                        </div>
                                                        <div className="flex items-center gap-2">
                                                            <div className="text-sm font-medium">
                                                                {safeToFixed(questionScore.kappa)}
                                                            </div>
                                                            <div className="w-16 bg-gray-200 rounded-full h-1.5">
                                                                <div
                                                                    className={`h-1.5 rounded-full ${getKappaProgressColor(questionScore.kappa)}`}
                                                                    style={{ width: `${getKappaProgressWidth(questionScore.kappa)}%` }}
                                                                ></div>
                                                            </div>
                                                        </div>
                                                    </div>
                                                ))}
                                        </div>
                                    </div>
                                )}

                                {expandedDimension === comparison.dimensionId && !hasValidKappaScores(comparison) && (
                                    <div className="border-t bg-gray-50 p-4">
                                        <div className="text-center text-muted-foreground py-4">
                                            No per-question kappa scores available for this dimension
                                        </div>
                                    </div>
                                )}
                            </div>
                        ))}
                </div>

                <div className="mt-4 p-3 bg-blue-50 border border-blue-200 rounded-lg">
                    <div className="text-xs text-blue-800">
                        <strong>Fleiss' Kappa Interpretation:</strong>
                        <div className="mt-1 space-y-1">
                            <div>• High Agreement: Kappa ≥ 0.8</div>
                            <div>• Moderate Agreement: 0.6 ≤ Kappa &lt; 0.8</div>
                            <div>• Low Agreement: Kappa &lt; 0.6</div>
                        </div>
                    </div>
                </div>
            </CardContent>
        </Card>
    );
} 