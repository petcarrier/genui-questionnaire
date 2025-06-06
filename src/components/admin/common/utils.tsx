import React from 'react';
import { Badge } from '@/components/ui/badge';
import { useState, useEffect } from 'react';
import { cn } from '@/utils/utils';

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

// Custom hook for responsive detection
export const useIsMobile = () => {
    const [isMobile, setIsMobile] = useState(false);

    useEffect(() => {
        const checkDevice = () => {
            setIsMobile(window.innerWidth < 640); // sm breakpoint
        };

        checkDevice();
        window.addEventListener('resize', checkDevice);
        return () => window.removeEventListener('resize', checkDevice);
    }, []);

    return isMobile;
};

// Custom hook for responsive grid detection
export const useResponsiveColumns = () => {
    const [columns, setColumns] = useState(1);

    useEffect(() => {
        const updateColumns = () => {
            const width = window.innerWidth;
            if (width >= 1024) setColumns(4); // lg: 4 columns
            else if (width >= 768) setColumns(3); // md: 3 columns
            else if (width >= 640) setColumns(2); // sm: 2 columns
            else setColumns(1); // mobile: 1 column
        };

        updateColumns();
        window.addEventListener('resize', updateColumns);
        return () => window.removeEventListener('resize', updateColumns);
    }, []);

    return columns;
};

// Responsive text truncation
export const truncateText = (text: string, maxLength: number, isMobile: boolean = false) => {
    const length = isMobile ? Math.floor(maxLength * 0.7) : maxLength;
    return text.length > length ? `${text.substring(0, length)}...` : text;
};

// Mobile-optimized chart container
export const MobileChartContainer = ({
    children,
    className
}: {
    children: React.ReactNode;
    className?: string;
}) => {
    return (
        <div className={cn(
            "w-full overflow-x-auto",
            "min-h-[200px] sm:min-h-[300px]",
            className
        )}>
            <div className="min-w-[300px] h-full">
                {children}
            </div>
        </div>
    );
};

// Mobile-optimized table wrapper
export const MobileTableWrapper = ({
    children,
    className
}: {
    children: React.ReactNode;
    className?: string;
}) => {
    return (
        <div className={cn(
            "w-full overflow-x-auto border rounded-lg",
            className
        )}>
            <div className="min-w-[600px]">
                {children}
            </div>
        </div>
    );
};

// Responsive card grid
export const ResponsiveCardGrid = ({
    children,
    className,
    cols = { base: 1, sm: 2, lg: 4 }
}: {
    children: React.ReactNode;
    className?: string;
    cols?: { base?: number; sm?: number; md?: number; lg?: number; xl?: number };
}) => {
    const gridClasses = [
        `grid-cols-${cols.base || 1}`,
        cols.sm && `sm:grid-cols-${cols.sm}`,
        cols.md && `md:grid-cols-${cols.md}`,
        cols.lg && `lg:grid-cols-${cols.lg}`,
        cols.xl && `xl:grid-cols-${cols.xl}`,
    ].filter(Boolean).join(' ');

    return (
        <div className={cn(
            "grid gap-4",
            gridClasses,
            className
        )}>
            {children}
        </div>
    );
};

// Mobile-friendly number formatting
export const formatNumberForMobile = (num: number, isMobile: boolean = false) => {
    if (!isMobile) return num.toLocaleString();

    if (num >= 1000000) return `${(num / 1000000).toFixed(1)}M`;
    if (num >= 1000) return `${(num / 1000).toFixed(1)}K`;
    return num.toString();
};

// Mobile-optimized date formatting
export const formatDateForMobile = (date: Date | string, isMobile: boolean = false) => {
    const d = new Date(date);

    if (isMobile) {
        return d.toLocaleDateString('en-US', {
            month: 'short',
            day: 'numeric',
            hour: '2-digit',
            minute: '2-digit'
        });
    }

    return d.toLocaleDateString('en-US', {
        year: 'numeric',
        month: '2-digit',
        day: '2-digit',
        hour: '2-digit',
        minute: '2-digit'
    });
}; 