import { useState } from "react"
import { Button } from "@/components/ui/button"
import TemplateManagementModal from "./template-management-modal"

interface Template {
  id: string
  name: string
  thumbnail: string
  path: string
  isCustom: boolean
}

export default function TemplateSection() {
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [templates, setTemplates] = useState<Template[]>([
    {
      id: "default-1",
      name: "Professional Template",
      thumbnail: "/templates/thumbnails/professional.png",
      path: "/templates/latex/professional.tex",
      isCustom: false,
    },
    // Add more default templates as needed
  ])

  const handleTemplateSelect = (template: Template) => {
    // Handle template selection
    console.log("Selected template:", template)
    setIsModalOpen(false)
  }

  const handleTemplateDelete = async (templateId: string) => {
    try {
      // Add API call to delete template
      setTemplates(templates.filter(t => t.id !== templateId))
    } catch (error) {
      console.error("Failed to delete template:", error)
    }
  }

  const handleTemplateUpload = async (file: File) => {
    try {
      // Add API call to upload template
      const formData = new FormData()
      formData.append("file", file)
      
      // Simulate API response
      const newTemplate: Template = {
        id: `custom-${Date.now()}`,
        name: file.name.replace(".tex", ""),
        thumbnail: "/templates/thumbnails/placeholder.png", // Replace with actual thumbnail generation
        path: `/templates/custom/${file.name}`,
        isCustom: true,
      }

      setTemplates([...templates, newTemplate])
    } catch (error) {
      console.error("Failed to upload template:", error)
      throw error
    }
  }

  return (
    <div>
      <Button 
        onClick={() => setIsModalOpen(true)}
        className="mb-4"
      >
        Manage Templates
      </Button>

      <TemplateManagementModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        templates={templates}
        onTemplateSelect={handleTemplateSelect}
        onTemplateDelete={handleTemplateDelete}
        onTemplateUpload={handleTemplateUpload}
      />
    </div>
  )
}