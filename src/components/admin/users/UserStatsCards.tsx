import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { UsersResponse } from '@/types';

interface UserStatsCardsProps {
    usersData: UsersResponse;
}

export default function UserStatsCards({ usersData }: UserStatsCardsProps) {
    return (
        <div className="grid gap-4 md:grid-cols-3">
            <Card>
                <CardHeader>
                    <CardTitle className="text-sm">用户总数</CardTitle>
                </CardHeader>
                <CardContent>
                    <div className="text-2xl font-bold">{usersData.summary.totalUsers}</div>
                </CardContent>
            </Card>

            <Card>
                <CardHeader>
                    <CardTitle className="text-sm">活跃用户</CardTitle>
                </CardHeader>
                <CardContent>
                    <div className="text-2xl font-bold">{usersData.summary.activeUsers}</div>
                </CardContent>
            </Card>

            <Card>
                <CardHeader>
                    <CardTitle className="text-sm">平均提交数</CardTitle>
                </CardHeader>
                <CardContent>
                    <div className="text-2xl font-bold">
                        {usersData.summary.averageSubmissionsPerUser.toFixed(1)}
                    </div>
                </CardContent>
            </Card>
        </div>
    );
} 