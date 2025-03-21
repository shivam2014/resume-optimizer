"use client"

import { useState } from "react"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Trash2, Upload } from "lucide-react"
import FileUploader from "@/components/file-uploader"
import { useToast } from "@/hooks/use-toast"
import api, { Template } from "@/lib/api"

interface TemplateManagementModalProps {
  open: boolean
  onOpenChange: (open: boolean) => void
}

export default function TemplateManagementModal({ open, onOpenChange }: TemplateManagementModalProps) {
  const { toast } = useToast()
  const [customTemplates, setCustomTemplates] = useState<Template[]>([])
  const [isLoading, setIsLoading] = useState(false)

  const handleFileUpload = async (file: File) => {
    setIsLoading(true)
    try {
      const formData = new FormData()
      formData.append("file", file)
      
      const response = await api.post("/api/templates", formData, {
        headers: {
          "Content-Type": "multipart/form-data"
        }
      })
      
      setCustomTemplates(prev => [...prev, response.data])
      toast({
        title: "Template uploaded",
        description: "Your template has been successfully uploaded",
      })
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : "Failed to upload template"
      toast({
        title: "Upload failed",
        description: errorMessage,
        variant: "destructive"
      })
    } finally {
      setIsLoading(false)
    }
  }

  const handleDeleteTemplate = async (templateId: string) => {
    setIsLoading(true)
    try {
      await api.delete(`/api/templates/${templateId}`)
      setCustomTemplates(prev => prev.filter(t => t.id !== templateId))
      toast({
        title: "Template deleted",
        description: "The template has been successfully removed",
      })
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : "Failed to delete template"
      toast({
        title: "Deletion failed",
        description: errorMessage,
        variant: "destructive"
      })
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>Manage Templates</DialogTitle>
        </DialogHeader>
        
        <div className="space-y-6">
          <FileUploader
            onFileUpload={handleFileUpload}
            acceptedFileTypes=".tex"
            maxSizeMB={1}
          />
          
          {customTemplates.length > 0 && (
            <div className="space-y-2">
              <h3 className="font-medium">Custom Templates</h3>
              <div className="space-y-2">
                {customTemplates.map(template => (
                  <div key={template.id} className="flex items-center justify-between p-3 border rounded-lg">
                    <span className="text-sm">{template.name}</span>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleDeleteTemplate(template.id)}
                      disabled={isLoading}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  )
}