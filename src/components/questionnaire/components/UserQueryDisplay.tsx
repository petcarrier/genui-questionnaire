import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { MessageSquare } from 'lucide-react';

interface UserQueryDisplayProps {
    userQuery: string;
}

export function UserQueryDisplay({ userQuery }: UserQueryDisplayProps) {
    return (
        <Card className="border-purple-200 bg-purple-50 dark:border-purple-800 dark:bg-purple-950">
            <CardHeader>
                <CardTitle className="flex items-center gap-2 text-purple-800 dark:text-purple-200">
                    <MessageSquare className="h-5 w-5" />
                    User Query
                </CardTitle>
            </CardHeader>
            <CardContent>
                <div className="bg-white dark:bg-gray-800 rounded-lg p-4 border border-purple-200 dark:border-purple-700">
                    <p className="text-gray-800 dark:text-gray-200 leading-relaxed">
                        {userQuery}
                    </p>
                </div>
                <p className="text-sm text-purple-600 dark:text-purple-400 mt-3">
                    Please evaluate both websites based on how well they address this user query.
                </p>
            </CardContent>
        </Card>
    );
} 