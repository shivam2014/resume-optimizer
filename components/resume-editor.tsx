"use client"

import { useState, useEffect, useRef } from "react"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Badge } from "@/components/ui/badge"
import { ArrowLeftRight, Eye, Maximize2, Minimize2, Copy, Check, RefreshCw } from "lucide-react"
import { motion } from "framer-motion"
import { useToast } from "@/hooks/use-toast"
import { diffWords } from "diff"

interface ResumeEditorProps {
  originalText: string
  optimizedText: string
  editedText: string
  onEditedTextChange: (text: string) => void
}

export default function ResumeEditor({
  originalText,
  optimizedText,
  editedText,
  onEditedTextChange,
}: ResumeEditorProps) {
  const [viewMode, setViewMode] = useState<"side-by-side" | "diff">("side-by-side")
  const [isFullscreen, setIsFullscreen] = useState(false)
  const [isCopied, setIsCopied] = useState(false)
  const [differences, setDifferences] = useState<any[]>([])
  const textareaRef = useRef<HTMLTextAreaElement>(null)
  const { toast } = useToast()

  // Calculate differences between original and optimized text
  useEffect(() => {
    if (originalText && optimizedText) {
      const diffs = diffWords(originalText, optimizedText)
      setDifferences(diffs)
    }
  }, [originalText, optimizedText])

  const handleCopyToEditor = () => {
    onEditedTextChange(originalText)
    setIsCopied(true)

    toast({
      title: "Original text copied",
      description: "The original resume text has been copied to the editor.",
    })

    setTimeout(() => setIsCopied(false), 2000)
  }

  const handleResetToOptimized = () => {
    onEditedTextChange(optimizedText)

    toast({
      title: "Reset to optimized version",
      description: "The editor has been reset to the AI-optimized version.",
    })
  }

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
        <h3 className="text-lg font-medium">Edit Optimized Resume</h3>
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

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <h4 className="text-sm font-medium">Original Resume</h4>
            <Button variant="ghost" size="sm" onClick={handleCopyToEditor} className="h-7 px-2 text-xs">
              {isCopied ? (
                <>
                  <Check className="mr-1 h-3 w-3" />
                  Copied
                </>
              ) : (
                <>
                  <Copy className="mr-1 h-3 w-3" />
                  Copy to Editor
                </>
              )}
            </Button>
          </div>

          <Card className="border shadow-sm">
            <CardContent className="p-0">
              {viewMode === "side-by-side" ? (
                <ScrollArea className="h-[400px] rounded-md">
                  <div className="p-4 whitespace-pre-wrap">{originalText}</div>
                </ScrollArea>
              ) : (
                <ScrollArea className="h-[400px] rounded-md">
                  <div className="p-4">{renderDiffView()}</div>
                </ScrollArea>
              )}
            </CardContent>
          </Card>
        </div>

        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <h4 className="text-sm font-medium">
              Edit Resume
              <Badge variant="outline" className="ml-2 text-xs">
                AI Enhanced
              </Badge>
            </h4>
            <Button variant="ghost" size="sm" onClick={handleResetToOptimized} className="h-7 px-2 text-xs">
              <RefreshCw className="mr-1 h-3 w-3" />
              Reset to AI Version
            </Button>
          </div>

          <Card className="border shadow-sm">
            <CardContent className="p-0">
              <Textarea
                ref={textareaRef}
                value={editedText}
                onChange={(e) => onEditedTextChange(e.target.value)}
                className="min-h-[400px] border-0 rounded-md resize-none focus-visible:ring-0 focus-visible:ring-offset-0"
                placeholder="Edit your optimized resume here..."
              />
            </CardContent>
          </Card>
        </div>
      </div>

      <div className="text-xs text-muted-foreground">
        <p>Make any necessary edits to your optimized resume before generating the final PDF.</p>
      </div>
    </motion.div>
  )
}

