import Link from "next/link"
import { redirect } from "next/navigation"
import { PlusIcon } from "lucide-react"
import { Button } from "@/components/ui/button"
import { TemplateList } from "@/components/admin/TemplateList"
import { LogoutButton } from "@/components/admin/LogoutButton"
import { createAdminClient } from "@/lib/supabase"
import { getAdminSession } from "@/lib/auth"
import type { Template } from "@/lib/types"

export const metadata = {
  title: "Templates — Admin",
}

async function getTemplates(): Promise<Template[]> {
  const supabase = createAdminClient()
  const { data, error } = await supabase
    .from("templates")
    .select("*")
    .order("created_at", { ascending: false })

  if (error) {
    console.error("Failed to fetch templates:", error.message)
    return []
  }

  return data as Template[]
}

export default async function AdminDashboard() {
  const isAdmin = await getAdminSession()
  if (!isAdmin) redirect("/admin/login")

  const templates = await getTemplates()
  const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000"

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="sticky top-0 z-10 border-b border-border bg-background/80 backdrop-blur">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-4 py-4">
          <div>
            <h1 className="text-xl font-bold">Profile Picture Generator</h1>
            <p className="text-xs text-muted-foreground">Admin Dashboard</p>
          </div>
          <div className="flex items-center gap-2">
            <Button render={<Link href="/admin/create" />} size="sm">
              <PlusIcon className="mr-1.5 h-4 w-4" />
              New Template
            </Button>
            <LogoutButton />
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-6xl px-4 py-8">
        {/* Stats bar */}
        <div className="mb-6 flex flex-wrap items-center gap-4">
          <div className="rounded-lg bg-muted px-4 py-2 text-sm">
            <span className="font-semibold">{templates.length}</span>{" "}
            <span className="text-muted-foreground">template{templates.length !== 1 ? "s" : ""}</span>
          </div>
          <div className="rounded-lg bg-muted px-4 py-2 text-sm">
            <span className="font-semibold">{templates.filter((t) => t.is_published).length}</span>{" "}
            <span className="text-muted-foreground">published</span>
          </div>
        </div>

        <TemplateList initialTemplates={templates} appUrl={appUrl} />
      </main>
    </div>
  )
}
