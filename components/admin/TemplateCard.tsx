'use client';

import { useState } from 'react';
import Link from 'next/link';
import { toast } from 'sonner';
import { ExternalLinkIcon, CopyIcon, EditIcon, TrashIcon, GlobeIcon, EyeOffIcon } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardFooter } from '@/components/ui/card';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import type { Template } from '@/lib/types';
import { formatDate } from '@/lib/utils';

interface TemplateCardProps {
  template: Template;
  appUrl: string;
  onDelete: (id: string) => void;
  onTogglePublish: (id: string, published: boolean) => void;
}

export function TemplateCard({ template, appUrl, onDelete, onTogglePublish }: TemplateCardProps) {
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [isToggling, setIsToggling] = useState(false);

  const shareUrl = `${appUrl}/t/${template.id}`;

  const copyLink = async () => {
    await navigator.clipboard.writeText(shareUrl);
    toast.success('Link copied to clipboard!');
  };

  const handleDelete = async () => {
    setIsDeleting(true);
    const res = await fetch(`/api/templates/${template.id}`, { method: 'DELETE' });
    if (res.ok) {
      toast.success('Template deleted');
      onDelete(template.id);
    } else {
      toast.error('Failed to delete template');
    }
    setIsDeleting(false);
    setDeleteOpen(false);
  };

  const handleTogglePublish = async () => {
    setIsToggling(true);
    const res = await fetch(`/api/templates/${template.id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ is_published: !template.is_published }),
    });
    if (res.ok) {
      toast.success(template.is_published ? 'Template unpublished' : 'Template published!');
      onTogglePublish(template.id, !template.is_published);
    } else {
      toast.error('Failed to update template');
    }
    setIsToggling(false);
  };

  return (
    <Card className="overflow-hidden self-stretch flex flex-col">
      {/* Overlay preview */}
      <div className="relative aspect-square w-full overflow-hidden bg-muted">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src={template.overlay_image_url} alt={template.name} className="h-full w-full object-cover" />
        <div className="absolute right-2 top-2">
          <Badge variant={template.is_published ? 'default' : 'secondary'}>
            {template.is_published ? 'Published' : 'Draft'}
          </Badge>
        </div>
      </div>

      <CardContent className="p-4 flex-1">
        <h3 className="truncate font-semibold text-foreground">{template.name}</h3>
        {template.description && (
          <p className="mt-0.5 line-clamp-2 text-sm text-muted-foreground">{template.description}</p>
        )}
        <p className="mt-1 text-xs text-muted-foreground">{formatDate(template.created_at)}</p>

        {template.is_published && (
          <div className="mt-3 flex items-center gap-2 rounded-lg bg-muted px-3 py-2">
            <span className="flex-1 truncate text-xs text-muted-foreground">/t/{template.id}</span>
            <button onClick={copyLink} className="shrink-0 text-primary hover:text-primary/80" title="Copy link">
              <CopyIcon className="h-4 w-4" />
            </button>
            <button className="shrink-0 text-primary hover:text-primary/80" title="Copy link">
              <a
                href={shareUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="shrink-0 text-primary hover:text-primary/80"
                title="Open link"
              >
                <ExternalLinkIcon className="h-4 w-4" />
              </a>
            </button>
          </div>
        )}
      </CardContent>

      <CardFooter className="gap-2 border-t p-4 pt-3">
        <Button size="sm" variant="outline" className="flex-1" onClick={handleTogglePublish} disabled={isToggling}>
          {template.is_published ? (
            <>
              <EyeOffIcon className="mr-1.5 h-4 w-4" /> Unpublish
            </>
          ) : (
            <>
              <GlobeIcon className="mr-1.5 h-4 w-4" /> Publish
            </>
          )}
        </Button>

        <Button size="sm" variant="outline" asChild>
          <Link href={`/admin/${template.id}`}>
            <EditIcon className="mr-1.5 h-4 w-4" /> Edit
          </Link>
        </Button>

        <Dialog open={deleteOpen} onOpenChange={setDeleteOpen}>
          <DialogTrigger asChild>
            <Button size="sm" variant="outline">
              <TrashIcon className="h-4 w-4" />
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Delete Template</DialogTitle>
              <DialogDescription>
                Are you sure you want to delete &quot;{template.name}&quot;? This cannot be undone. Anyone with the
                share link will no longer be able to use it.
              </DialogDescription>
            </DialogHeader>
            <DialogFooter>
              <Button variant="outline" onClick={() => setDeleteOpen(false)} disabled={isDeleting}>
                Cancel
              </Button>
              <Button variant="destructive" onClick={handleDelete} disabled={isDeleting}>
                {isDeleting ? 'Deleting…' : 'Delete'}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </CardFooter>
    </Card>
  );
}
