import React from 'react';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Download } from 'lucide-react';
import { TimeRange, ExportFormat } from '@/types';

interface ExportControlsProps {
    timeRange: TimeRange;
    exportFormat: ExportFormat;
    isExporting: boolean;
    onTimeRangeChange: (value: TimeRange) => void;
    onExportFormatChange: (value: ExportFormat) => void;
    onExport: () => void;
}

export default function ExportControls({
    timeRange,
    exportFormat,
    isExporting,
    onTimeRangeChange,
    onExportFormatChange,
    onExport
}: ExportControlsProps) {
    return (
        <div className="flex items-center gap-4">
            <Select value={timeRange} onValueChange={(value: TimeRange) => onTimeRangeChange(value)}>
                <SelectTrigger className="w-32">
                    <SelectValue placeholder="时间范围" />
                </SelectTrigger>
                <SelectContent>
                    <SelectItem value="7d">最近7天</SelectItem>
                    <SelectItem value="30d">最近30天</SelectItem>
                    <SelectItem value="90d">最近90天</SelectItem>
                </SelectContent>
            </Select>

            <Select value={exportFormat} onValueChange={(value: ExportFormat) => onExportFormatChange(value)}>
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
    );
} 