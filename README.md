# CT Profile Picture Generator

A web app for creating custom profile picture templates and letting members upload their photo to generate framed profile images. Built for **ChristTribe** — admins design templates (e.g. event frames, borders), publish them, and share a link; members use the link to upload a photo, adjust crop, and download PNG or JPEG.

## Features

- **Admin (protected)**
  - Create templates: name, canvas size (1:1, 4:5, 16:9, 9:16, or custom), overlay image
  - Position and size the “user photo” area with a visual selector
  - Shape presets: square, portrait, landscape, or **circle** (with optional circular clipping in the final image)
  - Manual dimension inputs (X, Y, width, height in px)
  - Toggle overlay on top vs. behind the user photo
  - Preview with a sample photo, then save
  - Publish/unpublish and copy shareable link (`/t/{templateId}`)
  - Edit existing templates

- **Public (shareable link `/t/[id]`)**
  - Upload photo (JPEG, PNG, WebP, GIF, HEIC)
  - Adjust position and zoom with a round or rectangular crop guide (matches template shape)
  - Preview result and download PNG (best quality) or JPEG (smaller, e.g. WhatsApp)

## Tech stack

- **Next.js 16** (App Router), **React 19**
- **Supabase**: Postgres (templates), Storage (overlay images), SSR client
- **Tailwind CSS v4** (theme in `app/globals.css`), **shadcn** (Radix-based UI)
- **react-easy-crop** (crop UI), **Canvas API** (compositing, circular/rect clipping)
- **jose** (JWT for admin session), **sonner** (toasts)

## Prerequisites

- Node.js 20+
- A [Supabase](https://supabase.com) project

## Getting started

### 1. Clone and install

```bash
git clone <your-repo-url>
cd ct-profile-picture-generator
npm install
```

### 2. Environment variables

Copy the example env file and fill in your values:

```bash
cp .env.local.example .env.local
```

| Variable | Description |
|----------|-------------|
| `NEXT_PUBLIC_SUPABASE_URL` | Supabase project URL (Dashboard → Project Settings → API) |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Supabase anon/public key |
| `SUPABASE_SERVICE_ROLE_KEY` | Supabase service role key (server-only; for admin template CRUD) |
| `ADMIN_PASSWORD` | Password for admin login (`/admin/login`) |
| `JWT_SECRET` | Secret for signing admin session cookie (min 32 chars). Generate with: `openssl rand -base64 32` |
| `NEXT_PUBLIC_APP_URL` | Full app URL (e.g. `http://localhost:3000` or `https://yourdomain.com`) — used for share links |

### 3. Supabase setup

- **Table `templates`**  
  Columns: `id` (uuid, default `gen_random_uuid()`), `name`, `description`, `overlay_image_url`, `canvas_width`, `canvas_height`, `user_area_x`, `user_area_y`, `user_area_width`, `user_area_height`, `user_area_circular` (boolean, default `false`), `overlay_on_top` (boolean), `is_published` (boolean), `created_at`, `updated_at`.  
  Enable RLS if you want; the app uses the anon key for public reads (published templates only) and the service role for admin.

- **Storage**  
  Create a public bucket (e.g. `overlays`) for template overlay images. The upload API stores files there and returns the public URL to save in `overlay_image_url`.

- **Migration for circular flag** (if the table already existed before this feature):

  ```sql
  ALTER TABLE templates ADD COLUMN IF NOT EXISTS user_area_circular boolean NOT NULL DEFAULT false;
  ```

### 4. Run the app

```bash
npm run dev
```

- **Admin:** [http://localhost:3000/admin](http://localhost:3000/admin) → log in with `ADMIN_PASSWORD`, then create/edit templates and publish.
- **Root:** Redirects to `/admin`.
- **Public editor:** Open a share link (e.g. `http://localhost:3000/t/<template-id>`).

## Scripts

| Command | Description |
|---------|-------------|
| `npm run dev` | Start Next.js dev server |
| `npm run build` | Production build |
| `npm run start` | Start production server |
| `npm run lint` | Run ESLint |
| `npm run format` | Format with Prettier |

## Project structure (high level)

```
app/
  page.tsx              # Redirects to /admin
  layout.tsx, globals.css
  admin/                # Admin dashboard, create, edit, login
  t/[id]/page.tsx       # Public template editor (share link)
  api/
    auth/               # Admin login (sets JWT cookie)
    upload/             # Upload overlay image to Supabase Storage
    templates/          # GET/POST templates
    templates/[id]/     # GET/PUT/PATCH/DELETE single template
components/
  admin/                # TemplateCreator, AreaSelector, steps, TemplateList, etc.
  editor/               # PhotoEditor, EditorCanvas (crop + composite preview)
  shared/               # StepIndicator, ImageUploader
  ui/                   # shadcn components
lib/
  auth.ts               # Admin JWT sign/verify/session
  canvas.ts             # loadImage, compositeImage, drawPreview (with circular clip)
  supabase.ts           # createClient (browser), createAdminClient (server)
  types.ts              # Template, UserArea, PixelCrop, etc.
  utils.ts
```

## Deployment

- Set all env vars in your host (Vercel, etc.).
- Set `NEXT_PUBLIC_APP_URL` to your production URL so share links are correct.
- Ensure Supabase allows your production origin in Authentication → URL Configuration if you use Supabase Auth elsewhere; this app uses cookie-based admin auth only.

## License

Private / as per your repo.
