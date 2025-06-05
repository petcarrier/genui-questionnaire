import React, { useState, useEffect } from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { PageLayout, LoadingScreen, ErrorScreen } from '@/components';
import {
    AdminHeader,
    MetricsCards,
    SubmissionDistributionCharts,
    TopQuestionsCard,
    DimensionsOverviewCards,
    DimensionAnalysisCard,
    DimensionComparisonCard,
    CorrelationMatrix,
    PerformanceMetrics,
    SubmissionTrends,
    QuestionPopularity,
    DataQualityAssessment,
    UserStatsCards,
    TopContributors,
    RecentSubmissions
} from '@/components/admin';
import {
    DashboardData,
    UsersResponse,
    TimeRange,
    ExportFormat,
    DimensionsAnalyticsData
} from '@/types';

export default function AdminPage() {
    const [dashboardData, setDashboardData] = useState<DashboardData | null>(null);
    const [usersData, setUsersData] = useState<UsersResponse | null>(null);
    const [dimensionsData, setDimensionsData] = useState<DimensionsAnalyticsData | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string>('');
    const [isExporting, setIsExporting] = useState(false);
    const [activeTab, setActiveTab] = useState('overview');
    const [timeRange, setTimeRange] = useState<TimeRange>('30d');
    const [exportFormat, setExportFormat] = useState<ExportFormat>('json');

    useEffect(() => {
        fetchData();
    }, [timeRange]);

    const fetchData = async () => {
        try {
            setLoading(true);
            const [dashboardResponse, usersResponse, dimensionsResponse] = await Promise.all([
                fetch('/api/admin/dashboard'),
                fetch(`/api/admin/users?timeRange=${timeRange}`),
                fetch(`/api/admin/dimensions?timeRange=${timeRange}`)
            ]);

            if (!dashboardResponse.ok || !usersResponse.ok || !dimensionsResponse.ok) {
                throw new Error('Failed to fetch data');
            }

            const dashboardResult = await dashboardResponse.json();
            const usersResult = await usersResponse.json();
            const dimensionsResult = await dimensionsResponse.json();

            setDashboardData(dashboardResult.data);
            setUsersData(usersResult.data);
            setDimensionsData(dimensionsResult.data);
        } catch (err) {
            setError(err instanceof Error ? err.message : 'Failed to load data');
        } finally {
            setLoading(false);
        }
    };

    const handleExport = async () => {
        try {
            setIsExporting(true);
            const response = await fetch(`/api/admin/export?format=${exportFormat}`);

            if (!response.ok) {
                throw new Error('Failed to export data');
            }

            const blob = await response.blob();
            const url = window.URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.style.display = 'none';
            a.href = url;
            const extension = exportFormat === 'csv' ? 'csv' : 'json';
            a.download = `questionnaire-export-${new Date().toISOString().split('T')[0]}.${extension}`;
            document.body.appendChild(a);
            a.click();
            window.URL.revokeObjectURL(url);
            document.body.removeChild(a);
        } catch (err) {
            console.error('Export error:', err);
        } finally {
            setIsExporting(false);
        }
    };

    if (loading) {
        return <LoadingScreen message="加载管理数据中..." />;
    }

    if (error) {
        return (
            <PageLayout maxWidth="4xl">
                <ErrorScreen
                    error={error}
                    onRetry={fetchData}
                    onGoHome={() => window.location.href = '/'}
                />
            </PageLayout>
        );
    }

    if (!dashboardData || !usersData || !dimensionsData) {
        return (
            <PageLayout maxWidth="4xl">
                <ErrorScreen
                    error="暂无数据"
                    onRetry={fetchData}
                    onGoHome={() => window.location.href = '/'}
                />
            </PageLayout>
        );
    }

    return (
        <PageLayout maxWidth="7xl">
            <AdminHeader
                timeRange={timeRange}
                exportFormat={exportFormat}
                isExporting={isExporting}
                onTimeRangeChange={setTimeRange}
                onExportFormatChange={setExportFormat}
                onExport={handleExport}
            />

            <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
                <TabsList className="grid w-full grid-cols-5">
                    <TabsTrigger value="overview">概览</TabsTrigger>
                    <TabsTrigger value="dimensions">维度分析</TabsTrigger>
                    <TabsTrigger value="analytics">分析</TabsTrigger>
                    <TabsTrigger value="users">用户</TabsTrigger>
                    <TabsTrigger value="submissions">提交详情</TabsTrigger>
                </TabsList>

                <TabsContent value="overview" className="space-y-6">
                    <MetricsCards
                        dashboardData={dashboardData}
                        usersData={usersData}
                        timeRange={timeRange}
                    />
                    <SubmissionDistributionCharts dashboardData={dashboardData} />
                    <TopQuestionsCard dashboardData={dashboardData} />
                </TabsContent>

                <TabsContent value="dimensions" className="space-y-6">
                    <DimensionsOverviewCards dimensionsData={dimensionsData} />

                    <div className="grid gap-6 lg:grid-cols-2">
                        <DimensionAnalysisCard dimensionsData={dimensionsData} />
                        <DimensionComparisonCard dimensionsData={dimensionsData} />
                    </div>

                    <CorrelationMatrix dimensionsData={dimensionsData} />
                </TabsContent>

                <TabsContent value="analytics" className="space-y-6">
                    <PerformanceMetrics
                        dashboardData={dashboardData}
                        usersData={usersData}
                    />

                    <SubmissionTrends dashboardData={dashboardData} />

                    <div className="grid gap-6 md:grid-cols-2">
                        <QuestionPopularity dashboardData={dashboardData} />
                        <DataQualityAssessment
                            dashboardData={dashboardData}
                            usersData={usersData}
                        />
                    </div>
                </TabsContent>

                <TabsContent value="users" className="space-y-6">
                    <UserStatsCards usersData={usersData} />
                    <TopContributors usersData={usersData} />
                </TabsContent>

                <TabsContent value="submissions" className="space-y-6">
                    <RecentSubmissions dashboardData={dashboardData} />
                </TabsContent>
            </Tabs>
        </PageLayout>
    );
} 