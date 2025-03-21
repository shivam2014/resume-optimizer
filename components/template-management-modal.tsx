import { useState, useCallback } from "react"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "./ui/dialog"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "./ui/button"
import { Trash2, Upload } from "lucide-react"
import { useToast } from "@/hooks/use-toast"
import FileUploader from "./file-uploader"

interface Template {
  id: string
  name: string
  thumbnail: string
  path: string
  isCustom: boolean
}

interface TemplateManagementModalProps {
  isOpen: boolean
  onClose: () => void
  templates: Template[]
  onTemplateSelect: (template: Template) => void
  onTemplateDelete: (templateId: string) => void
  onTemplateUpload: (file: File) => Promise<void>
}

export default function TemplateManagementModal({
  isOpen,
  onClose,
  templates,
  onTemplateSelect,
  onTemplateDelete,
  onTemplateUpload,
}: TemplateManagementModalProps) {
  const [isUploading, setIsUploading] = useState(false)
  const { toast } = useToast()

  const validateLatexTemplate = (content: string): boolean => {
    // Basic LaTeX structure validation
    const hasDocumentClass = /\\documentclass/.test(content)
    const hasBeginDocument = /\\begin{document}/.test(content)
    const hasEndDocument = /\\end{document}/.test(content)
    
    return hasDocumentClass && hasBeginDocument && hasEndDocument
  }

  const handleFileUpload = useCallback(async (file: File) => {
    try {
      setIsUploading(true)

      // Read file content for validation
      const content = await file.text()
      if (!validateLatexTemplate(content)) {
        toast({
          title: "Invalid Template",
          description: "The file must be a valid LaTeX template with proper structure.",
          variant: "destructive",
        })
        return
      }

      await onTemplateUpload(file)
      toast({
        title: "Success",
        description: "Template uploaded successfully",
      })
    } catch (error) {
      toast({
        title: "Upload Failed",
        description: "Failed to upload template. Please try again.",
        variant: "destructive",
      })
    } finally {
      setIsUploading(false)
    }
  }, [onTemplateUpload, toast])

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl">
        <DialogHeader>
          <DialogTitle>Template Management</DialogTitle>
        </DialogHeader>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mt-4">
          {templates.map((template) => (
            <Card key={template.id} className="overflow-hidden">
              <CardContent className="p-0">
                <div className="relative aspect-[1.4142] w-full overflow-hidden">
                  {/* Preview thumbnail */}
                  <img
                    src={template.thumbnail}
                    alt={template.name}
                    className="object-cover w-full h-full hover:scale-105 transition-transform cursor-pointer"
                    onClick={() => onTemplateSelect(template)}
                  />
                </div>
              </CardContent>
              <div className="flex items-center justify-between p-4 border-t">
                <span className="text-sm font-medium truncate">{template.name}</span>
                {template.isCustom && (
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => onTemplateDelete(template.id)}
                    className="text-destructive hover:text-destructive/90"
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                )}
              </div>
            </Card>
          ))}
        </div>

        <div className="mt-6">
          <FileUploader
            onFileUpload={handleFileUpload}
            acceptedFileTypes=".tex"
            maxSizeMB={5}
          />
        </div>
      </DialogContent>
    </Dialog>
  )
}