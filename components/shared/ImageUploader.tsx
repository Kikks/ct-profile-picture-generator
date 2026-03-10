'use client'

import { useCallback, useRef } from 'react'
import { useDropzone } from 'react-dropzone'
import { UploadCloudIcon, ImageIcon } from 'lucide-react'
import { cn } from '@/lib/utils'

interface ImageUploaderProps {
  onFileAccepted: (file: File) => void
  maxSizeMB?: number
  label?: string
  hint?: string
  disabled?: boolean
  className?: string
  accept?: Record<string, string[]>
}

export function ImageUploader({
  onFileAccepted,
  maxSizeMB = 10,
  label = 'Upload Image',
  hint,
  disabled = false,
  className,
  accept = {
    'image/png': ['.png'],
    'image/jpeg': ['.jpg', '.jpeg'],
    'image/webp': ['.webp'],
    'image/gif': ['.gif'],
  },
}: ImageUploaderProps) {
  const inputRef = useRef<HTMLInputElement>(null)

  const onDrop = useCallback(
    (acceptedFiles: File[]) => {
      if (acceptedFiles.length > 0) {
        onFileAccepted(acceptedFiles[0])
      }
    },
    [onFileAccepted],
  )

  const { getRootProps, getInputProps, isDragActive, fileRejections } = useDropzone({
    onDrop,
    accept,
    maxFiles: 1,
    maxSize: maxSizeMB * 1024 * 1024,
    disabled,
  })

  const rejectionMessage = fileRejections[0]?.errors[0]?.message

  return (
    <div className={cn('space-y-2', className)}>
      {/* Drag-and-drop zone */}
      <div
        {...getRootProps()}
        className={cn(
          'relative flex cursor-pointer flex-col items-center justify-center rounded-xl border-2 border-dashed px-6 py-10 text-center transition-all',
          isDragActive ? 'border-primary bg-primary/5' : 'border-border hover:border-primary/50 hover:bg-muted/50',
          disabled && 'pointer-events-none opacity-50',
        )}
      >
        <input {...getInputProps()} />

        <div className={cn('mb-4 rounded-full bg-primary/10 p-4', isDragActive && 'bg-primary/20')}>
          {isDragActive ? (
            <UploadCloudIcon className="h-8 w-8 text-primary" />
          ) : (
            <ImageIcon className="h-8 w-8 text-primary" />
          )}
        </div>

        <p className="text-base font-semibold text-foreground">{isDragActive ? 'Drop it here!' : label}</p>
        <p className="mt-1 text-sm text-muted-foreground">{hint ?? `Drag & drop, or tap to browse`}</p>
        <p className="mt-1 text-xs text-muted-foreground">PNG, JPEG, WebP, GIF · Max {maxSizeMB} MB</p>
      </div>

      {/* iOS-friendly fallback button */}
      <button
        type="button"
        className="flex w-full items-center justify-center gap-2 rounded-lg border border-border bg-background px-4 py-3 text-sm font-medium text-foreground transition-colors hover:bg-muted"
        onClick={() => inputRef.current?.click()}
        disabled={disabled}
      >
        <UploadCloudIcon className="h-4 w-4" />
        Choose from device
      </button>
      {/* Hidden native input for iOS compatibility */}
      <input
        ref={inputRef}
        type="file"
        accept="image/*"
        className="hidden"
        onChange={(e) => {
          const file = e.target.files?.[0]
          if (file) onFileAccepted(file)
          e.target.value = '' // reset so same file can be re-selected
        }}
      />

      {rejectionMessage && <p className="text-sm text-destructive">{rejectionMessage}</p>}
    </div>
  )
}
