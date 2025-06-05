import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import {
    CheckCircle,
    ChevronLeft,
    ChevronRight,
    Search,
    Calendar,
    User,
    Tag,
    FileText,
    MessageSquare,
    Eye,
    EyeOff
} from 'lucide-react';
import { PaginatedSubmissionsData, AdminFilterOptions } from '@/types';
import { QuestionnaireResponse } from '@/types/questionnaire';
import { buildQueryParams as buildFilterQueryParams } from '@/utils';

interface RecentSubmissionsProps {
    dashboardData?: any;
    filters?: AdminFilterOptions;
}

const formatDate = (date: Date | string) => {
    return new Date(date).toLocaleDateString('en-US', {
        month: '2-digit',
        day: '2-digit',
        hour: '2-digit',
        minute: '2-digit'
    });
};

const getWinnerDisplay = (winner: 'A' | 'B' | 'tie' | '') => {
    if (winner === '' || !winner) {
        return <Badge variant="secondary" className="text-xs">No Selection</Badge>;
    }

    const styles = {
        A: 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-300',
        B: 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300',
        tie: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-300'
    };

    const labels = {
        A: 'A',
        B: 'B',
        tie: 'Tie'
    };

    return <Badge className={`${styles[winner]} text-xs`}>{labels[winner]}</Badge>;
};

export default function RecentSubmissions({ dashboardData, filters }: RecentSubmissionsProps) {
    const [paginatedData, setPaginatedData] = useState<PaginatedSubmissionsData | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string>('');

    // Pagination and filtering state
    const [currentPage, setCurrentPage] = useState(1);
    const [pageSize, setPageSize] = useState(20);
    const [searchTerm, setSearchTerm] = useState('');
    const [sortBy, setSortBy] = useState<'submittedAt' | 'questionId' | 'annotatorId'>('submittedAt');
    const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc');

    // UI state
    const [showNotesFor, setShowNotesFor] = useState<string[]>([]);

    useEffect(() => {
        fetchSubmissions();
    }, [currentPage, pageSize, searchTerm, sortBy, sortOrder, filters]);

    const buildQueryParams = () => {
        const params = new URLSearchParams();

        // Add pagination and sorting parameters
        params.append('page', currentPage.toString());
        params.append('limit', pageSize.toString());
        params.append('sortBy', sortBy);
        params.append('sortOrder', sortOrder);

        if (searchTerm) {
            params.append('search', searchTerm);
        }

        // Use utils function to handle filter parameters
        if (filters) {
            const filterParams = buildFilterQueryParams(filters);
            if (filterParams) {
                // Merge filter parameters into existing parameters
                const filterSearchParams = new URLSearchParams(filterParams);
                filterSearchParams.forEach((value, key) => {
                    params.append(key, value);
                });
            }
        }

        return params.toString();
    };

    const fetchSubmissions = async () => {
        try {
            setLoading(true);
            const queryParams = buildQueryParams();
            const response = await fetch(`/api/admin/submissions?${queryParams}`);

            if (!response.ok) {
                throw new Error('Failed to fetch submissions');
            }

            const result = await response.json();
            setPaginatedData(result.data);
        } catch (err) {
            setError(err instanceof Error ? err.message : 'Failed to load submissions');
        } finally {
            setLoading(false);
        }
    };

    const handleSearch = (value: string) => {
        setSearchTerm(value);
        setCurrentPage(1); // Reset to first page
    };

    const toggleNotesFor = (questionId: string) => {
        setShowNotesFor(prev =>
            prev.includes(questionId)
                ? prev.filter(id => id !== questionId)
                : [...prev, questionId]
        );
    };

    if (loading) {
        return (
            <Card>
                <CardContent className="flex items-center justify-center py-8">
                    <div className="text-muted-foreground">Loading...</div>
                </CardContent>
            </Card>
        );
    }

    if (error) {
        return (
            <Card>
                <CardContent className="flex items-center justify-center py-8">
                    <div className="text-red-500">{error}</div>
                </CardContent>
            </Card>
        );
    }

    if (!paginatedData) {
        return (
            <Card>
                <CardContent className="flex items-center justify-center py-8">
                    <div className="text-muted-foreground">No data available</div>
                </CardContent>
            </Card>
        );
    }

    return (
        <Card>
            <CardHeader className="pb-4">
                <CardTitle className="flex items-center gap-2 text-lg">
                    <CheckCircle className="h-5 w-5" />
                    Submission Details
                    <span className="text-sm font-normal text-muted-foreground">
                        (Total {paginatedData.total} records)
                    </span>
                </CardTitle>

                {/* Search and sorting controls */}
                <div className="flex flex-col sm:flex-row gap-3 mt-3">
                    <div className="flex-1">
                        <div className="relative">
                            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                            <Input
                                placeholder="Search question ID, annotator, task group or dimension comments..."
                                value={searchTerm}
                                onChange={(e) => handleSearch(e.target.value)}
                                className="pl-10 h-9"
                            />
                        </div>
                    </div>
                    <div className="flex gap-2">
                        <Select value={sortBy} onValueChange={(value: any) => setSortBy(value)}>
                            <SelectTrigger className="w-[120px] h-9">
                                <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="submittedAt">Submit Time</SelectItem>
                                <SelectItem value="questionId">Question ID</SelectItem>
                                <SelectItem value="annotatorId">Annotator</SelectItem>
                            </SelectContent>
                        </Select>
                        <Select value={sortOrder} onValueChange={(value: any) => setSortOrder(value)}>
                            <SelectTrigger className="w-[80px] h-9">
                                <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="desc">Desc</SelectItem>
                                <SelectItem value="asc">Asc</SelectItem>
                            </SelectContent>
                        </Select>
                        <Select value={pageSize.toString()} onValueChange={(value) => setPageSize(parseInt(value))}>
                            <SelectTrigger className="w-[80px] h-9">
                                <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="10">10</SelectItem>
                                <SelectItem value="20">20</SelectItem>
                                <SelectItem value="50">50</SelectItem>
                            </SelectContent>
                        </Select>
                    </div>
                </div>
            </CardHeader>

            <CardContent className="pt-0">
                <div className="space-y-3">
                    {paginatedData.submissions.map((submission: QuestionnaireResponse, index) => {
                        const showNotes = showNotesFor.includes(submission.questionId);
                        const hasNotes = submission.dimensionEvaluations.some(evaluation =>
                            evaluation.notes && evaluation.notes.trim().length > 0
                        );

                        return (
                            <div key={index} className="border rounded-lg p-3 space-y-2 bg-card">
                                {/* Header info - more compact layout */}
                                <div className="flex justify-between items-center">
                                    <div className="flex items-center gap-4 text-sm">
                                        <div className="flex items-center gap-1">
                                            <Tag className="h-3 w-3 text-muted-foreground" />
                                            <span className="font-medium">{submission.questionId}</span>
                                            {submission.isTrap && <Badge variant="destructive" className="text-xs px-1 py-0">Trap</Badge>}
                                        </div>
                                        <div className="flex items-center gap-1 text-muted-foreground">
                                            <User className="h-3 w-3" />
                                            <span>{submission.annotatorId}</span>
                                        </div>
                                        <div className="flex items-center gap-1 text-muted-foreground">
                                            <Calendar className="h-3 w-3" />
                                            <span>{formatDate(submission.submittedAt)}</span>
                                        </div>
                                    </div>
                                    <div className="flex items-center gap-2">
                                        <div className="text-xs text-muted-foreground">Overall Winner</div>
                                        {getWinnerDisplay(submission.overallWinner)}
                                    </div>
                                </div>

                                {/* Link information */}
                                <div className="text-xs text-muted-foreground bg-muted/30 rounded p-2">
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-1">
                                        <div className="truncate">A: {submission.linkAUrl}</div>
                                        <div className="truncate">B: {submission.linkBUrl}</div>
                                    </div>
                                </div>

                                {/* Dimension evaluation results - compact grid layout */}
                                <div>
                                    <div className="flex justify-between items-center mb-2">
                                        <div className="text-sm font-medium">Dimension Evaluation:</div>
                                        {hasNotes && (
                                            <Button
                                                variant="ghost"
                                                size="sm"
                                                onClick={() => toggleNotesFor(submission.questionId)}
                                                className="h-6 px-2 text-xs"
                                            >
                                                {showNotes ? (
                                                    <>
                                                        <EyeOff className="h-3 w-3 mr-1" />
                                                        Hide Comments
                                                    </>
                                                ) : (
                                                    <>
                                                        <Eye className="h-3 w-3 mr-1" />
                                                        View Comments
                                                    </>
                                                )}
                                            </Button>
                                        )}
                                    </div>

                                    <div className="grid gap-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
                                        {submission.dimensionEvaluations.map((evaluation, evalIndex) => (
                                            <div key={evalIndex} className="bg-muted/50 rounded p-2">
                                                <div className="flex justify-between items-center mb-1">
                                                    <span className="text-xs font-medium truncate flex-1 mr-2">
                                                        {evaluation.dimensionId}
                                                    </span>
                                                    {getWinnerDisplay(evaluation.winner)}
                                                </div>

                                                {showNotes && evaluation.notes && evaluation.notes.trim() && (
                                                    <div className="text-xs text-muted-foreground mt-1 p-1 bg-background rounded border-l-2 border-blue-200">
                                                        <div className="flex items-start gap-1">
                                                            <MessageSquare className="h-3 w-3 mt-0.5 text-blue-500 flex-shrink-0" />
                                                            <span className="break-words">{evaluation.notes}</span>
                                                        </div>
                                                    </div>
                                                )}

                                                {showNotes && (!evaluation.notes || !evaluation.notes.trim()) && (
                                                    <div className="text-xs text-muted-foreground/50 mt-1 italic">
                                                        No comments
                                                    </div>
                                                )}
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            </div>
                        );
                    })}

                    {paginatedData.submissions.length === 0 && (
                        <div className="text-center py-8 text-muted-foreground">
                            No submission data matching criteria
                        </div>
                    )}
                </div>

                {/* Pagination controls */}
                {paginatedData.totalPages > 1 && (
                    <div className="flex items-center justify-between mt-6 pt-4 border-t">
                        <div className="text-sm text-muted-foreground">
                            Showing {((currentPage - 1) * pageSize) + 1} - {Math.min(currentPage * pageSize, paginatedData.total)} of {paginatedData.total} records
                        </div>
                        <div className="flex items-center gap-2">
                            <Button
                                variant="outline"
                                size="sm"
                                onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
                                disabled={!paginatedData.hasPrevPage}
                            >
                                <ChevronLeft className="h-4 w-4" />
                                Previous
                            </Button>

                            <div className="flex items-center gap-1">
                                {/* Simplified pagination display */}
                                {currentPage > 2 && (
                                    <>
                                        <Button
                                            variant="outline"
                                            size="sm"
                                            onClick={() => setCurrentPage(1)}
                                            className="w-8 h-8"
                                        >
                                            1
                                        </Button>
                                        {currentPage > 3 && <span className="text-sm text-muted-foreground">...</span>}
                                    </>
                                )}

                                {currentPage > 1 && (
                                    <Button
                                        variant="outline"
                                        size="sm"
                                        onClick={() => setCurrentPage(currentPage - 1)}
                                        className="w-8 h-8"
                                    >
                                        {currentPage - 1}
                                    </Button>
                                )}

                                <Button
                                    variant="default"
                                    size="sm"
                                    className="w-8 h-8"
                                >
                                    {currentPage}
                                </Button>

                                {currentPage < paginatedData.totalPages && (
                                    <Button
                                        variant="outline"
                                        size="sm"
                                        onClick={() => setCurrentPage(currentPage + 1)}
                                        className="w-8 h-8"
                                    >
                                        {currentPage + 1}
                                    </Button>
                                )}

                                {currentPage < paginatedData.totalPages - 1 && (
                                    <>
                                        {currentPage < paginatedData.totalPages - 2 && <span className="text-sm text-muted-foreground">...</span>}
                                        <Button
                                            variant="outline"
                                            size="sm"
                                            onClick={() => setCurrentPage(paginatedData.totalPages)}
                                            className="w-8 h-8"
                                        >
                                            {paginatedData.totalPages}
                                        </Button>
                                    </>
                                )}
                            </div>

                            <Button
                                variant="outline"
                                size="sm"
                                onClick={() => setCurrentPage(prev => Math.min(paginatedData.totalPages, prev + 1))}
                                disabled={!paginatedData.hasNextPage}
                            >
                                Next
                                <ChevronRight className="h-4 w-4" />
                            </Button>
                        </div>
                    </div>
                )}
            </CardContent>
        </Card>
    );
} 