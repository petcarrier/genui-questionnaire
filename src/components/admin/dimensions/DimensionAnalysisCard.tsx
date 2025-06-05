import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { PieChart } from 'lucide-react';
import { DimensionsAnalyticsData } from '@/types';

interface DimensionAnalysisCardProps {
    dimensionsData: DimensionsAnalyticsData;
}

export default function DimensionAnalysisCard({ dimensionsData }: DimensionAnalysisCardProps) {
    return (
        <Card>
            <CardHeader>
                <CardTitle className="flex items-center gap-2">
                    <PieChart className="h-5 w-5" />
                    Dimension Choice Distribution
                </CardTitle>
            </CardHeader>
            <CardContent>
                <div className="space-y-4 max-h-96 overflow-y-auto">
                    {dimensionsData.dimensionAnalyses.map((dimension) => (
                        <div key={dimension.dimensionId} className="border rounded-lg p-4">
                            <div className="flex justify-between items-start mb-3">
                                <div>
                                    <h4 className="font-medium text-sm">{dimension.dimensionLabel}</h4>
                                    <p className="text-xs text-muted-foreground">
                                        Total evaluations: {dimension.totalEvaluations}
                                    </p>
                                </div>
                                <Badge variant="outline">{dimension.dimensionId}</Badge>
                            </div>

                            <div className="grid grid-cols-4 gap-2 mb-3">
                                <div className="text-center">
                                    <div className="text-lg font-bold text-blue-600">{dimension.winnerPercentages.A}%</div>
                                    <div className="text-xs text-muted-foreground">Choose A</div>
                                </div>
                                <div className="text-center">
                                    <div className="text-lg font-bold text-green-600">{dimension.winnerPercentages.B}%</div>
                                    <div className="text-xs text-muted-foreground">Choose B</div>
                                </div>
                                <div className="text-center">
                                    <div className="text-lg font-bold text-yellow-600">{dimension.winnerPercentages.tie}%</div>
                                    <div className="text-xs text-muted-foreground">Tie</div>
                                </div>
                                <div className="text-center">
                                    <div className="text-lg font-bold text-red-600">{dimension.winnerPercentages.empty}%</div>
                                    <div className="text-xs text-muted-foreground">Not selected</div>
                                </div>
                            </div>

                            <div className="flex justify-between text-xs text-muted-foreground">
                                <span>Notes: {dimension.notes.totalWithNotes}</span>
                                <span>Avg length: {dimension.notes.averageNoteLength}</span>
                            </div>

                            {dimension.notes.commonKeywords && dimension.notes.commonKeywords.length > 0 && (
                                <div className="mt-2">
                                    <div className="text-xs text-muted-foreground mb-1">Common keywords:</div>
                                    <div className="flex gap-1 flex-wrap">
                                        {dimension.notes.commonKeywords.map((keyword) => (
                                            <Badge key={keyword} variant="secondary" className="text-xs">
                                                {keyword}
                                            </Badge>
                                        ))}
                                    </div>
                                </div>
                            )}
                        </div>
                    ))}
                </div>
            </CardContent>
        </Card>
    );
} 