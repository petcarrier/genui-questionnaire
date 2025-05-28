import React, { useState } from 'react';
import { Geist, Geist_Mono } from "next/font/google";
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import { QuestionnaireForm } from '@/components/QuestionnaireForm';
import { QUESTIONNAIRE_QUESTIONS } from '@/data/questionnaireData';
import { QuestionnaireResponse } from '@/types/questionnaire';
import { CheckCircle, RotateCcw, FileText, Download } from 'lucide-react';

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

type AppState = 'welcome' | 'questionnaire' | 'completed' | 'error';

export default function Home() {
  const [currentState, setCurrentState] = useState<AppState>('welcome');
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [submissions, setSubmissions] = useState<QuestionnaireResponse[]>([]);
  const [submissionId, setSubmissionId] = useState<string>('');
  const [error, setError] = useState<string>('');

  const handleStartQuestionnaire = () => {
    setCurrentState('questionnaire');
    setCurrentQuestionIndex(0);
    setSubmissions([]);
    setError('');
  };

  const handleSubmitResponse = async (response: QuestionnaireResponse) => {
    try {
      const apiResponse = await fetch('/api/questionnaire/submit', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ response }),
      });

      const result = await apiResponse.json();

      if (!result.success) {
        throw new Error(result.message);
      }

      setSubmissions(prev => [...prev, response]);
      setSubmissionId(result.submissionId);

      // Check if there are more questions
      if (currentQuestionIndex < QUESTIONNAIRE_QUESTIONS.length - 1) {
        setCurrentQuestionIndex(prev => prev + 1);
      } else {
        setCurrentState('completed');
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to submit response');
      setCurrentState('error');
    }
  };

  const handleRestart = () => {
    setCurrentState('welcome');
    setCurrentQuestionIndex(0);
    setSubmissions([]);
    setSubmissionId('');
    setError('');
  };

  const handleExportData = async () => {
    try {
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
      setError('Failed to export data');
    }
  };

  const renderWelcomeScreen = () => (
    <div className="max-w-4xl mx-auto text-center space-y-8">
      <Card>
        <CardHeader>
          <CardTitle className="text-3xl flex items-center justify-center gap-3">
            <FileText className="h-8 w-8" />
            Website Comparison Questionnaire
          </CardTitle>
          <p className="text-xl text-muted-foreground">
            Help us evaluate website performance across multiple dimensions
          </p>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="grid gap-4 text-left">
            <div className="bg-muted p-4 rounded-lg">
              <h3 className="font-semibold mb-2">What you'll be doing:</h3>
              <ul className="list-disc list-inside space-y-1 text-sm">
                <li>Compare pairs of websites across 7 key dimensions</li>
                <li>Evaluate usability, design, performance, content quality, and more</li>
                <li>Choose an overall winner for each comparison</li>
                <li>Complete a verification captcha for each submission</li>
              </ul>
            </div>

            <div className="flex justify-center gap-4">
              <Badge variant="outline" className="text-sm py-2 px-4">
                {QUESTIONNAIRE_QUESTIONS.length} Questions
              </Badge>
              <Badge variant="outline" className="text-sm py-2 px-4">
                ~5 minutes
              </Badge>
              <Badge variant="outline" className="text-sm py-2 px-4">
                7 Dimensions each
              </Badge>
            </div>
          </div>

          <div className="flex gap-4 justify-center">
            <Button
              size="lg"
              onClick={handleStartQuestionnaire}
            >
              Start Questionnaire
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );

  const renderQuestionnaireScreen = () => {
    const currentQuestion = QUESTIONNAIRE_QUESTIONS[currentQuestionIndex];
    const progress = ((currentQuestionIndex + 1) / QUESTIONNAIRE_QUESTIONS.length) * 100;

    return (
      <div className="max-w-7xl mx-auto space-y-6">
        {/* Progress Header */}
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between text-sm mb-2">
              <span>Question {currentQuestionIndex + 1} of {QUESTIONNAIRE_QUESTIONS.length}</span>
              <span>{Math.round(progress)}% Complete</span>
            </div>
            <div className="w-full bg-muted rounded-full h-2">
              <div
                className="bg-primary h-2 rounded-full transition-all"
                style={{ width: `${progress}%` }}
              />
            </div>
          </CardContent>
        </Card>

        <QuestionnaireForm
          question={currentQuestion}
          onSubmit={handleSubmitResponse}
          showNextButton={currentQuestionIndex < QUESTIONNAIRE_QUESTIONS.length - 1}
        />
      </div>
    );
  };

  const renderCompletedScreen = () => (
    <div className="max-w-4xl mx-auto text-center space-y-8">
      <Card>
        <CardHeader>
          <CardTitle className="text-3xl flex items-center justify-center gap-3 text-green-600">
            <CheckCircle className="h-8 w-8" />
            Questionnaire Completed!
          </CardTitle>
          <p className="text-xl text-muted-foreground">
            Thank you for your valuable feedback
          </p>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="bg-green-50 dark:bg-green-950 p-6 rounded-lg">
            <h3 className="font-semibold mb-4">Submission Summary</h3>
            <div className="grid gap-3 text-sm">
              <div className="flex justify-between">
                <span>Questions Completed:</span>
                <span className="font-medium">{submissions.length}</span>
              </div>
              <div className="flex justify-between">
                <span>Total Evaluations:</span>
                <span className="font-medium">{submissions.length * 7}</span>
              </div>
              <div className="flex justify-between">
                <span>Submission ID:</span>
                <code className="font-mono text-xs bg-muted px-2 py-1 rounded">
                  {submissionId}
                </code>
              </div>
            </div>
          </div>

          <div className="flex gap-4 justify-center">
            <Button
              variant="outline"
              onClick={handleExportData}
              className="flex items-center gap-2"
            >
              <Download className="h-4 w-4" />
              Export Data
            </Button>
            <Button
              variant="outline"
              onClick={handleRestart}
              className="flex items-center gap-2"
            >
              <RotateCcw className="h-4 w-4" />
              Take Another Survey
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );

  const renderErrorScreen = () => (
    <div className="max-w-4xl mx-auto text-center space-y-8">
      <Alert variant="destructive">
        <AlertDescription className="text-center">
          <strong>Error:</strong> {error}
        </AlertDescription>
      </Alert>

      <div className="flex gap-4 justify-center">
        <Button
          variant="outline"
          onClick={() => setCurrentState('questionnaire')}
        >
          Try Again
        </Button>
        <Button
          variant="outline"
          onClick={handleRestart}
        >
          Start Over
        </Button>
      </div>
    </div>
  );

  return (
    <div className={`${geistSans.className} ${geistMono.className} min-h-screen bg-background p-4 sm:p-6 lg:p-8`}>
      <div className="container mx-auto py-8">
        {currentState === 'welcome' && renderWelcomeScreen()}
        {currentState === 'questionnaire' && renderQuestionnaireScreen()}
        {currentState === 'completed' && renderCompletedScreen()}
        {currentState === 'error' && renderErrorScreen()}
      </div>
    </div>
  );
}
