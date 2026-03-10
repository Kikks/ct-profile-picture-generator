import { redirect, notFound } from "next/navigation"
import Link from "next/link"
import { ArrowLeftIcon } from "lucide-react"
import { TemplateCreator } from "@/components/admin/TemplateCreator"
import { createAdminClient } from "@/lib/supabase"
import { getAdminSession } from "@/lib/auth"
import type { Template } from "@/lib/types"

export const metadata = {
  title: "Edit Template — Admin",
}

async function getTemplate(id: string): Promise<Template | null> {
  const supabase = createAdminClient()
  const { data, error } = await supabase
    .from("templates")
    .select("*")
    .eq("id", id)
    .single()

  if (error || !data) return null
  return data as Template
}

export default async function EditTemplatePage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const isAdmin = await getAdminSession()
  if (!isAdmin) redirect("/admin/login")

  const { id } = await params
  const template = await getTemplate(id)

  if (!template) notFound()

  const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000"

  return (
    <div className="min-h-screen bg-background">
      <header className="sticky top-0 z-10 border-b border-border bg-background/80 backdrop-blur">
        <div className="mx-auto flex max-w-2xl items-center gap-3 px-4 py-4">
          <Link
            href="/admin"
            className="flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground"
          >
            <ArrowLeftIcon className="h-4 w-4" />
            Back
          </Link>
          <h1 className="text-lg font-semibold">Edit Template</h1>
        </div>
      </header>

      <main className="mx-auto max-w-2xl px-4 py-8">
        <TemplateCreator appUrl={appUrl} existingTemplate={template} />
      </main>
    </div>
  )
}
