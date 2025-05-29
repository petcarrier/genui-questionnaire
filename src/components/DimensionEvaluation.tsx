import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { EvaluationDimension, DimensionEvaluation, ComparisonLink } from '@/types/questionnaire';
import { LinkActions } from './LinkActions';

interface DimensionEvaluationProps {
    dimension: EvaluationDimension;
    linkA: ComparisonLink;
    linkB: ComparisonLink;
    evaluation?: DimensionEvaluation;
    onChange: (evaluation: DimensionEvaluation) => void;
}

export function DimensionEvaluationComponent({
    dimension,
    linkA,
    linkB,
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
                <p className="text-sm text-muted-foreground whitespace-pre-wrap leading-relaxed">{dimension.description}</p>
            </CardHeader>
            <CardContent className="space-y-4">
                <div>
                    <Label className="text-base font-medium">Which performs better?</Label>
                    <RadioGroup
                        value={evaluation?.winner || ''}
                        onValueChange={handleWinnerChange}
                        className="mt-2"
                    >
                        <div className="flex items-center justify-between">
                            <div className="flex items-center space-x-2">
                                <RadioGroupItem value="A" id={`${dimension.id}-A`} />
                                <Label htmlFor={`${dimension.id}-A`} className="font-medium text-blue-600 dark:text-blue-400">
                                    Option A: {linkA.title}
                                </Label>
                            </div>
                            <LinkActions
                                link={linkA}
                                label="Option A"
                                color="blue"
                                size="sm"
                                variant="ghost"
                            />
                        </div>
                        <div className="flex items-center justify-between">
                            <div className="flex items-center space-x-2">
                                <RadioGroupItem value="B" id={`${dimension.id}-B`} />
                                <Label htmlFor={`${dimension.id}-B`} className="font-medium text-green-600 dark:text-green-400">
                                    Option B: {linkB.title}
                                </Label>
                            </div>
                            <LinkActions
                                link={linkB}
                                label="Option B"
                                color="green"
                                size="sm"
                                variant="ghost"
                            />
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
                        Evaluation Reason
                    </Label>
                    <p className="text-xs text-muted-foreground mb-2">
                        Write a one-sentence summary comparing the two examples, clearly stating why one is superior.
                    </p>
                    <Textarea
                        id={`${dimension.id}-notes`}
                        placeholder="Explain your reasoning for this evaluation..."
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