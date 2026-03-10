import type { PixelCrop, Template } from './types'

/**
 * Load an image from a URL.
 * Sets crossOrigin = 'anonymous' to prevent canvas CORS taint with Supabase Storage.
 */
export function loadImage(url: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const img = new Image()
    img.crossOrigin = 'anonymous'
    img.onload = () => resolve(img)
    img.onerror = () => reject(new Error(`Failed to load image: ${url}`))
    img.src = url
  })
}

/**
 * Composite the user's cropped photo with the overlay template on an offscreen canvas.
 *
 * Drawing order:
 * - overlay_on_top = true  → user photo first, overlay on top (overlay frames the photo)
 * - overlay_on_top = false → overlay first, user photo on top (user photo covers overlay)
 *
 * The croppedAreaPixels from react-easy-crop defines the source rect in the user's original image.
 * We map it to the user_area rect in the output canvas.
 */
export async function compositeImage(
  userImageUrl: string,
  croppedAreaPixels: PixelCrop,
  template: Template,
  format: 'png' | 'jpeg' = 'png',
): Promise<Blob> {
  const [userImg, overlayImg] = await Promise.all([loadImage(userImageUrl), loadImage(template.overlay_image_url)])

  const canvas = document.createElement('canvas')
  canvas.width = template.canvas_width
  canvas.height = template.canvas_height
  const ctx = canvas.getContext('2d')!

  const drawUserPhoto = () => {
    ctx.drawImage(
      userImg,
      croppedAreaPixels.x,
      croppedAreaPixels.y,
      croppedAreaPixels.width,
      croppedAreaPixels.height,
      template.user_area_x,
      template.user_area_y,
      template.user_area_width,
      template.user_area_height,
    )
  }

  const drawOverlay = () => {
    ctx.drawImage(overlayImg, 0, 0, template.canvas_width, template.canvas_height)
  }

  if (template.overlay_on_top) {
    drawUserPhoto()
    drawOverlay()
  } else {
    drawOverlay()
    drawUserPhoto()
  }

  const mimeType = format === 'jpeg' ? 'image/jpeg' : 'image/png'
  const quality = format === 'jpeg' ? 0.92 : 1.0

  return new Promise<Blob>((resolve, reject) => {
    canvas.toBlob(
      (blob) => {
        if (blob) resolve(blob)
        else reject(new Error('Canvas toBlob failed'))
      },
      mimeType,
      quality,
    )
  })
}

/**
 * Triggers a browser download for a Blob.
 */
export function downloadBlob(blob: Blob, filename: string) {
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = filename
  a.style.display = 'none'
  document.body.appendChild(a)
  a.click()
  document.body.removeChild(a)
  URL.revokeObjectURL(url)
}

/**
 * Draw a live preview of the composite onto a provided canvas element.
 * Uses the already-loaded image elements to avoid re-fetching.
 * Scales canvas to its display size × devicePixelRatio for sharpness.
 */
export function drawPreview(
  canvasEl: HTMLCanvasElement,
  userImgEl: HTMLImageElement,
  overlayImgEl: HTMLImageElement,
  croppedAreaPixels: PixelCrop,
  template: Template,
): void {
  const dpr = window.devicePixelRatio || 1
  const displayW = canvasEl.offsetWidth
  const displayH = canvasEl.offsetHeight

  if (displayW === 0 || displayH === 0) return

  canvasEl.width = displayW * dpr
  canvasEl.height = displayH * dpr

  const ctx = canvasEl.getContext('2d')!
  ctx.scale(dpr, dpr)

  // Scale factor: map native template dimensions → display dimensions
  const scaleX = displayW / template.canvas_width
  const scaleY = displayH / template.canvas_height

  const drawUser = () => {
    ctx.drawImage(
      userImgEl,
      croppedAreaPixels.x,
      croppedAreaPixels.y,
      croppedAreaPixels.width,
      croppedAreaPixels.height,
      template.user_area_x * scaleX,
      template.user_area_y * scaleY,
      template.user_area_width * scaleX,
      template.user_area_height * scaleY,
    )
  }

  const drawOverlay = () => {
    ctx.drawImage(overlayImgEl, 0, 0, displayW, displayH)
  }

  if (template.overlay_on_top) {
    drawUser()
    drawOverlay()
  } else {
    drawOverlay()
    drawUser()
  }
}

/** Convert a File to a data URL string */
export function fileToDataUrl(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader()
    reader.onload = () => resolve(reader.result as string)
    reader.onerror = reject
    reader.readAsDataURL(file)
  })
}
