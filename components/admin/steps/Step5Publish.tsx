'use client';

import { useState } from 'react';
import Link from 'next/link';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { CopyIcon, ExternalLinkIcon, CheckCircle2Icon } from 'lucide-react';

interface Step5PublishProps {
  templateId: string;
  appUrl: string;
  isPublished: boolean;
  onTogglePublish: (published: boolean) => void;
}

export function Step5Publish({ templateId, appUrl, isPublished, onTogglePublish }: Step5PublishProps) {
  const [copied, setCopied] = useState(false);
  const [isToggling, setIsToggling] = useState(false);

  const shareUrl = `${appUrl}/t/${templateId}`;

  const copyLink = async () => {
    await navigator.clipboard.writeText(shareUrl);
    setCopied(true);
    toast.success('Link copied!');
    setTimeout(() => setCopied(false), 2000);
  };

  const handleToggle = async (val: boolean) => {
    setIsToggling(true);
    const res = await fetch(`/api/templates/${templateId}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ is_published: val }),
    });
    if (res.ok) {
      onTogglePublish(val);
      toast.success(val ? 'Template published! Share the link below.' : 'Template unpublished.');
    } else {
      toast.error('Failed to update publish status.');
    }
    setIsToggling(false);
  };

  return (
    <div className="space-y-6">
      {/* Success banner */}
      <div className="flex items-center gap-3 rounded-xl bg-green-50 p-4 dark:bg-green-950">
        <CheckCircle2Icon className="h-8 w-8 shrink-0 text-green-600 dark:text-green-400" />
        <div>
          <p className="font-semibold text-green-800 dark:text-green-200">Template saved!</p>
          <p className="text-sm text-green-700 dark:text-green-300">
            Your template is ready. Publish it to generate a shareable link.
          </p>
        </div>
      </div>

      {/* Publish toggle */}
      <div className="flex items-center justify-between rounded-xl border border-border p-4">
        <div>
          <Label htmlFor="publish-toggle" className="text-base font-semibold">
            Published
          </Label>
          <p className="text-sm text-muted-foreground">
            {isPublished
              ? 'Members can access this template via the share link'
              : 'Template is private — publish to share with members'}
          </p>
        </div>
        <Switch id="publish-toggle" checked={isPublished} onCheckedChange={handleToggle} disabled={isToggling} />
      </div>

      {/* Share link */}
      {isPublished && (
        <div className="w-full space-y-3">
          <Label className="text-sm font-medium">Share Link</Label>
          <div className="flex w-full items-stretch gap-2">
            <div className="flex flex-1 items-center rounded-lg border border-border bg-muted px-3 py-2 text-sm overflow-x-hidden">
              <span className="line-clamp-1 truncate text-muted-foreground">{shareUrl}</span>
            </div>
            <Button variant="outline" size="sm" onClick={copyLink} className="shrink-0 gap-1.5">
              {copied ? <CheckCircle2Icon className="h-4 w-4 text-green-600" /> : <CopyIcon className="h-4 w-4" />}
              {copied ? 'Copied!' : 'Copy'}
            </Button>
            <Button variant="outline" size="sm" asChild className="shrink-0">
              <Link href={shareUrl} target="_blank" rel="noopener noreferrer">
                <ExternalLinkIcon className="h-4 w-4" />
              </Link>
            </Button>
          </div>
          <p className="text-xs text-muted-foreground">
            Share this link with your congregation via WhatsApp, email, or your church bulletin.
          </p>
        </div>
      )}

      <div className="flex gap-3">
        <Button variant="outline" asChild className="flex-1">
          <Link href="/admin">View All Templates</Link>
        </Button>

        {isPublished ? (
          <Button asChild className="flex-1">
            <Link href={shareUrl} target="_blank" rel="noopener noreferrer">
              <ExternalLinkIcon className="mr-2 h-4 w-4" />
              Try It Out
            </Link>
          </Button>
        ) : (
          <Button variant="outline" asChild className="flex-1">
            <button onClick={() => toast.info('Publish the template first to see it.')}>Try It Out</button>
          </Button>
        )}
      </div>
    </div>
  );
}
