import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { PageLayout } from '@/components/layout/PageLayout';
import { PageHeader } from '@/components/common/PageHeader';
import { CheckCircle, Download, RotateCcw, Settings } from 'lucide-react';
import Link from 'next/link';
import { useRouter } from 'next/router';

export default function CompletedPage() {
    const router = useRouter();
    const { submissionId, totalQuestions } = router.query;
    const [isExporting, setIsExporting] = useState(false);

    const handleExportData = async () => {
        try {
            setIsExporting(true);
            const response = await fetch('/api/questionnaire/export');
            if (response.ok) {
                const blob = await response.blob();
                const url = window.URL.createObjectURL(blob);
                const a = document.createElement('a');
                a.style.display = 'none';
                a.href = url;
                a.download = 'questionnaire-export.json';
                document.body.appendChild(a);
                a.click();
                window.URL.revokeObjectURL(url);
                document.body.removeChild(a);
            } else {
                throw new Error('Failed to export data');
            }
        } catch (error) {
            console.error('Export error:', error);
            // You could add a toast notification here
        } finally {
            setIsExporting(false);
        }
    };

    const handleTakeAnother = () => {
        router.push('/questionnaire');
    };

    const totalEvaluations = totalQuestions ? Number(totalQuestions) * 7 : 0;

    return (
        <PageLayout maxWidth="4xl">
            <PageHeader
                title="Questionnaire Completed!"
                description="Thank you for your valuable feedback"
                icon={<CheckCircle className="h-8 w-8" />}
            >
                <div className="space-y-6">
                    <div className="bg-green-50 dark:bg-green-950 p-6 rounded-lg">
                        <h3 className="font-semibold mb-4">Submission Summary</h3>
                        <div className="grid gap-3 text-sm">
                            <div className="flex justify-between">
                                <span>Questions Completed:</span>
                                <span className="font-medium">{totalQuestions || 0}</span>
                            </div>
                            <div className="flex justify-between">
                                <span>Total Evaluations:</span>
                                <span className="font-medium">{totalEvaluations}</span>
                            </div>
                            {submissionId && (
                                <div className="flex justify-between">
                                    <span>Submission ID:</span>
                                    <code className="font-mono text-xs bg-muted px-2 py-1 rounded">
                                        {submissionId}
                                    </code>
                                </div>
                            )}
                        </div>
                    </div>

                    <div className="flex gap-4 justify-center flex-wrap">
                        <Button
                            variant="outline"
                            onClick={handleExportData}
                            disabled={isExporting}
                            className="flex items-center gap-2"
                        >
                            <Download className="h-4 w-4" />
                            {isExporting ? 'Exporting...' : 'Export Data'}
                        </Button>
                        <Link href="/tools">
                            <Button
                                variant="outline"
                                className="flex items-center gap-2"
                            >
                                <Settings className="h-4 w-4" />
                                Question Tools
                            </Button>
                        </Link>
                        <Button
                            variant="outline"
                            onClick={handleTakeAnother}
                            className="flex items-center gap-2"
                        >
                            <RotateCcw className="h-4 w-4" />
                            Take Another Survey
                        </Button>
                    </div>

                    <div className="flex justify-center mt-6">
                        <Link href="/">
                            <Button>
                                Back to Home
                            </Button>
                        </Link>
                    </div>
                </div>
            </PageHeader>
        </PageLayout>
    );
} 