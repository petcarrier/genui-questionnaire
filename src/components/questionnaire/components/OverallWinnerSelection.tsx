import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Label } from '@/components/ui/label';
import { ComparisonLink } from '@/types/questionnaire';

interface OverallWinnerSelectionProps {
    linkA: ComparisonLink;
    linkB: ComparisonLink;
    overallWinner: 'A' | 'B' | 'tie' | '';
    onWinnerChange: (winner: 'A' | 'B' | 'tie') => void;
}

export function OverallWinnerSelection({
    linkA,
    linkB,
    overallWinner,
    onWinnerChange
}: OverallWinnerSelectionProps) {
    return (
        <Card>
            <CardHeader>
                <CardTitle>Overall Winner</CardTitle>
                <p className="text-muted-foreground">
                    Based on your evaluation across all dimensions, which website is the overall winner?
                </p>
            </CardHeader>
            <CardContent>
                <RadioGroup
                    value={overallWinner}
                    onValueChange={(value: string) => onWinnerChange(value as 'A' | 'B' | 'tie')}
                >
                    <div className="flex items-center space-x-2">
                        <RadioGroupItem value="A" id="overall-A" />
                        <Label htmlFor="overall-A" className="font-medium text-blue-600 dark:text-blue-400">
                            Option A: {linkA.title}
                        </Label>
                    </div>
                    <div className="flex items-center space-x-2">
                        <RadioGroupItem value="B" id="overall-B" />
                        <Label htmlFor="overall-B" className="font-medium text-green-600 dark:text-green-400">
                            Option B: {linkB.title}
                        </Label>
                    </div>
                    <div className="flex items-center space-x-2">
                        <RadioGroupItem value="tie" id="overall-tie" />
                        <Label htmlFor="overall-tie" className="font-medium text-gray-600 dark:text-gray-400">
                            Tie / No clear winner
                        </Label>
                    </div>
                </RadioGroup>
            </CardContent>
        </Card>
    );
} 