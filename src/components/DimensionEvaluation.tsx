import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { EvaluationDimension, DimensionEvaluation } from '@/types/questionnaire';

interface DimensionEvaluationProps {
    dimension: EvaluationDimension;
    linkATitle: string;
    linkBTitle: string;
    evaluation?: DimensionEvaluation;
    onChange: (evaluation: DimensionEvaluation) => void;
}

export function DimensionEvaluationComponent({
    dimension,
    linkATitle,
    linkBTitle,
    evaluation,
    onChange
}: DimensionEvaluationProps) {
    const handleWinnerChange = (winner: 'A' | 'B' | 'tie') => {
        onChange({
            dimensionId: dimension.id,
            winner,
            notes: evaluation?.notes || ''
        });
    };

    const handleNotesChange = (notes: string) => {
        onChange({
            dimensionId: dimension.id,
            winner: evaluation?.winner || 'tie',
            notes
        });
    };

    return (
        <Card className="w-full">
            <CardHeader>
                <CardTitle className="text-lg">{dimension.label}</CardTitle>
                <p className="text-sm text-muted-foreground">{dimension.description}</p>
            </CardHeader>
            <CardContent className="space-y-4">
                <div>
                    <Label className="text-base font-medium">Which performs better?</Label>
                    <RadioGroup
                        value={evaluation?.winner || ''}
                        onValueChange={handleWinnerChange}
                        className="mt-2"
                    >
                        <div className="flex items-center space-x-2">
                            <RadioGroupItem value="A" id={`${dimension.id}-A`} />
                            <Label htmlFor={`${dimension.id}-A`} className="font-medium text-blue-600 dark:text-blue-400">
                                Option A: {linkATitle}
                            </Label>
                        </div>
                        <div className="flex items-center space-x-2">
                            <RadioGroupItem value="B" id={`${dimension.id}-B`} />
                            <Label htmlFor={`${dimension.id}-B`} className="font-medium text-green-600 dark:text-green-400">
                                Option B: {linkBTitle}
                            </Label>
                        </div>
                        <div className="flex items-center space-x-2">
                            <RadioGroupItem value="tie" id={`${dimension.id}-tie`} />
                            <Label htmlFor={`${dimension.id}-tie`} className="font-medium text-gray-600 dark:text-gray-400">
                                Tie / No significant difference
                            </Label>
                        </div>
                    </RadioGroup>
                </div>

                <div>
                    <Label htmlFor={`${dimension.id}-notes`} className="text-sm">
                        Additional notes (optional)
                    </Label>
                    <Textarea
                        id={`${dimension.id}-notes`}
                        placeholder="Any specific observations or comments..."
                        value={evaluation?.notes || ''}
                        onChange={(e) => handleNotesChange(e.target.value)}
                        className="mt-1"
                        rows={2}
                    />
                </div>
            </CardContent>
        </Card>
    );
} 