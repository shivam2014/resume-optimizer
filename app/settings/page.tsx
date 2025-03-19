import { Suspense } from "react"
import { Loader2 } from "lucide-react"
import ApiKeySettings from "@/components/api-key-settings"
import { ModeToggle } from "@/components/mode-toggle"

export default function SettingsPage() {
  return (
    <div className="min-h-screen bg-gradient-to-b from-background to-muted/20">
      <div className="absolute top-4 right-4">
        <ModeToggle />
      </div>

      <main className="container max-w-4xl mx-auto px-4 py-12 md:py-20">
        <div className="space-y-2 mb-12">
          <h1 className="text-3xl md:text-4xl font-bold tracking-tight">Settings</h1>
          <p className="text-muted-foreground">Configure your API keys and application preferences</p>
        </div>

        <Suspense
          fallback={
            <div className="flex justify-center items-center min-h-[300px]">
              <div className="flex flex-col items-center gap-2">
                <Loader2 className="h-8 w-8 animate-spin text-primary" />
                <p className="text-muted-foreground">Loading settings...</p>
              </div>
            </div>
          }
        >
          <ApiKeySettings />
        </Suspense>
      </main>
    </div>
  )
}

