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
                    <SelectValue placeholder="Time range" />
                </SelectTrigger>
                <SelectContent>
                    <SelectItem value="7d">Last 7 days</SelectItem>
                    <SelectItem value="30d">Last 30 days</SelectItem>
                    <SelectItem value="90d">Last 90 days</SelectItem>
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
                {isExporting ? 'Exporting...' : 'Export data'}
            </Button>
        </div>
    );
} 