import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Textarea } from '@/components/ui/textarea';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { PageLayout, PageHeader, LoadingScreen, QuestionListItem } from '@/components';
import {
    Copy,
    Download,
    FileText,
    CheckCircle
} from 'lucide-react';
import { QuestionnaireQuestion } from '@/types/questionnaire';

export default function ToolsPage() {
    const [questions, setQuestions] = useState<QuestionnaireQuestion[]>([]);
    const [loading, setLoading] = useState(true);
    const [baseUrl, setBaseUrl] = useState('');
    const [copySuccess, setCopySuccess] = useState('');

    useEffect(() => {
        setBaseUrl(window.location.origin);
        fetchQuestions();
    }, []);

    const fetchQuestions = async () => {
        try {
            setLoading(true);
            const response = await fetch('/api/questions/list');
            const data = await response.json();

            if (data.success) {
                setQuestions(data.questions);
            }
        } catch (error) {
            console.error('Error fetching questions:', error);
        } finally {
            setLoading(false);
        }
    };

    const copyToClipboard = (text: string, type: string) => {
        navigator.clipboard.writeText(text).then(() => {
            setCopySuccess(type);
            setTimeout(() => setCopySuccess(''), 2000);
        });
    };

    const generateAllLinks = () => {
        return questions.map(q => `${baseUrl}/q/${q.id}`).join('\n');
    };

    const generateMarkdownList = () => {
        return questions.map(q =>
            `${q.id}. [Question ${q.id}](${baseUrl}/q/${q.id}) - ${q.userQuery.substring(0, 50)}${q.userQuery.length > 50 ? '...' : ''}`
        ).join('\n');
    };

    const generateHtmlList = () => {
        const items = questions.map(q =>
            `  <li><a href="${baseUrl}/q/${q.id}" target="_blank">Question ${q.id}</a> - ${q.userQuery.substring(0, 50)}${q.userQuery.length > 50 ? '...' : ''}</li>`
        ).join('\n');

        return `<ul>\n${items}\n</ul>`;
    };

    const generateJsonExport = () => {
        return JSON.stringify({
            baseUrl,
            total: questions.length,
            questions: questions.map(q => ({
                ...q,
                fullUrl: `${baseUrl}/q/${q.id}`
            }))
        }, null, 2);
    };

    const downloadAsFile = (content: string, filename: string, contentType: string = 'text/plain') => {
        const blob = new Blob([content], { type: contentType });
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.style.display = 'none';
        a.href = url;
        a.download = filename;
        document.body.appendChild(a);
        a.click();
        window.URL.revokeObjectURL(url);
        document.body.removeChild(a);
    };

    if (loading) {
        return (
            <PageLayout>
                <LoadingScreen message="Loading questions..." />
            </PageLayout>
        );
    }

    return (
        <PageLayout maxWidth="6xl">
            <PageHeader
                title="Questionnaire Tools"
                description="Generate and manage direct links to all questionnaire questions"
                icon={<FileText className="h-6 w-6" />}
                showBackButton={true}
                badges={[{ text: `${questions.length} Questions` }]}
            />

            {/* Base URL Configuration */}
            <Card>
                <CardHeader>
                    <CardTitle className="text-lg">Base URL Configuration</CardTitle>
                </CardHeader>
                <CardContent>
                    <div className="space-y-3">
                        <Label htmlFor="baseUrl">Base URL for link generation:</Label>
                        <div className="flex gap-2">
                            <Input
                                id="baseUrl"
                                value={baseUrl}
                                onChange={(e) => setBaseUrl(e.target.value)}
                                placeholder="https://your-domain.com"
                                className="font-mono"
                            />
                            <Button
                                variant="outline"
                                onClick={() => setBaseUrl(window.location.origin)}
                            >
                                Reset
                            </Button>
                        </div>
                        <p className="text-sm text-muted-foreground">
                            This URL will be used as the base for all generated links.
                        </p>
                    </div>
                </CardContent>
            </Card>

            {/* Export Tabs */}
            <Card>
                <CardHeader>
                    <CardTitle className="text-lg">Export Options</CardTitle>
                </CardHeader>
                <CardContent>
                    <Tabs defaultValue="links" className="w-full">
                        <TabsList className="grid w-full grid-cols-4">
                            <TabsTrigger value="links">Plain Links</TabsTrigger>
                            <TabsTrigger value="markdown">Markdown</TabsTrigger>
                            <TabsTrigger value="html">HTML</TabsTrigger>
                            <TabsTrigger value="json">JSON</TabsTrigger>
                        </TabsList>

                        <TabsContent value="links" className="space-y-4">
                            <div className="space-y-3">
                                <Label>All question links (one per line):</Label>
                                <Textarea
                                    value={generateAllLinks()}
                                    readOnly
                                    rows={10}
                                    className="font-mono text-sm"
                                />
                                <div className="flex gap-2">
                                    <Button
                                        onClick={() => copyToClipboard(generateAllLinks(), 'links')}
                                        className="flex items-center gap-2"
                                    >
                                        {copySuccess === 'links' ? <CheckCircle className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
                                        {copySuccess === 'links' ? 'Copied!' : 'Copy All Links'}
                                    </Button>
                                    <Button
                                        variant="outline"
                                        onClick={() => downloadAsFile(generateAllLinks(), 'questionnaire-links.txt')}
                                        className="flex items-center gap-2"
                                    >
                                        <Download className="h-4 w-4" />
                                        Download as TXT
                                    </Button>
                                </div>
                            </div>
                        </TabsContent>

                        <TabsContent value="markdown" className="space-y-4">
                            <div className="space-y-3">
                                <Label>Markdown formatted list:</Label>
                                <Textarea
                                    value={generateMarkdownList()}
                                    readOnly
                                    rows={10}
                                    className="font-mono text-sm"
                                />
                                <div className="flex gap-2">
                                    <Button
                                        onClick={() => copyToClipboard(generateMarkdownList(), 'markdown')}
                                        className="flex items-center gap-2"
                                    >
                                        {copySuccess === 'markdown' ? <CheckCircle className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
                                        {copySuccess === 'markdown' ? 'Copied!' : 'Copy Markdown'}
                                    </Button>
                                    <Button
                                        variant="outline"
                                        onClick={() => downloadAsFile(generateMarkdownList(), 'questionnaire-links.md')}
                                        className="flex items-center gap-2"
                                    >
                                        <Download className="h-4 w-4" />
                                        Download as MD
                                    </Button>
                                </div>
                            </div>
                        </TabsContent>

                        <TabsContent value="html" className="space-y-4">
                            <div className="space-y-3">
                                <Label>HTML unordered list:</Label>
                                <Textarea
                                    value={generateHtmlList()}
                                    readOnly
                                    rows={10}
                                    className="font-mono text-sm"
                                />
                                <div className="flex gap-2">
                                    <Button
                                        onClick={() => copyToClipboard(generateHtmlList(), 'html')}
                                        className="flex items-center gap-2"
                                    >
                                        {copySuccess === 'html' ? <CheckCircle className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
                                        {copySuccess === 'html' ? 'Copied!' : 'Copy HTML'}
                                    </Button>
                                    <Button
                                        variant="outline"
                                        onClick={() => downloadAsFile(generateHtmlList(), 'questionnaire-links.html', 'text/html')}
                                        className="flex items-center gap-2"
                                    >
                                        <Download className="h-4 w-4" />
                                        Download as HTML
                                    </Button>
                                </div>
                            </div>
                        </TabsContent>

                        <TabsContent value="json" className="space-y-4">
                            <div className="space-y-3">
                                <Label>JSON export with full data:</Label>
                                <Textarea
                                    value={generateJsonExport()}
                                    readOnly
                                    rows={10}
                                    className="font-mono text-sm"
                                />
                                <div className="flex gap-2">
                                    <Button
                                        onClick={() => copyToClipboard(generateJsonExport(), 'json')}
                                        className="flex items-center gap-2"
                                    >
                                        {copySuccess === 'json' ? <CheckCircle className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
                                        {copySuccess === 'json' ? 'Copied!' : 'Copy JSON'}
                                    </Button>
                                    <Button
                                        variant="outline"
                                        onClick={() => downloadAsFile(generateJsonExport(), 'questionnaire-data.json', 'application/json')}
                                        className="flex items-center gap-2"
                                    >
                                        <Download className="h-4 w-4" />
                                        Download as JSON
                                    </Button>
                                </div>
                            </div>
                        </TabsContent>
                    </Tabs>
                </CardContent>
            </Card>

            {/* Individual Question Links */}
            <Card>
                <CardHeader>
                    <CardTitle className="text-lg">Individual Question Access</CardTitle>
                </CardHeader>
                <CardContent>
                    <div className="space-y-3">
                        {questions.map((question) => (
                            <QuestionListItem
                                key={question.id}
                                question={question}
                                copySuccess={copySuccess === `q-${question.id}`}
                                showBadges={false}
                                showDescription={true}
                                maxDescriptionLength={100}
                            />
                        ))}
                    </div>
                </CardContent>
            </Card>
        </PageLayout>
    );
} 