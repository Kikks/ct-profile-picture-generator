import { notFound } from "next/navigation"
import type { Metadata } from "next"
import { createClient } from "@/lib/supabase"
import { PhotoEditor } from "@/components/editor/PhotoEditor"
import type { Template } from "@/lib/types"

async function getTemplate(id: string): Promise<Template | null> {
  const supabase = createClient()
  const { data, error } = await supabase
    .from("templates")
    .select("*")
    .eq("id", id)
    .eq("is_published", true)
    .single()

  if (error || !data) return null
  return data as Template
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ id: string }>
}): Promise<Metadata> {
  const { id } = await params
  const template = await getTemplate(id)

  if (!template) {
    return { title: "Template Not Found" }
  }

  return {
    title: `${template.name} — Create Your Profile Picture`,
    description:
      template.description ??
      "Upload your photo and download a beautiful custom profile picture.",
    openGraph: {
      title: `${template.name} — Profile Picture Generator`,
      description:
        template.description ??
        "Upload your photo and download a beautiful custom profile picture.",
      images: [
        {
          url: template.overlay_image_url,
          width: template.canvas_width,
          height: template.canvas_height,
          alt: template.name,
        },
      ],
    },
  }
}

export default async function TemplatePage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const { id } = await params
  const template = await getTemplate(id)

  if (!template) notFound()

  return (
    <div className="min-h-screen bg-gradient-to-b from-background to-muted/40">
      {/* Header */}
      <header className="bg-background/80 backdrop-blur-sm border-b border-border">
        <div className="mx-auto max-w-lg px-4 py-4 text-center">
          <h1 className="text-lg font-bold leading-tight">{template.name}</h1>
          {template.description && (
            <p className="mt-1 text-sm text-muted-foreground">{template.description}</p>
          )}
        </div>
      </header>

      {/* Editor */}
      <main className="mx-auto max-w-lg px-4 py-6">
        <PhotoEditor template={template} />
      </main>

      {/* Footer */}
      <footer className="mt-8 pb-safe pb-6 text-center text-xs text-muted-foreground">
        Made with ❤️ for the congregation
      </footer>
    </div>
  )
}
