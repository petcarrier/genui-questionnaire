import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { PageLayout } from '@/components/layout/PageLayout';
import { PageHeader } from '@/components/common/PageHeader';
import { QUESTIONNAIRE_QUESTIONS } from '@/data/questionnaireData';
import { FileText, List, ExternalLink } from 'lucide-react';
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
        title="Website Comparison Questionnaire"
        description="Help us evaluate website performance across multiple dimensions"
        icon={<FileText className="h-8 w-8" />}
      >
        <div className="space-y-6">
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
            <Link href="/questions">
              <Button
                size="lg"
                variant="outline"
                className="flex items-center gap-2"
              >
                <List className="h-4 w-4" />
                Browse Individual Questions
              </Button>
            </Link>
          </div>

          {/* Quick access section */}
          <div className="mt-8 p-4 bg-blue-50 dark:bg-blue-950 rounded-lg">
            <h3 className="font-semibold mb-2 flex items-center gap-2">
              <ExternalLink className="h-4 w-4" />
              Direct Access
            </h3>
            <p className="text-sm text-muted-foreground mb-3">
              You can access any specific question directly using URLs like:
            </p>
            <code className="text-xs font-mono bg-background p-2 rounded border block">
              {origin}/q/[question-uuid]
            </code>
            <p className="text-xs text-muted-foreground mt-2">
              Each question has a unique UUID that can be shared directly.
            </p>
          </div>
        </div>
      </PageHeader>
    </PageLayout>
  );
}
