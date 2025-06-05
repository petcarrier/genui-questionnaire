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
    // 根据问卷完成情况重新排序贡献者
    const topContributorsByQuestionnaire = [...usersData.users]
        .sort((a, b) => {
            // 首先按完成的问卷数排序，然后按问卷完成率排序
            if (a.completedQuestionnaires !== b.completedQuestionnaires) {
                return b.completedQuestionnaires - a.completedQuestionnaires;
            }
            return b.questionnaireCompletionRate - a.questionnaireCompletionRate;
        })
        .slice(0, 5);

    return (
        <Card>
            <CardHeader>
                <CardTitle>顶级贡献者 (基于问卷完成情况)</CardTitle>
            </CardHeader>
            <CardContent>
                <div className="space-y-4">
                    {topContributorsByQuestionnaire.map((user, index) => (
                        <div key={user.userId} className="flex justify-between items-center p-4 border rounded">
                            <div className="flex items-center gap-4">
                                <Badge className="bg-yellow-100 text-yellow-800">#{index + 1}</Badge>
                                <div>
                                    <div className="font-medium">{user.userId}</div>
                                    <div className="text-sm text-muted-foreground">
                                        问卷完成率: {user.questionnaireCompletionRate.toFixed(1)}% |
                                        答题一致性: {user.consistency.toFixed(1)}%
                                    </div>
                                    <div className="text-xs text-muted-foreground">
                                        总提交: {user.submissionCount} |
                                        答题完成率: {user.completionRate.toFixed(1)}%
                                    </div>
                                </div>
                            </div>
                            <div className="text-right">
                                <div className="font-bold">
                                    {user.completedQuestionnaires}/{user.totalQuestionnaires} 问卷
                                </div>
                                <div className="text-sm text-muted-foreground">
                                    进度: {user.currentProgress}/{user.totalQuestions} 题
                                </div>
                                <div className="text-xs text-muted-foreground">
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