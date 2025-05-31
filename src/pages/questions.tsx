import React from 'react';
import { Button } from '@/components/ui/button';
import { PageLayout, PageHeader, QuestionListItem } from '@/components';
import { QUESTIONNAIRE_QUESTIONS } from '@/data/questionnaireData';
import { List } from 'lucide-react';
import Link from 'next/link';

export default function QuestionsPage() {
    return (
        <PageLayout maxWidth="6xl">
            <PageHeader
                title="All Questions - Direct Links"
                description="Access any specific question directly using these links"
                icon={<List className="h-6 w-6" />}
            >
                <div className="grid gap-4">
                    {QUESTIONNAIRE_QUESTIONS.map((question, index) => (
                        <QuestionListItem
                            key={question.id}
                            question={question}
                        />
                    ))}
                </div>

                <div className="flex justify-center mt-6">
                    <Link href="/">
                        <Button variant="outline">
                            Back to Welcome
                        </Button>
                    </Link>
                </div>
            </PageHeader>
        </PageLayout>
    );
} 