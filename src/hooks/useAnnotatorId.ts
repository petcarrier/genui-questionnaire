import { useState, useEffect } from 'react';

export const useAnnotatorId = () => {
    const [annotatorId, setAnnotatorId] = useState<string>('');
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        // 只在客户端运行
        if (typeof window !== 'undefined') {
            const storedId = sessionStorage.getItem('annotatorId');
            if (storedId) {
                setAnnotatorId(storedId);
            }
            setIsLoading(false);
        }
    }, []);

    const updateAnnotatorId = (newId: string) => {
        setAnnotatorId(newId);
        if (typeof window !== 'undefined') {
            sessionStorage.setItem('annotatorId', newId);
        }
    };

    return {
        annotatorId,
        updateAnnotatorId,
        isLoading
    };
}; 