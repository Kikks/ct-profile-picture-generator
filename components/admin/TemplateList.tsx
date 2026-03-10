'use client';

import { useState } from 'react';
import Link from 'next/link';
import { PlusIcon, LayoutTemplateIcon } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { TemplateCard } from './TemplateCard';
import type { Template } from '@/lib/types';

interface TemplateListProps {
  initialTemplates: Template[];
  appUrl: string;
}

export function TemplateList({ initialTemplates, appUrl }: TemplateListProps) {
  const [templates, setTemplates] = useState(initialTemplates);

  const handleDelete = (id: string) => {
    setTemplates((prev) => prev.filter((t) => t.id !== id));
  };

  const handleTogglePublish = (id: string, published: boolean) => {
    setTemplates((prev) => prev.map((t) => (t.id === id ? { ...t, is_published: published } : t)));
  };

  if (templates.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center rounded-xl border-2 border-dashed border-border py-20 text-center">
        <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-muted">
          <LayoutTemplateIcon className="h-8 w-8 text-muted-foreground" />
        </div>
        <h3 className="text-lg font-semibold">No templates yet</h3>
        <p className="mt-1 max-w-xs text-sm text-muted-foreground">
          Create your first template and share it with your congregation.
        </p>
        <Button asChild className="mt-6">
          <Link href="/admin/create">
            <PlusIcon className="mr-2 h-4 w-4" /> Create Template
          </Link>
        </Button>
      </div>
    );
  }

  return (
    <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
      {templates.map((template) => (
        <TemplateCard
          key={template.id}
          template={template}
          appUrl={appUrl}
          onDelete={handleDelete}
          onTogglePublish={handleTogglePublish}
        />
      ))}
    </div>
  );
}
