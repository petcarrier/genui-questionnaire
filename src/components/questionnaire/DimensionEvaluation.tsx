import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { EvaluationDimension, DimensionEvaluation, ComparisonLink } from '@/types/questionnaire';
import { validateEvaluationNote, getEvaluationValidationErrors, MIN_WORDS_REQUIRED } from '@/utils/evaluationValidation';

interface DimensionEvaluationProps {
    dimension: EvaluationDimension;
    linkA: ComparisonLink;
    linkB: ComparisonLink;
    evaluation?: DimensionEvaluation;
    onChange: (evaluation: DimensionEvaluation) => void;
    onPageVisit?: (linkId: string, visited: boolean, duration?: number) => void;
    userQuery: string;
    allEvaluations: DimensionEvaluation[];
    allDimensions: EvaluationDimension[];
}

export function DimensionEvaluationComponent({
    dimension,
    linkA,
    linkB,
    evaluation,
    onChange,
    onPageVisit,
    userQuery,
    allEvaluations,
    allDimensions
}: DimensionEvaluationProps) {
    const handlePageVisitA = (visited: boolean, duration?: number) => {
        if (onPageVisit) {
            onPageVisit(linkA.id, visited, duration);
        }
    };

    const handlePageVisitB = (visited: boolean, duration?: number) => {
        if (onPageVisit) {
            onPageVisit(linkB.id, visited, duration);
        }
    };

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
            winner: (evaluation?.winner || '') as 'A' | 'B' | 'tie' | '',
            notes
        });
    };

    const noteValidation = validateEvaluationNote(evaluation?.notes || '', dimension.description);

    const validationErrors = getEvaluationValidationErrors(allEvaluations, allDimensions);
    const currentDimensionErrors = validationErrors.filter(error => error.dimensionId === dimension.id);

    const hasWinnerError = currentDimensionErrors.some(error => error.error.includes('select a winner'));
    const hasSimilarityError = currentDimensionErrors.some(error => error.error.includes('too similar'));
    const hasNoteError = currentDimensionErrors.some(error =>
        error.error.includes('words') ||
        error.error.includes('meaningful') ||
        error.error.includes('detailed') ||
        error.error.includes('copying from the dimension description')
    );

    return (
        <Card className="w-full">
            <CardHeader>
                <CardTitle className="text-lg">{dimension.label}</CardTitle>
                <div className="mt-2 p-3 bg-gray-50 dark:bg-gray-800/50 rounded-lg border border-gray-200 dark:border-gray-700">
                    <p className="text-sm text-gray-800 dark:text-gray-200 whitespace-pre-wrap leading-relaxed font-medium">{dimension.description}</p>
                </div>
                <div className="mt-3 p-3 bg-blue-50 dark:bg-blue-900/20 rounded-lg border border-blue-200 dark:border-blue-800">
                    <div className="text-sm font-medium text-blue-800 dark:text-blue-200 mb-1">User Query:</div>
                    <p className="text-sm text-blue-700 dark:text-blue-300 italic">"{userQuery}"</p>
                </div>
            </CardHeader>
            <CardContent className="space-y-4">
                <div>
                    <Label className="text-base font-medium">Which performs better?</Label>
                    {hasWinnerError && (
                        <div className="mt-1 text-xs text-red-600 bg-red-50 dark:bg-red-950 px-2 py-1 rounded">
                            ⚠️ Please select a winner for this dimension
                        </div>
                    )}
                    <RadioGroup
                        value={evaluation?.winner || ''}
                        onValueChange={handleWinnerChange}
                        className="mt-2"
                    >
                        <div className="flex items-center space-x-2">
                            <RadioGroupItem value="A" id={`${dimension.id}-A`} />
                            <Label htmlFor={`${dimension.id}-A`} className="font-medium text-blue-600 dark:text-blue-400">
                                Option A: {linkA.title}
                            </Label>
                        </div>
                        <div className="flex items-center space-x-2">
                            <RadioGroupItem value="B" id={`${dimension.id}-B`} />
                            <Label htmlFor={`${dimension.id}-B`} className="font-medium text-green-600 dark:text-green-400">
                                Option B: {linkB.title}
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
                        Evaluation Reason
                    </Label>
                    <p className="text-xs text-muted-foreground mb-2">
                        Write a clear explanation comparing the two options, stating why one is superior. (Minimum {MIN_WORDS_REQUIRED} words required)
                    </p>
                    <Textarea
                        id={`${dimension.id}-notes`}
                        placeholder="Explain your reasoning for this evaluation..."
                        value={evaluation?.notes || ''}
                        onChange={(e) => handleNotesChange(e.target.value)}
                        className={`mt-1 ${(hasNoteError || hasSimilarityError || (!noteValidation.isValid && evaluation?.notes))
                            ? 'border-red-500 focus:border-red-500 focus:ring-red-500'
                            : ''
                            }`}
                        rows={3}
                    />

                    {/* Word count and validation feedback */}
                    <div className="flex items-center justify-between mt-2 text-xs">
                        <div className="flex items-center gap-2">
                            <span className={`${noteValidation.wordCount >= MIN_WORDS_REQUIRED ? 'text-green-600' : 'text-orange-600'}`}>
                                {noteValidation.wordCount} / {MIN_WORDS_REQUIRED} words
                            </span>
                            {noteValidation.isValid && evaluation?.notes && !hasSimilarityError && (
                                <span className="text-green-600 flex items-center gap-1">
                                    ✓ Valid
                                </span>
                            )}
                        </div>
                    </div>

                    {/* Display all validation errors for this dimension */}
                    {currentDimensionErrors.length > 0 && evaluation?.notes && (
                        <div className="mt-2 space-y-1">
                            {currentDimensionErrors
                                .filter(error => !error.error.includes('select a winner'))
                                .map((error, index) => (
                                    <div key={index} className="text-xs text-red-600 bg-red-50 dark:bg-red-950 px-2 py-1 rounded">
                                        ⚠️ {error.error}
                                    </div>
                                ))
                            }
                        </div>
                    )}

                    {/* Basic note validation error (for immediate feedback) */}
                    {!noteValidation.isValid && evaluation?.notes && currentDimensionErrors.length === 0 && (
                        <div className="mt-2 text-xs text-red-600 bg-red-50 dark:bg-red-950 px-2 py-1 rounded">
                            ⚠️ {noteValidation.error}
                        </div>
                    )}
                </div>
            </CardContent>
        </Card>
    );
} 