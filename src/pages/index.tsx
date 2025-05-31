import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { PageLayout, PageHeader } from '@/components';
import { QUESTIONNAIRE_QUESTIONS, TRAP_QUESTIONS } from '@/data/questionnaireData';
import { FileText, List, ExternalLink, Sparkles, Play } from 'lucide-react';
import Link from 'next/link';
import { useRouter } from 'next/router';

export default function Home() {
  const [origin, setOrigin] = useState<string>('https://localhost:3000');
  const router = useRouter();

  useEffect(() => {
    if (typeof window !== 'undefined') {
      setOrigin(window.location.origin);
    }
  }, []);

  return (
    <PageLayout maxWidth="4xl">
      <PageHeader
        title="User Interface Evaluation Survey System"
        description="Participate in our user interface evaluation research to help improve digital product design"
        icon={<FileText className="h-8 w-8" />}
      >
        <div className="space-y-8">
          {/* Main action area */}
          <div className="grid md:grid-cols-2 gap-6">
            {/* Start new survey */}
            <Card className="border-2 border-primary/20 bg-primary/5">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Sparkles className="h-5 w-5 text-primary" />
                  Start New Survey
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <p className="text-muted-foreground">
                  Participate in a complete survey evaluation with 6 normal questions and 2 quality control questions,
                  randomly combined to generate a unique evaluation experience.
                </p>

                <div className="space-y-2">
                  <div className="flex justify-between text-sm">
                    <span>Questions:</span>
                    <Badge variant="secondary">8 questions (6+2)</Badge>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span>Estimated time:</span>
                    <Badge variant="secondary">15-20 minutes</Badge>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span>Evaluation dimensions:</span>
                    <Badge variant="secondary">7 dimensions</Badge>
                  </div>
                </div>

                <Link href="/">
                  <Button size="lg" className="w-full">
                    <Play className="h-4 w-4 mr-2" />
                    Start Survey
                  </Button>
                </Link>
              </CardContent>
            </Card>

            {/* Browse individual questions */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <List className="h-5 w-5" />
                  Browse Individual Questions
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <p className="text-muted-foreground">
                  View all available questions, select specific questions for evaluation,
                  suitable for researchers and users who need specific assessments.
                </p>

                <div className="space-y-2">
                  <div className="flex justify-between text-sm">
                    <span>Normal questions:</span>
                    <Badge variant="outline">{QUESTIONNAIRE_QUESTIONS.length} questions</Badge>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span>Quality control questions:</span>
                    <Badge variant="outline">{TRAP_QUESTIONS.length} questions</Badge>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span>Access method:</span>
                    <Badge variant="outline">Direct link</Badge>
                  </div>
                </div>

                <Link href="/">
                  <Button variant="outline" size="lg" className="w-full">
                    <List className="h-4 w-4 mr-2" />
                    Browse Question List
                  </Button>
                </Link>
              </CardContent>
            </Card>
          </div>

          {/* System description */}
          <div className="grid gap-4 text-left">
            <Card>
              <CardHeader>
                <CardTitle>Evaluation Content</CardTitle>
              </CardHeader>
              <CardContent>
                <ul className="list-disc list-inside space-y-2 text-sm">
                  <li>Compare paired website interfaces across 7 key dimensions</li>
                  <li>Evaluate usability, design aesthetics, task efficiency, information clarity, and more</li>
                  <li>Select an overall winner for each comparison</li>
                  <li>Complete captcha verification to ensure data quality</li>
                  <li>System includes quality control questions to verify evaluator attention</li>
                </ul>
              </CardContent>
            </Card>
          </div>
        </div>
      </PageHeader>
    </PageLayout>
  );
}
