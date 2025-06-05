import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { DashboardData, UsersResponse } from '@/types';

interface DataQualityAssessmentProps {
    dashboardData: DashboardData;
    usersData: UsersResponse;
}

export default function DataQualityAssessment({ dashboardData, usersData }: DataQualityAssessmentProps) {
    return (
        <Card>
            <CardHeader>
                <CardTitle>数据质量评估</CardTitle>
            </CardHeader>
            <CardContent>
                <div className="space-y-4">
                    <div className="flex justify-between items-center">
                        <span className="text-sm">数据完整性</span>
                        <div className="flex items-center gap-2">
                            <div className="w-20 bg-gray-200 rounded-full h-2">
                                <div
                                    className="bg-blue-600 h-2 rounded-full"
                                    style={{ width: '85%' }}
                                ></div>
                            </div>
                            <span className="text-sm font-medium">85%</span>
                        </div>
                    </div>
                    <div className="flex justify-between items-center">
                        <span className="text-sm">用户一致性</span>
                        <div className="flex items-center gap-2">
                            <div className="w-20 bg-gray-200 rounded-full h-2">
                                <div
                                    className="bg-green-600 h-2 rounded-full"
                                    style={{ width: `${usersData.summary.topContributors.length > 0 ? usersData.summary.topContributors[0].consistency : 75}%` }}
                                ></div>
                            </div>
                            <span className="text-sm font-medium">
                                {usersData.summary.topContributors.length > 0 ? usersData.summary.topContributors[0].consistency.toFixed(1) : '75'}%
                            </span>
                        </div>
                    </div>
                    <div className="flex justify-between items-center">
                        <span className="text-sm">响应质量</span>
                        <div className="flex items-center gap-2">
                            <div className="w-20 bg-gray-200 rounded-full h-2">
                                <div
                                    className="bg-yellow-600 h-2 rounded-full"
                                    style={{ width: '78%' }}
                                ></div>
                            </div>
                            <span className="text-sm font-medium">78%</span>
                        </div>
                    </div>
                </div>
            </CardContent>
        </Card>
    );
} 