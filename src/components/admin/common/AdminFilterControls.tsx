import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Calendar, CalendarIcon, Download, Filter, Settings } from 'lucide-react';
import { TimeRange, ExportFormat, AdminFilterOptions } from '@/types';
import { format } from 'date-fns';
import { zhCN } from 'date-fns/locale';

interface AdminFilterControlsProps {
    filters: AdminFilterOptions;
    exportFormat: ExportFormat;
    isExporting: boolean;
    onFiltersChange: (filters: AdminFilterOptions) => void;
    onExportFormatChange: (format: ExportFormat) => void;
    onExport: () => void;
}

export default function AdminFilterControls({
    filters,
    exportFormat,
    isExporting,
    onFiltersChange,
    onExportFormatChange,
    onExport
}: AdminFilterControlsProps) {
    const [showAdvancedFilters, setShowAdvancedFilters] = useState(false);

    const handleTimeRangeChange = (timeRange: TimeRange) => {
        onFiltersChange({
            ...filters,
            timeRange,
            customStartDate: timeRange !== 'custom' ? undefined : filters.customStartDate,
            customEndDate: timeRange !== 'custom' ? undefined : filters.customEndDate
        });
    };

    const handleCustomDateChange = (startDate?: string, endDate?: string) => {
        onFiltersChange({
            ...filters,
            customStartDate: startDate,
            customEndDate: endDate
        });
    };

    const handleFilterToggle = (filterName: keyof Pick<AdminFilterOptions, 'excludeTrapQuestions' | 'excludeIncompleteSubmissions'>, value: boolean) => {
        onFiltersChange({
            ...filters,
            [filterName]: value
        });
    };

    const formatDateForInput = (dateStr?: string): string => {
        if (!dateStr) return '';
        const date = new Date(dateStr);
        return date.toISOString().split('T')[0];
    };

    const getFilterSummary = () => {
        const summary = [];
        if (filters.excludeTrapQuestions) summary.push('Exclude trap questions');
        if (filters.excludeIncompleteSubmissions) summary.push('Exclude incomplete');
        return summary.length > 0 ? `(${summary.join(', ')})` : '';
    };

    return (
        <div className="space-y-4">
            {/* Mobile: Stack vertically, Desktop: Horizontal layout */}
            <div className="flex flex-col gap-4 lg:flex-row lg:items-center">
                {/* Time range selector section */}
                <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
                    <div className="flex items-center gap-2">
                        <Select
                            value={filters.timeRange}
                            onValueChange={handleTimeRangeChange}
                        >
                            <SelectTrigger className="w-full sm:w-32">
                                <SelectValue placeholder="Time range" />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="7d">Last 7 days</SelectItem>
                                <SelectItem value="30d">Last 30 days</SelectItem>
                                <SelectItem value="90d">Last 90 days</SelectItem>
                                <SelectItem value="custom">Custom range</SelectItem>
                            </SelectContent>
                        </Select>
                    </div>

                    {/* Custom time range input - Mobile optimized */}
                    {filters.timeRange === 'custom' && (
                        <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
                            <Input
                                type="date"
                                value={formatDateForInput(filters.customStartDate)}
                                onChange={(e) => handleCustomDateChange(e.target.value, filters.customEndDate)}
                                className="w-full sm:w-36"
                                placeholder="Start date"
                            />
                            <span className="hidden text-sm text-muted-foreground sm:inline">to</span>
                            <span className="text-sm text-muted-foreground sm:hidden">to</span>
                            <Input
                                type="date"
                                value={formatDateForInput(filters.customEndDate)}
                                onChange={(e) => handleCustomDateChange(filters.customStartDate, e.target.value)}
                                className="w-full sm:w-36"
                                placeholder="End date"
                            />
                        </div>
                    )}
                </div>

                {/* Filter and Export controls */}
                <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:ml-auto">
                    {/* Advanced filters */}
                    <Popover>
                        <PopoverTrigger asChild>
                            <Button variant="outline" size="sm" className="flex items-center gap-2 w-full sm:w-auto">
                                <Filter className="h-4 w-4" />
                                <span className="truncate">Filter criteria {getFilterSummary()}</span>
                            </Button>
                        </PopoverTrigger>
                        <PopoverContent className="w-80" align="end" side="bottom">
                            <Card className="border-0 shadow-none">
                                <CardHeader className="pb-2">
                                    <CardTitle className="text-sm flex items-center gap-2">
                                        <Settings className="h-4 w-4" />
                                        Advanced filter options
                                    </CardTitle>
                                </CardHeader>
                                <CardContent className="space-y-4">
                                    <div className="flex items-center justify-between">
                                        <Label htmlFor="exclude-trap" className="text-sm font-normal">
                                            Exclude trap questions
                                        </Label>
                                        <Switch
                                            id="exclude-trap"
                                            checked={filters.excludeTrapQuestions}
                                            onCheckedChange={(checked) => handleFilterToggle('excludeTrapQuestions', checked)}
                                        />
                                    </div>
                                    <div className="flex items-center justify-between">
                                        <Label htmlFor="exclude-incomplete" className="text-sm font-normal">
                                            Exclude incomplete submissions
                                        </Label>
                                        <Switch
                                            id="exclude-incomplete"
                                            checked={filters.excludeIncompleteSubmissions}
                                            onCheckedChange={(checked) => handleFilterToggle('excludeIncompleteSubmissions', checked)}
                                        />
                                    </div>
                                </CardContent>
                            </Card>
                        </PopoverContent>
                    </Popover>

                    {/* Export controls - Mobile optimized */}
                    <div className="flex items-center gap-2">
                        <Select value={exportFormat} onValueChange={onExportFormatChange}>
                            <SelectTrigger className="w-20 sm:w-24">
                                <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="json">JSON</SelectItem>
                                <SelectItem value="csv">CSV</SelectItem>
                            </SelectContent>
                        </Select>

                        <Button
                            onClick={onExport}
                            disabled={isExporting}
                            className="flex items-center gap-2 flex-1 sm:flex-none"
                            size="sm"
                        >
                            <Download className="h-4 w-4" />
                            <span className="hidden sm:inline">
                                {isExporting ? 'Exporting...' : 'Export data'}
                            </span>
                            <span className="sm:hidden">
                                {isExporting ? 'Exporting...' : 'Export'}
                            </span>
                        </Button>
                    </div>
                </div>
            </div>
        </div>
    );
} 