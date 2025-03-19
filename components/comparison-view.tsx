"use client"

import { useState, useEffect } from "react"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { ArrowLeftRight, Eye, Maximize2, Minimize2 } from "lucide-react"
import { ScrollArea } from "@/components/ui/scroll-area"
import { motion } from "framer-motion"
import { diffWords } from "diff"

interface ComparisonViewProps {
  originalText: string
  optimizedText: string
}

export default function ComparisonView({ originalText, optimizedText }: ComparisonViewProps) {
  const [viewMode, setViewMode] = useState<"side-by-side" | "diff">("side-by-side")
  const [isFullscreen, setIsFullscreen] = useState(false)
  const [differences, setDifferences] = useState<any[]>([])

  // Calculate differences between original and optimized text
  useEffect(() => {
    if (originalText && optimizedText) {
      const diffs = diffWords(originalText, optimizedText)
      setDifferences(diffs)
    }
  }, [originalText, optimizedText])

  const renderDiffView = () => {
    return (
      <div className="border rounded-md p-4 bg-muted/30 whitespace-pre-wrap">
        {differences.map((part, index) => {
          const color = part.added
            ? "bg-green-100 dark:bg-green-950/30 text-green-800 dark:text-green-300"
            : part.removed
              ? "bg-red-100 dark:bg-red-950/30 text-red-800 dark:text-red-300"
              : ""

          return (
            <span key={index} className={color}>
              {part.value}
            </span>
          )
        })}
      </div>
    )
  }

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.3 }}
      className={`space-y-4 ${isFullscreen ? "fixed inset-0 z-50 bg-background p-6" : ""}`}
    >
      <div className="flex justify-between items-center">
        <h3 className="text-lg font-medium">Compare Changes</h3>
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => setViewMode(viewMode === "side-by-side" ? "diff" : "side-by-side")}
          >
            {viewMode === "side-by-side" ? (
              <>
                <Eye className="mr-2 h-4 w-4" />
                View Diff
              </>
            ) : (
              <>
                <ArrowLeftRight className="mr-2 h-4 w-4" />
                Side by Side
              </>
            )}
          </Button>
          <Button variant="ghost" size="sm" onClick={() => setIsFullscreen(!isFullscreen)}>
            {isFullscreen ? <Minimize2 className="h-4 w-4" /> : <Maximize2 className="h-4 w-4" />}
          </Button>
        </div>
      </div>

      {viewMode === "side-by-side" ? (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <Card className="border shadow-sm">
            <CardContent className="p-4">
              <h4 className="text-sm font-medium mb-2">Original Resume</h4>
              <ScrollArea className="h-[400px] rounded-md border">
                <div className="p-4 whitespace-pre-wrap">{originalText}</div>
              </ScrollArea>
            </CardContent>
          </Card>

          <Card className="border shadow-sm">
            <CardContent className="p-4">
              <h4 className="text-sm font-medium mb-2">Optimized Resume</h4>
              <ScrollArea className="h-[400px] rounded-md border">
                <div className="p-4 whitespace-pre-wrap">{optimizedText}</div>
              </ScrollArea>
            </CardContent>
          </Card>
        </div>
      ) : (
        <Card className="border shadow-sm">
          <CardContent className="p-4">
            <h4 className="text-sm font-medium mb-2">Changes Made</h4>
            <ScrollArea className="h-[400px] rounded-md border">{renderDiffView()}</ScrollArea>
          </CardContent>
        </Card>
      )}
    </motion.div>
  )
}

