import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { UsersResponse } from '@/types';

interface TopContributorsProps {
    usersData: UsersResponse;
}

const formatDate = (date: Date | string) => {
    return new Date(date).toLocaleDateString('zh-CN', {
        year: 'numeric',
        month: '2-digit',
        day: '2-digit',
        hour: '2-digit',
        minute: '2-digit'
    });
};

export default function TopContributors({ usersData }: TopContributorsProps) {
    return (
        <Card>
            <CardHeader>
                <CardTitle>顶级贡献者</CardTitle>
            </CardHeader>
            <CardContent>
                <div className="space-y-4">
                    {usersData.summary.topContributors.map((user, index) => (
                        <div key={user.userId} className="flex justify-between items-center p-4 border rounded">
                            <div className="flex items-center gap-4">
                                <Badge className="bg-yellow-100 text-yellow-800">#{index + 1}</Badge>
                                <div>
                                    <div className="font-medium">{user.userId}</div>
                                    <div className="text-sm text-muted-foreground">
                                        一致性: {user.consistency.toFixed(1)}% |
                                        完成率: {user.completionRate.toFixed(1)}%
                                    </div>
                                </div>
                            </div>
                            <div className="text-right">
                                <div className="font-bold">{user.submissionCount} 次提交</div>
                                <div className="text-sm text-muted-foreground">
                                    最后活跃: {formatDate(user.lastSubmission)}
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            </CardContent>
        </Card>
    );
} 