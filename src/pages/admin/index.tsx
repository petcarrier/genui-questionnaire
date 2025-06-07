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
    ModelDimensionWinRateAnalysis,
    PerformanceMetrics,
    SubmissionTrends,
    QuestionPopularity,
    DataQualityAssessment,
    TrapQuestionAnalysis,
    UserStatsCards,
    TopContributors,
    RecentSubmissions,
    ModelWinRateAnalysis
} from '@/components/admin';
import {
    DashboardData,
    UsersResponse,
    TimeRange,
    ExportFormat,
    DimensionsAnalyticsData,
    AdminFilterOptions
} from '@/types';
import { startOfDay, endOfDay, format } from 'date-fns';
import { buildQueryParams } from '@/utils';

export default function AdminPage() {
    const [dashboardData, setDashboardData] = useState<DashboardData | null>(null);
    const [usersData, setUsersData] = useState<UsersResponse | null>(null);
    const [dimensionsData, setDimensionsData] = useState<DimensionsAnalyticsData | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string>('');
    const [isExporting, setIsExporting] = useState(false);
    const [activeTab, setActiveTab] = useState('overview');
    const [exportFormat, setExportFormat] = useState<ExportFormat>('json');

    // Get today's date range
    const today = new Date();
    const todayStr = format(today, 'yyyy-MM-dd');

    const [filters, setFilters] = useState<AdminFilterOptions>({
        timeRange: 'custom',
        customStartDate: todayStr,
        customEndDate: todayStr,  // End date also set to today
        excludeTrapQuestions: true,  // Exclude trap questions by default
        excludeIncompleteSubmissions: false
    });

    useEffect(() => {
        fetchData();
    }, [filters]);

    const fetchData = async () => {
        try {
            setLoading(true);
            const queryParams = buildQueryParams(filters);

            const [dashboardResponse, usersResponse, dimensionsResponse] = await Promise.all([
                fetch(`/api/admin/dashboard?${queryParams}`),
                fetch(`/api/admin/users?${queryParams}`),
                fetch(`/api/admin/dimensions?${queryParams}`)
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
            const queryParams = buildQueryParams(filters);
            const response = await fetch(`/api/admin/export?format=${exportFormat}&${queryParams}`);

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
        return <LoadingScreen message="Loading admin data..." />;
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
                    error="No data available"
                    onRetry={fetchData}
                    onGoHome={() => window.location.href = '/'}
                />
            </PageLayout>
        );
    }

    return (
        <PageLayout maxWidth="7xl">
            <AdminHeader
                filters={filters}
                exportFormat={exportFormat}
                isExporting={isExporting}
                onFiltersChange={setFilters}
                onExportFormatChange={setExportFormat}
                onExport={handleExport}
            />

            <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-4 sm:space-y-6">
                {/* Mobile-optimized tabs with horizontal scroll */}
                <div className="overflow-x-auto">
                    <TabsList className="grid grid-cols-5 w-full min-w-fit">
                        <TabsTrigger value="overview" className="text-xs sm:text-sm whitespace-nowrap">
                            Overview
                        </TabsTrigger>
                        <TabsTrigger value="dimensions" className="text-xs sm:text-sm whitespace-nowrap">
                            Dimensions
                        </TabsTrigger>
                        <TabsTrigger value="analytics" className="text-xs sm:text-sm whitespace-nowrap">
                            Analytics
                        </TabsTrigger>
                        <TabsTrigger value="users" className="text-xs sm:text-sm whitespace-nowrap">
                            Users
                        </TabsTrigger>
                        <TabsTrigger value="submissions" className="text-xs sm:text-sm whitespace-nowrap">
                            Submissions
                        </TabsTrigger>
                    </TabsList>
                </div>

                <TabsContent value="overview" className="space-y-4 sm:space-y-6">
                    <MetricsCards
                        dashboardData={dashboardData}
                        usersData={usersData}
                        timeRange={filters.timeRange === 'custom' ? '30d' : filters.timeRange}
                    />
                    <SubmissionDistributionCharts dashboardData={dashboardData} />
                    <TopQuestionsCard dashboardData={dashboardData} />
                </TabsContent>

                <TabsContent value="dimensions" className="space-y-4 sm:space-y-6">
                    <DimensionsOverviewCards dimensionsData={dimensionsData} />

                    <ModelDimensionWinRateAnalysis filters={filters} />

                    <div className="grid gap-4 sm:gap-6 xl:grid-cols-2">
                        <DimensionAnalysisCard dimensionsData={dimensionsData} />
                    </div>

                    <CorrelationMatrix dimensionsData={dimensionsData} />
                </TabsContent>

                <TabsContent value="analytics" className="space-y-4 sm:space-y-6">
                    <ModelWinRateAnalysis filters={filters} />

                    <DimensionComparisonCard dimensionsData={dimensionsData} />

                    <PerformanceMetrics
                        dashboardData={dashboardData}
                        usersData={usersData}
                    />

                    <TrapQuestionAnalysis timeRange={filters.timeRange} />

                    <SubmissionTrends dashboardData={dashboardData} />

                    <div className="grid gap-4 sm:gap-6 lg:grid-cols-2">
                        <QuestionPopularity dashboardData={dashboardData} />
                        <DataQualityAssessment
                            dashboardData={dashboardData}
                            usersData={usersData}
                        />
                    </div>
                </TabsContent>

                <TabsContent value="users" className="space-y-4 sm:space-y-6">
                    <UserStatsCards usersData={usersData} />
                    <TopContributors usersData={usersData} />
                </TabsContent>

                <TabsContent value="submissions" className="space-y-4 sm:space-y-6">
                    <RecentSubmissions dashboardData={dashboardData} filters={filters} />
                </TabsContent>
            </Tabs>
        </PageLayout>
    );
} 