import { useState, useEffect, useCallback } from 'react';

export interface EnhancedPageVisitStatus {
    [linkId: string]: {
        visited: boolean;
        duration: number;
        lastVisited?: number;
        visitCount: number;
        startTime?: number;
        isCurrentlyViewing: boolean;
        sessionStartTime?: number;
    };
}

interface UsePageVisitTrackingResult {
    pageVisitStatus: EnhancedPageVisitStatus;
    setPageVisitStatus: React.Dispatch<React.SetStateAction<EnhancedPageVisitStatus>>;
    handlePageVisit: (linkId: string, visited: boolean, duration?: number) => void;
    getVisitStatusForLink: (linkId: string) => {
        visited: boolean;
        duration: number;
        visitCount: number;
        isCurrentlyViewing: boolean;
    };
}

export function usePageVisitTracking(
    initialStatus: EnhancedPageVisitStatus = {}
): UsePageVisitTrackingResult {
    const [pageVisitStatus, setPageVisitStatus] = useState<EnhancedPageVisitStatus>(initialStatus);

    // Real-time timer for updating visit durations
    useEffect(() => {
        const interval = setInterval(() => {
            setPageVisitStatus(prev => {
                const hasActiveViewing = Object.values(prev).some(status => status.isCurrentlyViewing);
                if (!hasActiveViewing) return prev;

                // Force a re-render to update display times
                return { ...prev };
            });
        }, 1000); // Update every second

        return () => clearInterval(interval);
    }, []);

    // Cleanup effect to handle component unmount
    useEffect(() => {
        return () => {
            // End all active viewing sessions when component unmounts
            setPageVisitStatus(prev => {
                const now = Date.now();
                const updated = { ...prev };
                let hasChanges = false;

                Object.keys(updated).forEach(linkId => {
                    const status = updated[linkId];
                    if (status.isCurrentlyViewing && status.startTime) {
                        const sessionDuration = now - status.startTime;
                        updated[linkId] = {
                            ...status,
                            duration: status.duration + sessionDuration,
                            startTime: undefined,
                            isCurrentlyViewing: false,
                            lastVisited: now,
                            sessionStartTime: status.sessionStartTime
                        };
                        hasChanges = true;
                    }
                });

                return hasChanges ? updated : prev;
            });
        };
    }, []);

    const handlePageVisit = useCallback((linkId: string, visited: boolean, duration?: number) => {
        const now = Date.now();
        setPageVisitStatus(prev => {
            const currentStatus = prev[linkId] || {
                visited: false,
                duration: 0,
                visitCount: 0,
                isCurrentlyViewing: false
            };

            let newStatus = { ...currentStatus };

            if (visited) {
                // Start viewing
                if (!currentStatus.isCurrentlyViewing) {
                    newStatus.startTime = now;
                    newStatus.isCurrentlyViewing = true;
                    newStatus.visitCount = currentStatus.visitCount + 1;
                    newStatus.visited = true;

                    // Record first viewing time
                    if (!currentStatus.sessionStartTime) {
                        newStatus.sessionStartTime = now;
                    }
                }
            } else {
                // Stop viewing
                if (currentStatus.isCurrentlyViewing && currentStatus.startTime) {
                    const sessionDuration = now - currentStatus.startTime;
                    newStatus.duration = currentStatus.duration + sessionDuration;
                    newStatus.startTime = undefined;
                    newStatus.isCurrentlyViewing = false;
                    newStatus.lastVisited = now;
                }
            }

            return {
                ...prev,
                [linkId]: newStatus
            };
        });
    }, []);

    const getVisitStatusForLink = useCallback((linkId: string) => {
        const status = pageVisitStatus[linkId];
        if (!status) {
            return { visited: false, duration: 0, visitCount: 0, isCurrentlyViewing: false };
        }

        // Calculate current duration if currently viewing
        let currentDuration = status.duration;
        if (status.isCurrentlyViewing && status.startTime) {
            currentDuration += Date.now() - status.startTime;
        }

        return {
            visited: status.visited,
            duration: currentDuration,
            visitCount: status.visitCount,
            isCurrentlyViewing: status.isCurrentlyViewing
        };
    }, [pageVisitStatus]);

    return {
        pageVisitStatus,
        setPageVisitStatus,
        handlePageVisit,
        getVisitStatusForLink
    };
} 