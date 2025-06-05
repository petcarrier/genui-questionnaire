import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Activity } from 'lucide-react';
import { DimensionsAnalyticsData } from '@/types';

interface DimensionComparisonCardProps {
    dimensionsData: DimensionsAnalyticsData;
}

export default function DimensionComparisonCard({ dimensionsData }: DimensionComparisonCardProps) {
    return (
        <Card>
            <CardHeader>
                <CardTitle className="flex items-center gap-2">
                    <Activity className="h-5 w-5" />
                    Dimension Comparison Metrics
                </CardTitle>
            </CardHeader>
            <CardContent>
                <div className="space-y-4 max-h-96 overflow-y-auto">
                    {dimensionsData.dimensionComparisons
                        .sort((a, b) => b.preferenceStrength - a.preferenceStrength)
                        .map((comparison) => (
                            <div key={comparison.dimensionId} className="border rounded-lg p-4">
                                <div className="flex justify-between items-start mb-3">
                                    <h4 className="font-medium text-sm">{comparison.dimensionLabel}</h4>
                                    <Badge variant="outline">{comparison.dimensionId}</Badge>
                                </div>

                                <div className="grid grid-cols-3 gap-3">
                                    <div className="text-center">
                                        <div className="text-lg font-bold text-purple-600">
                                            {comparison.preferenceStrength}%
                                        </div>
                                        <div className="text-xs text-muted-foreground">Preference Strength</div>
                                        <div className="w-full bg-gray-200 rounded-full h-2 mt-1">
                                            <div
                                                className="bg-purple-600 h-2 rounded-full"
                                                style={{ width: `${comparison.preferenceStrength}%` }}
                                            ></div>
                                        </div>
                                    </div>
                                    <div className="text-center">
                                        <div className="text-lg font-bold text-blue-600">
                                            {comparison.consistencyScore}%
                                        </div>
                                        <div className="text-xs text-muted-foreground">Consistency</div>
                                        <div className="w-full bg-gray-200 rounded-full h-2 mt-1">
                                            <div
                                                className="bg-blue-600 h-2 rounded-full"
                                                style={{ width: `${comparison.consistencyScore}%` }}
                                            ></div>
                                        </div>
                                    </div>
                                    <div className="text-center">
                                        <div className="text-lg font-bold text-orange-600">
                                            {comparison.controversyScore}%
                                        </div>
                                        <div className="text-xs text-muted-foreground">Controversy Score</div>
                                        <div className="w-full bg-gray-200 rounded-full h-2 mt-1">
                                            <div
                                                className="bg-orange-600 h-2 rounded-full"
                                                style={{ width: `${comparison.controversyScore}%` }}
                                            ></div>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        ))}
                </div>
            </CardContent>
        </Card>
    );
} 