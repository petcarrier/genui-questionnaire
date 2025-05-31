import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent } from '@/components/ui/card';
import { RefreshCw } from 'lucide-react';

interface SimpleCaptchaProps {
    onVerify: (isValid: boolean, token: string) => void;
    className?: string;
}

export function SimpleCaptcha({ onVerify, className }: SimpleCaptchaProps) {
    const [num1, setNum1] = useState(0);
    const [num2, setNum2] = useState(0);
    const [userAnswer, setUserAnswer] = useState('');
    const [isVerified, setIsVerified] = useState(false);

    const generateNewChallenge = () => {
        const newNum1 = Math.floor(Math.random() * 10) + 1;
        const newNum2 = Math.floor(Math.random() * 10) + 1;
        setNum1(newNum1);
        setNum2(newNum2);
        setUserAnswer('');
        setIsVerified(false);
        onVerify(false, '');
    };

    useEffect(() => {
        generateNewChallenge();
    }, []);

    const handleVerify = () => {
        const correctAnswer = num1 + num2;
        const isCorrect = parseInt(userAnswer) === correctAnswer;
        setIsVerified(isCorrect);

        if (isCorrect) {
            // Generate a simple token based on the challenge
            const token = btoa(`${num1}+${num2}=${correctAnswer}:${Date.now()}`);
            onVerify(true, token);
        } else {
            onVerify(false, '');
        }
    };

    const handleRefresh = () => {
        generateNewChallenge();
    };

    return (
        <Card className={className}>
            <CardContent className="pt-6">
                <div className="space-y-4">
                    <Label htmlFor="captcha">Verification Required</Label>
                    <div className="flex items-center gap-4">
                        <div className="text-lg font-mono bg-muted p-3 rounded border-2 border-dashed">
                            {num1} + {num2} = ?
                        </div>
                        <Button
                            type="button"
                            variant="outline"
                            size="sm"
                            onClick={handleRefresh}
                            className="shrink-0"
                        >
                            <RefreshCw className="h-4 w-4" />
                        </Button>
                    </div>

                    <div className="flex gap-2">
                        <Input
                            id="captcha"
                            type="number"
                            value={userAnswer}
                            onChange={(e) => setUserAnswer(e.target.value)}
                            placeholder="Enter answer"
                            className="w-32"
                            disabled={isVerified}
                        />
                        <Button
                            type="button"
                            onClick={handleVerify}
                            disabled={!userAnswer || isVerified}
                            variant={isVerified ? "default" : "outline"}
                        >
                            {isVerified ? "✓ Verified" : "Verify"}
                        </Button>
                    </div>

                    {isVerified && (
                        <p className="text-sm text-green-600 dark:text-green-400">
                            ✓ Verification successful
                        </p>
                    )}
                </div>
            </CardContent>
        </Card>
    );
} 