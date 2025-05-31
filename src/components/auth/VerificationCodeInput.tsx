import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { CheckCircle, AlertCircle, Key } from 'lucide-react';

interface VerificationCodeInputProps {
    linkId: string;
    linkTitle: string;
    expectedCode?: string;
    placeholder?: string;
    onCodeValidation: (linkId: string, isValid: boolean, enteredCode: string) => void;
    color: 'blue' | 'green';
}

export function VerificationCodeInput({
    linkId,
    linkTitle,
    expectedCode,
    placeholder = "Enter verification code",
    onCodeValidation,
    color
}: VerificationCodeInputProps) {
    const [enteredCode, setEnteredCode] = useState('');
    const [isValid, setIsValid] = useState<boolean | null>(null);
    const [hasAttempted, setHasAttempted] = useState(false);

    const colorClasses = {
        blue: {
            badge: 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200',
            border: 'border-blue-200 dark:border-blue-800',
            success: 'border-green-200 bg-green-50 dark:border-green-800 dark:bg-green-950',
            error: 'border-red-200 bg-red-50 dark:border-red-800 dark:bg-red-950'
        },
        green: {
            badge: 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200',
            border: 'border-green-200 dark:border-green-800',
            success: 'border-green-200 bg-green-50 dark:border-green-800 dark:bg-green-950',
            error: 'border-red-200 bg-red-50 dark:border-red-800 dark:bg-red-950'
        }
    };

    const validateCode = (code: string) => {
        if (!expectedCode) return null;

        // Clean input and expected code (remove spaces, normalize case)
        const cleanInput = code.trim().toLowerCase();
        const cleanExpected = expectedCode.trim().toLowerCase();

        return cleanInput === cleanExpected;
    };

    useEffect(() => {
        if (enteredCode.length > 0) {
            setHasAttempted(true);
            const valid = validateCode(enteredCode);
            setIsValid(valid);

            if (valid !== null) {
                onCodeValidation(linkId, valid, enteredCode);
            }
        } else {
            setIsValid(null);
            if (hasAttempted) {
                onCodeValidation(linkId, false, enteredCode);
            }
        }
    }, [enteredCode, expectedCode, linkId, onCodeValidation, hasAttempted]);

    const getCardClassName = () => {
        const base = `w-full ${colorClasses[color].border}`;
        if (isValid === true) {
            return `${base} ${colorClasses[color].success}`;
        } else if (isValid === false && hasAttempted) {
            return `${base} ${colorClasses[color].error}`;
        }
        return base;
    };

    const getStatusIcon = () => {
        if (isValid === true) {
            return <CheckCircle className="h-4 w-4 text-green-600" />;
        } else if (isValid === false && hasAttempted) {
            return <AlertCircle className="h-4 w-4 text-red-600" />;
        }
        return <Key className="h-4 w-4 text-gray-400" />;
    };

    const getStatusMessage = () => {
        if (isValid === true) {
            return {
                type: 'success' as const,
                message: '✓ Verification code is correct! You have successfully viewed this webpage.'
            };
        } else if (isValid === false && hasAttempted) {
            return {
                type: 'error' as const,
                message: 'Verification code is incorrect. Please check the verification code on the webpage and re-enter it.'
            };
        }
        return null;
    };

    const statusMessage = getStatusMessage();

    return (
        <Card className={getCardClassName()}>
            <CardHeader className="pb-3">
                <div className="flex items-center gap-2">
                    <Badge variant="secondary" className={colorClasses[color].badge}>
                        Verification
                    </Badge>
                    <CardTitle className="text-sm">{linkTitle} - Verification Code</CardTitle>
                    {getStatusIcon()}
                </div>
            </CardHeader>
            <CardContent className="space-y-3">
                <div className="space-y-2">
                    <Label htmlFor={`code-${linkId}`} className="text-sm">
                        Enter the verification code found on the webpage
                    </Label>
                    <Input
                        id={`code-${linkId}`}
                        type="text"
                        placeholder={placeholder}
                        value={enteredCode}
                        onChange={(e) => setEnteredCode(e.target.value)}
                        className={isValid === true ? 'border-green-300' : isValid === false && hasAttempted ? 'border-red-300' : ''}
                    />
                </div>

                {statusMessage && (
                    <Alert variant={statusMessage.type === 'error' ? 'destructive' : 'default'}>
                        {statusMessage.type === 'error' ? (
                            <AlertCircle className="h-4 w-4" />
                        ) : (
                            <CheckCircle className="h-4 w-4" />
                        )}
                        <AlertDescription className="text-xs">
                            {statusMessage.message}
                        </AlertDescription>
                    </Alert>
                )}

                <p className="text-xs text-muted-foreground">
                    Note: Verification codes are usually found in a prominent location on the webpage, possibly a string of numbers, letters, or a combination.
                </p>
            </CardContent>
        </Card>
    );
} 