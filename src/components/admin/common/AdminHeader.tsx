import React from 'react';
import { PageHeader } from '@/components';
import { Database } from 'lucide-react';
import AdminFilterControls from './AdminFilterControls';
import { ExportFormat, AdminFilterOptions } from '@/types';

interface AdminHeaderProps {
    filters: AdminFilterOptions;
    exportFormat: ExportFormat;
    isExporting: boolean;
    onFiltersChange: (filters: AdminFilterOptions) => void;
    onExportFormatChange: (value: ExportFormat) => void;
    onExport: () => void;
}

export default function AdminHeader({
    filters,
    exportFormat,
    isExporting,
    onFiltersChange,
    onExportFormatChange,
    onExport
}: AdminHeaderProps) {
    return (
        <PageHeader
            title="管理面板"
            description="查看问卷提交数据、用户分析和系统统计"
            icon={<Database className="h-8 w-8" />}
        >
            <AdminFilterControls
                filters={filters}
                exportFormat={exportFormat}
                isExporting={isExporting}
                onFiltersChange={onFiltersChange}
                onExportFormatChange={onExportFormatChange}
                onExport={onExport}
            />
        </PageHeader>
    );
} 