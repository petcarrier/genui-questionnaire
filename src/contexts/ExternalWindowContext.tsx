import React, { createContext, useContext, useState, useCallback, ReactNode } from 'react';
import { openExternalWindow, closeExternalWindow, type ExternalWindowManager } from '@/utils/windowManager';

interface ExternalWindowContextType {
    windowManager: ExternalWindowManager | null;
    openWindow: (url: string, callbacks: {
        onVisitStart: (visited: boolean) => void;
        onVisitEnd: (visited: boolean, totalTime?: number) => void;
        onWindowClosed?: () => void;
    }) => boolean;
    closeWindow: () => void;
    isWindowOpen: boolean;
}

const ExternalWindowContext = createContext<ExternalWindowContextType | undefined>(undefined);

interface ExternalWindowProviderProps {
    children: ReactNode;
}

export function ExternalWindowProvider({ children }: ExternalWindowProviderProps) {
    const [windowManager, setWindowManager] = useState<ExternalWindowManager | null>(null);

    const openWindow = useCallback((url: string, callbacks: {
        onVisitStart: (visited: boolean) => void;
        onVisitEnd: (visited: boolean, totalTime?: number) => void;
        onWindowClosed?: () => void;
    }) => {
        // Close existing window if it exists
        if (windowManager && !windowManager.isClosed) {
            console.log('Closing existing external window to open new one');
            closeExternalWindow(windowManager);
        }

        // Enhanced callbacks to update state when window is closed
        const enhancedCallbacks = {
            ...callbacks,
            onWindowClosed: () => {
                callbacks.onWindowClosed?.();
                setWindowManager(null);
            }
        };

        // Open new window
        const newWindowManager = openExternalWindow(url, enhancedCallbacks);

        if (newWindowManager) {
            setWindowManager(newWindowManager);
            return true;
        }

        return false;
    }, [windowManager]);

    const closeWindow = useCallback(() => {
        if (windowManager && !windowManager.isClosed) {
            closeExternalWindow(windowManager);
            setWindowManager(null);
        }
    }, [windowManager]);

    const isWindowOpen = windowManager !== null && !windowManager.isClosed;

    const value: ExternalWindowContextType = {
        windowManager,
        openWindow,
        closeWindow,
        isWindowOpen
    };

    return (
        <ExternalWindowContext.Provider value={value}>
            {children}
        </ExternalWindowContext.Provider>
    );
}

export function useExternalWindow() {
    const context = useContext(ExternalWindowContext);
    if (context === undefined) {
        throw new Error('useExternalWindow must be used within an ExternalWindowProvider');
    }
    return context;
} 