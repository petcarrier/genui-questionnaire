interface WindowTimeTracker {
    isWindowFocused: boolean;
    focusStartTime: number;
    totalFocusTime: number;
}

interface WindowEventCallbacks {
    onVisitStart: (visited: boolean) => void;
    onVisitEnd: (visited: boolean, totalTime?: number) => void;
    onWindowClosed?: () => void;
    onWindowRefresh?: (totalTimeBeforeRefresh: number) => void;
}

export interface ExternalWindowManager {
    window: Window | null;
    isClosed: boolean;
    close: () => void;
    _cleanup?: () => void;
}

// Monitoring script to be injected into external windows
const MONITORING_SCRIPT = `
(function() {
    if (window.windowTrackingInitialized) return;
    window.windowTrackingInitialized = true;
    
    let isTracking = false;
    let startTime = 0;
    let totalTime = 0;
    
    // Send message to parent window
    function sendToParent(type, data = {}) {
        if (window.opener && !window.opener.closed) {
            try {
                window.opener.postMessage({
                    type: 'windowTracking',
                    event: type,
                    data: { ...data, totalTime }
                }, '*');
            } catch (e) {
                console.log('Failed to send message to parent:', e);
            }
        }
    }
    
    // Start timing
    function startTracking() {
        if (!isTracking) {
            isTracking = true;
            startTime = Date.now();
            sendToParent('visitStart', { visited: true });
        }
    }
    
    // Stop timing
    function stopTracking() {
        if (isTracking) {
            isTracking = false;
            const sessionTime = Date.now() - startTime;
            totalTime += sessionTime;
            sendToParent('visitEnd', { visited: false });
        }
    }
    
    // Listen for window focus changes
    window.addEventListener('focus', startTracking);
    window.addEventListener('blur', stopTracking);
    
    // Listen for page refresh/navigation
    window.addEventListener('beforeunload', function() {
        stopTracking();
        sendToParent('beforeRefresh');
    });
    
    // Start monitoring after page load
    if (document.readyState === 'complete') {
        setTimeout(startTracking, 200);
    } else {
        window.addEventListener('load', function() {
            setTimeout(startTracking, 200);
        });
    }
    
    // Immediately notify parent window of current status
    sendToParent('ready');
})();
`;

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

        let lastKnownUrl = url;
        let isMonitoringScriptInjected = false;
        let injectionRetryCount = 0;
        const maxRetryCount = 10;

        // Create window manager object
        const windowManager: ExternalWindowManager = {
            window: newWindow,
            isClosed: false,
            close: () => {
                if (newWindow && !newWindow.closed && !windowManager.isClosed) {
                    newWindow.close();
                    windowManager.isClosed = true;
                    stopLocalTiming();

                    if (windowManager._cleanup) {
                        windowManager._cleanup();
                    }

                    callbacks.onWindowClosed?.();
                    callbacks.onVisitEnd(false, timeTracker.totalFocusTime);
                }
            }
        };

        // Local timing functions (fallback)
        const startLocalTiming = () => {
            if (!timeTracker.isWindowFocused) {
                console.log('Starting local timing');
                timeTracker.isWindowFocused = true;
                timeTracker.focusStartTime = Date.now();
                callbacks.onVisitStart(true);
            }
        };

        const stopLocalTiming = () => {
            if (timeTracker.isWindowFocused) {
                console.log('Stopping local timing');
                timeTracker.isWindowFocused = false;
                const sessionTime = Date.now() - timeTracker.focusStartTime;
                timeTracker.totalFocusTime += sessionTime;
                callbacks.onVisitEnd(false, timeTracker.totalFocusTime);
            }
        };

        // Handle postMessage from external window
        const handleMessage = (event: MessageEvent) => {
            // Security check: ensure message comes from our opened window
            if (event.source !== newWindow) return;

            if (event.data && event.data.type === 'windowTracking') {
                const { event: eventType, data } = event.data;

                switch (eventType) {
                    case 'ready':
                        console.log('External window is ready for tracking');
                        break;
                    case 'visitStart':
                        console.log('External window visit started');
                        callbacks.onVisitStart(data.visited);
                        break;
                    case 'visitEnd':
                        console.log('External window visit ended, total time:', data.totalTime);
                        timeTracker.totalFocusTime = data.totalTime || 0;
                        callbacks.onVisitEnd(data.visited, data.totalTime);
                        break;
                    case 'beforeRefresh':
                        console.log('External window is about to refresh');
                        callbacks.onWindowRefresh?.(data.totalTime || 0);
                        // Need to re-inject script after refresh
                        isMonitoringScriptInjected = false;
                        injectionRetryCount = 0;
                        break;
                }
            }
        };

        // Inject monitoring script into external window
        const injectMonitoringScript = () => {
            try {
                if (newWindow.closed || windowManager.isClosed) return false;

                // Check if we can access window content (same-origin policy)
                const doc = newWindow.document;
                if (!doc) return false;

                // Create script element and inject
                const script = doc.createElement('script');
                script.textContent = MONITORING_SCRIPT;
                doc.head.appendChild(script);

                console.log('Monitoring script injected successfully');
                isMonitoringScriptInjected = true;
                return true;
            } catch (e) {
                // Cannot inject script into cross-origin window, use fallback
                console.log('Cannot inject script (cross-origin), using fallback:', e);
                return false;
            }
        };

        // Periodically check window status and URL changes
        const monitorWindow = () => {
            try {
                if (newWindow.closed && !windowManager.isClosed) {
                    windowManager.isClosed = true;
                    stopLocalTiming();

                    if (windowManager._cleanup) {
                        windowManager._cleanup();
                    }

                    callbacks.onWindowClosed?.();
                    callbacks.onVisitEnd(false, timeTracker.totalFocusTime);
                    return;
                }

                if (!windowManager.isClosed) {
                    // Check if URL has changed (possibly navigated to new page)
                    try {
                        const currentUrl = newWindow.location.href;
                        if (currentUrl !== lastKnownUrl) {
                            console.log('Window URL changed from', lastKnownUrl, 'to', currentUrl);
                            lastKnownUrl = currentUrl;
                            isMonitoringScriptInjected = false;
                            injectionRetryCount = 0;
                        }
                    } catch (e) {
                        // Cannot access location for cross-origin, this is normal
                    }

                    // If script not injected and retries remaining, attempt injection
                    if (!isMonitoringScriptInjected && injectionRetryCount < maxRetryCount) {
                        injectionRetryCount++;
                        if (injectMonitoringScript()) {
                            // Successfully injected, no need for fallback
                        } else if (injectionRetryCount >= maxRetryCount) {
                            // Multiple injection failures, enable fallback monitoring
                            console.log('Script injection failed, using fallback monitoring');
                            setupFallbackMonitoring();
                        }
                    }

                    setTimeout(monitorWindow, 1000);
                }
            } catch (e) {
                if (!windowManager.isClosed) {
                    windowManager.isClosed = true;
                    stopLocalTiming();
                    callbacks.onWindowClosed?.();
                    callbacks.onVisitEnd(false, timeTracker.totalFocusTime);
                }
            }
        };

        // Fallback monitoring solution (for cross-origin windows)
        const setupFallbackMonitoring = () => {
            const handleParentBlur = () => {
                setTimeout(() => {
                    if (!newWindow.closed) {
                        startLocalTiming();
                    }
                }, 100);
            };

            const handleParentFocus = () => {
                stopLocalTiming();
            };

            window.addEventListener('blur', handleParentBlur);
            window.addEventListener('focus', handleParentFocus);

            // Start timing immediately
            setTimeout(startLocalTiming, 200);

            windowManager._cleanup = () => {
                window.removeEventListener('blur', handleParentBlur);
                window.removeEventListener('focus', handleParentFocus);
                window.removeEventListener('message', handleMessage);
            };
        };

        // Set up postMessage listener
        window.addEventListener('message', handleMessage);

        // Set up cleanup function
        windowManager._cleanup = () => {
            window.removeEventListener('message', handleMessage);
        };

        // Start monitoring
        setTimeout(monitorWindow, 500);

        return windowManager;

    } catch (error) {
        console.error('Error opening external window:', error);
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