import React from 'react';
import { Geist, Geist_Mono } from "next/font/google";

const geistSans = Geist({
    variable: "--font-geist-sans",
    subsets: ["latin"],
});

const geistMono = Geist_Mono({
    variable: "--font-geist-mono",
    subsets: ["latin"],
});

interface PageLayoutProps {
    children: React.ReactNode;
    maxWidth?: 'sm' | 'md' | 'lg' | 'xl' | '2xl' | '4xl' | '6xl' | '7xl' | 'full';
    className?: string;
}

export function PageLayout({
    children,
    maxWidth = '6xl',
    className = ''
}: PageLayoutProps) {
    const maxWidthClasses = {
        sm: 'max-w-sm',
        md: 'max-w-md',
        lg: 'max-w-lg',
        xl: 'max-w-xl',
        '2xl': 'max-w-2xl',
        '4xl': 'max-w-4xl',
        '6xl': 'max-w-6xl',
        '7xl': 'max-w-7xl',
        full: 'max-w-full'
    };

    return (
        <div className={`${geistSans.className} ${geistMono.className} min-h-screen bg-background p-4 sm:p-6 lg:p-8 ${className}`}>
            <div className="container mx-auto py-8">
                <div className={`${maxWidthClasses[maxWidth]} mx-auto space-y-6`}>
                    {children}
                </div>
            </div>
        </div>
    );
} 