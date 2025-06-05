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
        if (filters.excludeTrapQuestions) summary.push('排除陷阱题');
        if (filters.excludeIncompleteSubmissions) summary.push('排除未完成');
        return summary.length > 0 ? `(${summary.join(', ')})` : '';
    };

    return (
        <div className="flex items-center gap-4">
            {/* 时间范围选择器 */}
            <div className="flex items-center gap-2">
                <Select
                    value={filters.timeRange}
                    onValueChange={handleTimeRangeChange}
                >
                    <SelectTrigger className="w-32">
                        <SelectValue placeholder="时间范围" />
                    </SelectTrigger>
                    <SelectContent>
                        <SelectItem value="7d">最近7天</SelectItem>
                        <SelectItem value="30d">最近30天</SelectItem>
                        <SelectItem value="90d">最近90天</SelectItem>
                        <SelectItem value="custom">自定义范围</SelectItem>
                    </SelectContent>
                </Select>

                {/* 自定义时间范围输入 */}
                {filters.timeRange === 'custom' && (
                    <div className="flex items-center gap-2">
                        <Input
                            type="date"
                            value={formatDateForInput(filters.customStartDate)}
                            onChange={(e) => handleCustomDateChange(e.target.value, filters.customEndDate)}
                            className="w-36"
                            placeholder="开始日期"
                        />
                        <span className="text-sm text-muted-foreground">至</span>
                        <Input
                            type="date"
                            value={formatDateForInput(filters.customEndDate)}
                            onChange={(e) => handleCustomDateChange(filters.customStartDate, e.target.value)}
                            className="w-36"
                            placeholder="结束日期"
                        />
                    </div>
                )}
            </div>

            {/* 高级过滤器 */}
            <Popover>
                <PopoverTrigger asChild>
                    <Button variant="outline" size="sm" className="flex items-center gap-2">
                        <Filter className="h-4 w-4" />
                        过滤条件 {getFilterSummary()}
                    </Button>
                </PopoverTrigger>
                <PopoverContent className="w-80" align="start">
                    <Card className="border-0 shadow-none">
                        <CardHeader className="pb-2">
                            <CardTitle className="text-sm flex items-center gap-2">
                                <Settings className="h-4 w-4" />
                                高级过滤选项
                            </CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            <div className="flex items-center justify-between">
                                <Label htmlFor="exclude-trap" className="text-sm font-normal">
                                    排除陷阱题
                                </Label>
                                <Switch
                                    id="exclude-trap"
                                    checked={filters.excludeTrapQuestions}
                                    onCheckedChange={(checked) => handleFilterToggle('excludeTrapQuestions', checked)}
                                />
                            </div>
                            <div className="flex items-center justify-between">
                                <Label htmlFor="exclude-incomplete" className="text-sm font-normal">
                                    排除未完成提交
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

            {/* 导出控制 */}
            <div className="flex items-center gap-2">
                <Select value={exportFormat} onValueChange={onExportFormatChange}>
                    <SelectTrigger className="w-24">
                        <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                        <SelectItem value="json">JSON</SelectItem>
                        <SelectItem value="csv">CSV</SelectItem>
                    </SelectContent>
                </Select>

                <Button onClick={onExport} disabled={isExporting} className="flex items-center gap-2">
                    <Download className="h-4 w-4" />
                    {isExporting ? '导出中...' : '导出数据'}
                </Button>
            </div>
        </div>
    );
} 