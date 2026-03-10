export interface Template {
  id: string;
  name: string;
  description?: string;
  overlay_image_url: string;
  canvas_width: number;
  canvas_height: number;
  user_area_x: number;
  user_area_y: number;
  user_area_width: number;
  user_area_height: number;
  user_area_circular: boolean;
  overlay_on_top: boolean;
  is_published: boolean;
  created_at: string;
  updated_at: string;
}

// The pixel-space crop result returned by react-easy-crop's onCropComplete
export interface PixelCrop {
  x: number;
  y: number;
  width: number;
  height: number;
}

// Area selector state (always stored in native canvas coordinates)
export interface UserArea {
  x: number;
  y: number;
  width: number;
  height: number;
}

// 8 resize handle positions + the move handle for the body
export type HandlePosition = 'nw' | 'n' | 'ne' | 'e' | 'se' | 's' | 'sw' | 'w' | 'move';

export type AspectRatio = '1:1' | '4:5' | '16:9' | '9:16' | 'custom';

export type EditorPhase = 'upload' | 'crop' | 'preview' | 'done';
