import React from 'react';
import { Badge } from '@/components/ui/badge';

/**
 * Format date to Chinese locale
 */
export const formatDate = (date: Date | string) => {
    return new Date(date).toLocaleDateString('zh-CN', {
        year: 'numeric',
        month: '2-digit',
        day: '2-digit',
        hour: '2-digit',
        minute: '2-digit'
    });
};

/**
 * Format duration in seconds to Chinese format
 */
export const formatDuration = (seconds: number) => {
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = Math.round(seconds % 60);
    return `${minutes}分${remainingSeconds}秒`;
};

/**
 * Get winner display component with appropriate styling
 */
export const getWinnerDisplay = (winner: 'A' | 'B' | 'tie' | '') => {
    if (winner === '' || !winner) {
        return <Badge className="bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-300">No Selection</Badge>;
    }

    const styles = {
        A: 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-300',
        B: 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300',
        tie: 'bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-300'
    };

    const labels = {
        A: 'Option A',
        B: 'Option B',
        tie: 'Tie'
    };

    return <Badge className={styles[winner]}>{labels[winner]}</Badge>;
}; 