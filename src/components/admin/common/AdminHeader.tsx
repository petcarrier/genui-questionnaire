import React from 'react';
import { PageHeader } from '@/components';
import { Database } from 'lucide-react';
import ExportControls from './ExportControls';
import { TimeRange, ExportFormat } from '@/types';

interface AdminHeaderProps {
    timeRange: TimeRange;
    exportFormat: ExportFormat;
    isExporting: boolean;
    onTimeRangeChange: (value: TimeRange) => void;
    onExportFormatChange: (value: ExportFormat) => void;
    onExport: () => void;
}

export default function AdminHeader({
    timeRange,
    exportFormat,
    isExporting,
    onTimeRangeChange,
    onExportFormatChange,
    onExport
}: AdminHeaderProps) {
    return (
        <PageHeader
            title="管理面板"
            description="查看问卷提交数据、用户分析和系统统计"
            icon={<Database className="h-8 w-8" />}
        >
            <ExportControls
                timeRange={timeRange}
                exportFormat={exportFormat}
                isExporting={isExporting}
                onTimeRangeChange={onTimeRangeChange}
                onExportFormatChange={onExportFormatChange}
                onExport={onExport}
            />
        </PageHeader>
    );
} 