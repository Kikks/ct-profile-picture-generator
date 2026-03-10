"use client"

import { useRef, useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { drawPreview, loadImage } from "@/lib/canvas"
import type { UserArea } from "@/lib/types"
import { ImageUploader } from "@/components/shared/ImageUploader"

interface Step4PreviewProps {
  overlayImageUrl: string
  canvasWidth: number
  canvasHeight: number
  userArea: UserArea
  overlayOnTop: boolean
  onNext: () => void
  onBack: () => void
}

export function Step4Preview({
  overlayImageUrl,
  canvasWidth,
  canvasHeight,
  userArea,
  overlayOnTop,
  onNext,
  onBack,
}: Step4PreviewProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const [sampleFile, setSampleFile] = useState<File | null>(null)
  const [sampleUrl, setSampleUrl] = useState<string | null>(null)
  const [isRendering, setIsRendering] = useState(false)

  // Mock template for preview drawing
  const mockTemplate = {
    canvas_width: canvasWidth,
    canvas_height: canvasHeight,
    user_area_x: userArea.x,
    user_area_y: userArea.y,
    user_area_width: userArea.width,
    user_area_height: userArea.height,
    overlay_on_top: overlayOnTop,
    overlay_image_url: overlayImageUrl,
  }

  useEffect(() => {
    if (!sampleUrl || !canvasRef.current) return
    setIsRendering(true)

    const render = async () => {
      try {
        const [userImg, overlayImg] = await Promise.all([
          loadImage(sampleUrl),
          loadImage(overlayImageUrl),
        ])
        // Use a simple full-image crop for the preview (no user adjustment)
        const fullCrop = {
          x: 0,
          y: 0,
          width: userImg.naturalWidth,
          height: userImg.naturalHeight,
        }
        drawPreview(canvasRef.current!, userImg, overlayImg, fullCrop, mockTemplate as Parameters<typeof drawPreview>[4])
      } finally {
        setIsRendering(false)
      }
    }

    render()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [sampleUrl, overlayImageUrl, JSON.stringify(mockTemplate)])

  useEffect(() => {
    if (!sampleFile) return
    const url = URL.createObjectURL(sampleFile)
    setSampleUrl(url)
    return () => URL.revokeObjectURL(url)
  }, [sampleFile])

  return (
    <div className="space-y-5">
      <p className="text-sm text-muted-foreground">
        Upload a sample photo to preview how the final profile picture will look.
        Members will be able to adjust their photo during use.
      </p>

      {/* Preview canvas */}
      <div className="overflow-hidden rounded-xl border border-border bg-muted">
        {sampleUrl ? (
          <canvas
            ref={canvasRef}
            className="w-full"
            style={{ aspectRatio: `${canvasWidth} / ${canvasHeight}` }}
          />
        ) : (
          <div
            className="flex items-center justify-center"
            style={{ aspectRatio: `${canvasWidth} / ${canvasHeight}` }}
          >
            <div className="text-center">
              <p className="text-muted-foreground">Preview appears here</p>
              <p className="mt-1 text-xs text-muted-foreground">Upload a sample photo below</p>
            </div>
          </div>
        )}
      </div>

      {isRendering && (
        <p className="text-center text-sm text-muted-foreground">Rendering preview…</p>
      )}

      <ImageUploader
        onFileAccepted={setSampleFile}
        label={sampleFile ? "Replace sample photo" : "Upload Sample Photo"}
        hint="This is just for your preview — it won't be saved"
        accept={{ "image/*": [".jpg", ".jpeg", ".png", ".webp"] }}
      />

      <div className="flex gap-3">
        <Button variant="outline" onClick={onBack} className="flex-1">
          Back
        </Button>
        <Button onClick={onNext} className="flex-1">
          Looks Good → Save & Publish
        </Button>
      </div>
    </div>
  )
}
