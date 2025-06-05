import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Info } from 'lucide-react';
import { DimensionsAnalyticsData } from '@/types';

interface CorrelationMatrixProps {
    dimensionsData: DimensionsAnalyticsData;
}

export default function CorrelationMatrix({ dimensionsData }: CorrelationMatrixProps) {
    if (!dimensionsData.correlations) {
        return null;
    }

    return (
        <Card>
            <CardHeader>
                <CardTitle className="flex items-center gap-2">
                    <Info className="h-5 w-5" />
                    Dimension Correlation Matrix
                </CardTitle>
                <p className="text-sm text-muted-foreground">
                    Shows the consistency between different dimensions' choice results (0.0 - 1.0)
                </p>
            </CardHeader>
            <CardContent>
                <div className="overflow-x-auto">
                    <table className="w-full text-sm">
                        <thead>
                            <tr>
                                <th className="text-left p-2 border-b"></th>
                                {dimensionsData.dimensionAnalyses.map((dim) => (
                                    <th key={dim.dimensionId} className="text-center p-2 border-b text-xs">
                                        {dim.dimensionId.replace('_', '_\n')}
                                    </th>
                                ))}
                            </tr>
                        </thead>
                        <tbody>
                            {dimensionsData.dimensionAnalyses.map((dim1) => (
                                <tr key={dim1.dimensionId}>
                                    <td className="p-2 border-r text-xs font-medium">
                                        {dim1.dimensionId.replace('_', '_\n')}
                                    </td>
                                    {dimensionsData.dimensionAnalyses.map((dim2) => {
                                        const correlation = dimensionsData.correlations?.[dim1.dimensionId]?.[dim2.dimensionId] || 0;
                                        const bgColor = dim1.dimensionId === dim2.dimensionId
                                            ? 'bg-gray-200'
                                            : `rgba(59, 130, 246, ${correlation})`;

                                        return (
                                            <td
                                                key={dim2.dimensionId}
                                                className="p-2 text-center text-xs"
                                                style={{ backgroundColor: bgColor }}
                                            >
                                                {correlation.toFixed(2)}
                                            </td>
                                        );
                                    })}
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </CardContent>
        </Card>
    );
} 