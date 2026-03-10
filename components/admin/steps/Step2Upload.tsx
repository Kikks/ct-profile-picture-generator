'use client'

import { useState } from 'react'
import { toast } from 'sonner'
import { Button } from '@/components/ui/button'
import { ImageUploader } from '@/components/shared/ImageUploader'
import { CheckCircleIcon } from 'lucide-react'

interface Step2UploadProps {
  existingUrl?: string
  onNext: (url: string) => void
  onBack: () => void
}

export function Step2Upload({ existingUrl, onNext, onBack }: Step2UploadProps) {
  const [uploading, setUploading] = useState(false)
  const [uploadedUrl, setUploadedUrl] = useState<string | null>(existingUrl ?? null)

  const handleFile = async (file: File) => {
    setUploading(true)
    const formData = new FormData()
    formData.append('file', file)

    const res = await fetch('/api/upload', { method: 'POST', body: formData })

    if (res.ok) {
      const { url } = await res.json()
      setUploadedUrl(url)
      toast.success('Image uploaded!')
    } else {
      const { error } = await res.json().catch(() => ({ error: 'Upload failed' }))
      toast.error(error ?? 'Upload failed. Please try again.')
    }
    setUploading(false)
  }

  return (
    <div className="space-y-6">
      <div className="space-y-2">
        <p className="text-sm text-muted-foreground">
          Upload your church design, frame, or overlay image. This will appear on top of (or behind) the member&apos;s
          photo.
        </p>
      </div>

      {uploadedUrl ? (
        <div className="space-y-4">
          <div className="overflow-hidden rounded-xl border border-border">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={uploadedUrl}
              alt="Uploaded overlay"
              className="w-full object-contain"
              style={{ maxHeight: 320 }}
            />
          </div>
          <div className="flex items-center gap-2 rounded-lg bg-green-50 p-3 text-green-700 dark:bg-green-950 dark:text-green-300">
            <CheckCircleIcon className="h-5 w-5 flex-shrink-0" />
            <span className="text-sm font-medium">Image uploaded successfully</span>
          </div>
          <button
            type="button"
            onClick={() => setUploadedUrl(null)}
            className="text-sm text-primary underline-offset-4 hover:underline"
          >
            Replace image
          </button>
        </div>
      ) : (
        <ImageUploader
          onFileAccepted={handleFile}
          label={uploading ? 'Uploading…' : 'Upload Overlay Image'}
          hint="Drag & drop your design here, or tap to browse"
          disabled={uploading}
        />
      )}

      <div className="flex gap-3">
        <Button variant="outline" onClick={onBack} className="flex-1">
          Back
        </Button>
        <Button
          onClick={() => uploadedUrl && onNext(uploadedUrl)}
          disabled={!uploadedUrl || uploading}
          className="flex-1"
        >
          Continue
        </Button>
      </div>
    </div>
  )
}
