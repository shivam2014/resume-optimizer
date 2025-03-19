import { Suspense } from "react"
import ResumeOptimizer from "@/components/resume-optimizer"
import { Loader2 } from "lucide-react"
import { ModeToggle } from "@/components/mode-toggle"

export default function Home() {
  return (
    <div className="min-h-screen bg-gradient-to-b from-background to-muted/20">
      <div className="absolute top-4 right-4">
        <ModeToggle />
      </div>

      <main className="container max-w-6xl mx-auto px-4 py-12 md:py-20">
        <div className="space-y-2 text-center mb-12">
          <h1 className="text-4xl md:text-5xl font-bold tracking-tight">Resume Optimizer</h1>
          <p className="text-muted-foreground max-w-[700px] mx-auto">
            Leverage AI to tailor your resume for specific job opportunities and stand out from the competition
          </p>
        </div>

        <Suspense
          fallback={
            <div className="flex justify-center items-center min-h-[500px]">
              <div className="flex flex-col items-center gap-2">
                <Loader2 className="h-8 w-8 animate-spin text-primary" />
                <p className="text-muted-foreground">Loading resume optimizer...</p>
              </div>
            </div>
          }
        >
          <ResumeOptimizer />
        </Suspense>
      </main>
    </div>
  )
}

