interface WindowTimeTracker {
    isWindowFocused: boolean;
    focusStartTime: number;
    totalFocusTime: number;
}

interface WindowEventCallbacks {
    onVisitStart: (visited: boolean) => void;
    onVisitEnd: (visited: boolean, totalTime?: number) => void;
    onWindowClosed?: () => void;
}

export interface ExternalWindowManager {
    window: Window | null;
    isClosed: boolean;
    close: () => void;
    _cleanup?: () => void;
}

/**
 * Opens an external window with time tracking functionality
 * @param url - The URL to open
 * @param callbacks - Callback functions for visit tracking
 * @returns Window manager object with control methods
 */
export function openExternalWindow(
    url: string,
    callbacks: WindowEventCallbacks
): ExternalWindowManager | null {
    try {
        const newWindow = window.open(url, '_blank');

        if (newWindow === null) {
            alert('Popup blocked! Please allow popups for this site and try again.');
            callbacks.onVisitEnd(false);
            return null;
        }

        if (!newWindow) {
            callbacks.onVisitEnd(false);
            return null;
        }

        // Initialize time tracker
        const timeTracker: WindowTimeTracker = {
            isWindowFocused: false,
            focusStartTime: 0,
            totalFocusTime: 0
        };

        // Create window manager object first
        const windowManager: ExternalWindowManager = {
            window: newWindow,
            isClosed: false,
            close: () => {
                if (newWindow && !newWindow.closed && !windowManager.isClosed) {
                    newWindow.close();
                    windowManager.isClosed = true;
                    stopTiming();

                    // Clean up event listeners
                    if (windowManager._cleanup) {
                        windowManager._cleanup();
                    }

                    callbacks.onWindowClosed?.();
                    callbacks.onVisitEnd(false, timeTracker.totalFocusTime);
                }
            }
        };

        // Function to start timing when window gets focus
        const startTiming = () => {
            if (!timeTracker.isWindowFocused) {
                console.log('Starting timing');
                timeTracker.isWindowFocused = true;
                timeTracker.focusStartTime = Date.now();
                callbacks.onVisitStart(true);
            }
        };

        // Function to stop timing when window loses focus
        const stopTiming = () => {
            if (timeTracker.isWindowFocused) {
                console.log('Stopping timing');
                timeTracker.isWindowFocused = false;
                const sessionTime = Date.now() - timeTracker.focusStartTime;
                timeTracker.totalFocusTime += sessionTime;
                callbacks.onVisitEnd(false, timeTracker.totalFocusTime);
            }
        };

        // Setup window event listeners
        const setupWindowEvents = () => {
            try {
                newWindow.addEventListener('focus', startTiming);
                newWindow.addEventListener('blur', stopTiming);

                // Start timing immediately as user likely focuses on new window
                setTimeout(startTiming, 200);
            } catch (e) {
                // Fallback: monitor parent window focus changes
                const handleParentBlur = () => {
                    setTimeout(() => {
                        if (!newWindow.closed) {
                            startTiming();
                        }
                    }, 100);
                };

                const handleParentFocus = () => {
                    console.log('Parent window focused');
                    stopTiming();
                };

                console.log('Adding event listeners');

                window.addEventListener('blur', handleParentBlur);
                window.addEventListener('focus', handleParentFocus);

                // Start timing immediately
                setTimeout(startTiming, 200);

                // Store cleanup function in window manager instead of window object
                windowManager._cleanup = () => {
                    window.removeEventListener('blur', handleParentBlur);
                    window.removeEventListener('focus', handleParentFocus);
                };
            }
        };

        // Wait for window to load then setup events
        if (newWindow.document && newWindow.document.readyState === 'complete') {
            setupWindowEvents();
        } else {
            newWindow.addEventListener('load', setupWindowEvents);
        }

        // Monitor window closure
        const checkWindowClosed = () => {
            try {
                if (newWindow.closed && !windowManager.isClosed) {
                    windowManager.isClosed = true;
                    stopTiming();

                    // Clean up event listeners
                    if (windowManager._cleanup) {
                        windowManager._cleanup();
                    }

                    callbacks.onWindowClosed?.();
                    callbacks.onVisitEnd(false, timeTracker.totalFocusTime);
                } else if (!windowManager.isClosed) {
                    setTimeout(checkWindowClosed, 1000);
                }
            } catch (e) {
                if (!windowManager.isClosed) {
                    windowManager.isClosed = true;
                    stopTiming();
                    callbacks.onWindowClosed?.();
                    callbacks.onVisitEnd(false, timeTracker.totalFocusTime);
                }
            }
        };

        setTimeout(checkWindowClosed, 1000);

        // Return window manager object
        return windowManager;

    } catch (error) {
        callbacks.onVisitEnd(false);
        return null;
    }
}

/**
 * Closes an external window if it exists and is not already closed
 * @param windowManager - The window manager object
 */
export function closeExternalWindow(windowManager: ExternalWindowManager | null): void {
    if (windowManager && !windowManager.isClosed) {
        windowManager.close();
    }
} 