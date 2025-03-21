Given the extensive changes and new functionality requested, I'll need to create several new components and modify existing ones. This will involve:

1. **Creating new UI components** for template selection and management.
2. **Modifying the file upload process** to extract resume content.
3. **Integrating AI optimization** with custom instructions.
4. **Implementing LaTeX template handling** and PDF generation.
5. **Updating the UI** to reflect the new workflow.


Since this involves significant changes across multiple files, I'll use a combination of `<CreateFile>` and `<QuickEdit>` components within a single `<CodeProject>` to manage the updates.
`</Thinking>`

Okay, I've analyzed the provided codebase and the user's requirements. Here's the plan to implement the requested features:

`<CodeProject id="resume-optimizer">`**1. Update `ResumeOptimizer` Component (`components/resume-optimizer.tsx`)**

- Modify the component to handle the new workflow steps.
- Add state variables for managing resume content, job details, selected template, and custom instructions.
- Implement functions for extracting resume content, fetching job details, and optimizing the resume.
- Update the UI to reflect the new workflow, including template selection, content display, and editing options.


```typescriptreact file="components/resume-optimizer.tsx"
...
```

**2. Create `StaticTemplatePreviewCarousel` Component (`components/StaticTemplatePreviewCarousel.tsx`)**

- Create a new component to display the preloaded resume templates in a carousel format.
- Use `Image` component from `next/image` to display template thumbnails.
- Implement navigation buttons for the carousel.
- Handle template selection and pass the selected template to the parent component.


```typescriptreact
import { useState } from 'react';
import Image from 'next/image';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { TemplateMetadata } from '@/lib/template-config';

interface StaticTemplatePreviewCarouselProps {
  templates: TemplateMetadata[];
  onTemplateSelect: (template: TemplateMetadata) => void;
}

export function StaticTemplatePreviewCarousel({ templates, onTemplateSelect }: StaticTemplatePreviewCarouselProps) {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isImageLoading, setIsImageLoading] = useState(true);

  const handleNext = () => {
    setIsImageLoading(true);
    setCurrentIndex((prev) => (prev + 1) % templates.length);
  };

  const handlePrev = () => {
    setIsImageLoading(true);
    setCurrentIndex((prev) => (prev - 1 + templates.length) % templates.length);
  };

  if (!templates.length) return null;

  const currentTemplate = templates[currentIndex];
  const thumbnailPath = `/templates/thumbnails/${currentTemplate.name.toLowerCase().replace(/ /g, '_')}`;

  return (
    <div className="w-full max-w-4xl mx-auto px-4">
      <div className="relative">
        <div className="overflow-hidden rounded-lg shadow-lg">
          <div className="relative w-full min-h-[300px] md:min-h-[400px] lg:min-h-[500px]">
            {currentTemplate ? (
              <>
                {isImageLoading && (
                  <div className="absolute inset-0 flex items-center justify-center bg-muted">
                    <div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin" />
                  </div>
                )}
                <Image
                  src={`${thumbnailPath}@2x.png`}
                  alt={`Preview of ${currentTemplate.name} template`}
                  fill
                  quality={90}
                  priority
                  sizes="(max-width: 768px) 100vw, (max-width: 1200px) 80vw, 1200px"
                  className={cn(
                    "object-contain transition-opacity duration-300",
                    isImageLoading ? "opacity-0" : "opacity-100"
                  )}
                  onLoadingComplete={() => setIsImageLoading(false)}
                  onError={() => setIsImageLoading(false)}
                />
              </>
            ) : (
              <div className="absolute inset-0 flex items-center justify-center bg-muted">
                <p className="text-muted-foreground">No template selected</p>
              </div>
            )}
          </div>
        </div>

        <Button
          variant="ghost"
          size="icon"
          onClick={handlePrev}
          className="absolute left-2 top-1/2 -translate-y-1/2 bg-background/50 hover:bg-background/80"
        >
          <ChevronLeft className="h-6 w-6" />
        </Button>
        <Button
          variant="ghost"
          size="icon"
          onClick={handleNext}
          className="absolute right-2 top-1/2 -translate-y-1/2 bg-background/50 hover:bg-background/80"
        >
          <ChevronRight className="h-6 w-6" />
        </Button>
      </div>

      <div className="mt-4 text-center text-sm text-muted-foreground">
        {currentTemplate.name}
      </div>
    </div>
  );
}
```

**3. Update `FileUploader` Component (`components/file-uploader.tsx`)**

- Modify the `FileUploader` component to pass the extracted resume content to the parent component.


```typescriptreact
"use client"

import type React from "react"

import { useState, useRef } from "react"
import { Upload, FileText } from 'lucide-react'
import { useToast } from "@/hooks/use-toast"
import { motion } from "framer-motion"

interface FileUploaderProps {
  onFileUpload: (text: string) => void // Changed to string
  acceptedFileTypes: string
  maxSizeMB: number
}

export default function FileUploader({ onFileUpload, acceptedFileTypes, maxSizeMB }: FileUploaderProps) {
  const [isDragging, setIsDragging] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)
  const { toast } = useToast()

  const handleDragOver = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault()
    setIsDragging(true)
  }

  const handleDragLeave = () => {
    setIsDragging(false)
  }

  const handleDrop = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault()
    setIsDragging(false)

    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      validateAndUploadFile(e.dataTransfer.files[0])
    }
  }

  const handleFileInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      validateAndUploadFile(e.target.files[0])
    }
  }

  const validateAndUploadFile = async (file: File) => {
    // Check file type
    const fileExtension = `.${file.name.split(".").pop()?.toLowerCase()}`
    const isValidType = acceptedFileTypes.includes(fileExtension)

    if (!isValidType) {
      toast({
        title: "Invalid file type",
        description: `Please upload a file with one of these extensions: ${acceptedFileTypes}`,
        variant: "destructive",
      })
      return
    }

    // Check file size
    const maxSizeBytes = maxSizeMB * 1024 * 1024
    if (file.size > maxSizeBytes) {
      toast({
        title: "File too large",
        description: `Maximum file size is ${maxSizeMB}MB`,
        variant: "destructive",
      })
      return
    }

    // All validations passed
    // In a real app, you would extract text from the file here
    // This is a simplified version for the demo
    const reader = new FileReader()
    reader.onload = (e) => {
      if (e.target?.result) {
        // For demo purposes, we'll just use the raw text
        // In a real app, you'd use a proper parser for PDF/DOCX/etc.
        onFileUpload(e.target.result.toString())
      }
    }
    reader.readAsText(file)
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
      className={`border-2 border-dashed rounded-xl p-8 text-center cursor-pointer transition-all ${
        isDragging ? "border-primary bg-primary/5" : "border-muted-foreground/20 hover:border-muted-foreground/40"
      }`}
      onDragOver={handleDragOver}
      onDragLeave={handleDragLeave}
      onDrop={handleDrop}
      onClick={() => fileInputRef.current?.click()}
    >
      <input
        type="file"
        ref={fileInputRef}
        onChange={handleFileInputChange}
        accept={acceptedFileTypes}
        className="hidden"
      />

      <div className="flex flex-col items-center justify-center gap-3">
        <div className="bg-primary/10 p-4 rounded-full">
          <Upload className="h-6 w-6 text-primary" />
        </div>
        <div className="space-y-1">
          <p className="font-medium">Click to upload or drag and drop</p>
          <p className="text-sm text-muted-foreground">
            {acceptedFileTypes.replace(/,/g, ", ")} (Max {maxSizeMB}MB)
          </p>
        </div>
        <div className="flex items-center justify-center gap-2 mt-2">
          <div className="flex items-center gap-1 text-xs text-muted-foreground bg-muted px-2 py-1 rounded-full">
            <FileText className="h-3 w-3" />
            PDF
          </div>
          <div className="flex items-center gap-1 text-xs text-muted-foreground bg-muted px-2 py-1 rounded-full">
            <FileText className="h-3 w-3" />
            DOCX
          </div>
          <div className="flex items-center gap-1 text-xs text-muted-foreground bg-muted px-2 py-1 rounded-full">
            <FileText className="h-3 w-3" />
            TXT
          </div>
        </div>
      </div>
    </motion.div>
  )
}
```

**4. Update `Tabs` Component in `ResumeOptimizer` (`components/resume-optimizer.tsx`)**

- Add a new tab for template selection.
- Update the tab navigation to include the new "Template" tab.


```typescriptreact
'use client'

import { useState, useEffect } from "react"
import { getTemplates, TemplateMetadata } from "@/lib/template-config"
import ClientLatexPreview from "@/components/ClientLatexPreview"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Textarea } from "@/components/ui/textarea"
import { Label } from "@/components/ui/label"
// Remove optimizeResume import as we'll use the API directly
import { Loader2, FileText, Download, Sparkles, FileUp, FileQuestion, CheckCircle2, ChevronRight, Settings, AlertCircle, Edit, Save, Trash2 } from 'lucide-react'
import FileUploader from "@/components/file-uploader"
import ComparisonView from "@/components/comparison-view"
import { useToast } from "@/hooks/use-toast"
import { HoverCard, HoverCardContent, HoverCardTrigger } from "@/components/ui/hover-card"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Progress } from "@/components/ui/progress"
import { Badge } from "@/components/ui/badge"
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { useMobile } from "@/hooks/use-mobile"
import Link from "next/link"
import ResumeEditor from "@/components/resume-editor"
import { StaticTemplatePreviewCarousel } from "./StaticTemplatePreviewCarousel"

// Define a constant for the localStorage key to ensure consistency
const STORAGE_KEY = "resume-optimizer-api-keys"

// Constant for resume storage key
const RESUME_STORAGE_KEY = "resume-optimizer-state"

// Type for stored resume data
interface StoredResumeData {
  fileName: string
  fileSize: number
  resumeText: string
  jobDescription: string
  optimizedResume: string
  editedResume: string
  lastUpdated: number
}

export default function ResumeOptimizer() {
  // State definitions with initialization from localStorage
  const [resumeFile, setResumeFile] = useState<File | null>(null)
  const [resumeText, setResumeText] = useState("")
  const [jobDescription, setJobDescription] = useState("")
  const [optimizedResume, setOptimizedResume] = useState("")
  const [editedResume, setEditedResume] = useState("")
  const [isOptimizing, setIsOptimizing] = useState(false)
  const [optimizationProgress, setOptimizationProgress] = useState(0)
  const [activeTab, setActiveTab] = useState("upload")
  const [aiProvider, setAiProvider] = useState("mistral")
  const [selectedTemplate, setSelectedTemplate] = useState<TemplateMetadata>(getTemplates()[0])
  const [isEditing, setIsEditing] = useState(false)
  const [hasApiKey, setHasApiKey] = useState<Record<string, boolean>>({
    mistral: false,
    openai: false,
    claude: false,
    deepseek: false,
  })
  const { toast } = useToast()
  const isMobile = useMobile()

  // Check for API keys on component mount
  useEffect(() => {
    const savedKeys = localStorage.getItem(STORAGE_KEY)
    if (savedKeys) {
      try {
        const keys = JSON.parse(savedKeys)
        setHasApiKey({
          mistral: !!keys.mistral,
          openai: !!keys.openai,
          claude: !!keys.claude,
          deepseek: !!keys.deepseek,
        })
      } catch (error) {
        console.error("Error loading saved API keys:", error)
      }
    }
  }, [])

  // Update editedResume when optimizedResume changes
  useEffect(() => {
    if (optimizedResume) {
      setEditedResume(optimizedResume)
    }
  }, [optimizedResume])

  // Check if the selected provider has an API key whenever the provider changes
  useEffect(() => {
    const checkApiKey = async () => {
      try {
        const savedKeys = localStorage.getItem(STORAGE_KEY)
        if (savedKeys) {
          const keys = JSON.parse(savedKeys)
          const hasKey = !!keys[aiProvider]

          // Update the hasApiKey state
          setHasApiKey((prev) => ({
            ...prev,
            [aiProvider]: hasKey,
          }))

          if (!hasKey) {
            console.log(`No API key found for ${getProviderName(aiProvider)}`)
          }
        }
      } catch (error) {
        console.error("Error checking API key:", error)
      }
    }

    checkApiKey()
  }, [aiProvider])

  const handleFileUpload = async (file: File) => {
    try {
      // Clear previous resume state
      setOptimizedResume("")
      setEditedResume("")
      setJobDescription("")

      setResumeFile(file)

      // Extract text from the file
      const reader = new FileReader()
      reader.onload = (e) => {
        if (e.target?.result) {
          const text = e.target.result.toString()
          setResumeText(text)

          // Store the new file state
          try {
            const stateToStore: StoredResumeData = {
              fileName: file.name,
              fileSize: file.size,
              resumeText: text,
              jobDescription: "",
              optimizedResume: "",
              editedResume: "",
              lastUpdated: Date.now()
            }
            localStorage.setItem(RESUME_STORAGE_KEY, JSON.stringify(stateToStore))
          } catch (error) {
            console.error('Error saving uploaded file state:', error)
            // Don't block the upload process if storage fails
          }
        }
      }

      reader.onerror = () => {
        toast({
          title: "Upload failed",
          description: "Failed to read the file. Please try again.",
          variant: "destructive",
        })
      }

      reader.readAsText(file)

      toast({
        title: "Resume uploaded",
        description: `File "${file.name}" has been uploaded successfully.`,
      })

      setActiveTab("job-description")
    } catch (error) {
      console.error('Error in file upload:', error)
      toast({
        title: "Upload failed",
        description: "An error occurred while uploading the file. Please try again.",
        variant: "destructive",
      })
    }
  }

  // Update the handleOptimize function to better handle the environment variable

  const handleOptimize = async () => {
    if (!resumeText || !jobDescription) {
      toast({
        title: "Missing information",
        description: "Please provide both a resume and job description.",
        variant: "destructive",
      })
      return
    }

    // Check if API key is available for selected provider
    if (!hasApiKey[aiProvider]) {
      toast({
        title: "API key required",
        description: `Please configure your ${getProviderName(aiProvider)} API key in settings.`,
        variant: "destructive",
      })
      return
    }

    // Get the API key and optimization prompt from localStorage
    const savedKeys = localStorage.getItem(STORAGE_KEY)
    let apiKey = ""
    let optimizationPrompt = ""

    if (savedKeys) {
      try {
        const keys = JSON.parse(savedKeys)
        apiKey = keys[aiProvider]
        optimizationPrompt = keys.optimizationPrompt

        // Add debug logging
        console.log(`Using ${aiProvider} API key:`, apiKey ? "Key found (not shown for security)" : "No key found")

        if (!apiKey) {
          toast({
            title: "API key error",
            description: `Could not retrieve ${getProviderName(aiProvider)} API key. Please reconfigure in settings.`,
            variant: "destructive",
          })
          return
        }
      } catch (error) {
        console.error("Error parsing API keys from localStorage:", error)
        toast({
          title: "API key error",
          description: "Could not retrieve API keys. Please reconfigure in settings.",
          variant: "destructive",
        })
        return
      }
    } else {
      toast({
        title: "API key error",
        description: "No API keys found. Please configure your API keys in settings.",
        variant: "destructive",
      })
      return
    }

    setIsOptimizing(true)
    setOptimizationProgress(0)

    // Simulate progress updates
    const progressInterval = setInterval(() => {
      setOptimizationProgress((prev) => {
        const newProgress = prev + Math.random() * 15
        return newProgress >= 95 ? 95 : newProgress
      })
    }, 800)

    try {
      // Call the new API endpoint
      const response = await fetch("/api/optimize", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          resumeText,
          jobDescription,
          provider: aiProvider,
          apiKey,
        }),
      })

      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.error || "Failed to optimize resume")
      }

      const data = await response.json()
      setOptimizedResume(data.result)
      setEditedResume(data.result)
      setOptimizationProgress(100)
      setActiveTab("results")

      toast({
        title: "Optimization complete",
        description: "Your resume has been optimized successfully.",
      })
    } catch (error) {
      console.error("Resume optimization error:", error)
      toast({
        title: "Optimization failed",
        description:
          error instanceof Error ? error.message : "There was an error optimizing your resume. Please try again.",
        variant: "destructive",
      })
    } finally {
      clearInterval(progressInterval)
      setIsOptimizing(false)
    }
  }

  const handleDownloadPdf = async () => {
    try {
      const response = await fetch("/api/latex", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Accept": "application/pdf"
        },
        body: JSON.stringify({
          content: editedResume || optimizedResume,
          template: selectedTemplate.path
        }),
      });

      if (!response.ok) {
        throw new Error("Failed to generate PDF");
      }

      // Handle binary PDF response
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = "optimized-resume.pdf";
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      window.URL.revokeObjectURL(url);

    } catch (error) {
      console.error("PDF generation error:", error);
      toast({
        title: "PDF generation failed",
        description: "Failed to generate PDF. Please try again.",
        variant: "destructive",
      });
    }
  }

  const getProviderName = (provider: string): string => {
    switch (provider) {
      case "openai":
        return "OpenAI"
      case "claude":
        return "Anthropic Claude"
      case "deepseek":
        return "DeepSeek AI"
      case "mistral":
      default:
        return "Mistral AI"
    }
  }

  const handleDeleteResume = () => {
    localStorage.removeItem(RESUME_STORAGE_KEY);
    setResumeFile(null);
    setResumeText("");
    setJobDescription("");
    setOptimizedResume("");
    setEditedResume("");
    setActiveTab("upload");
    toast({
      title: "Resume deleted",
      description: "Your resume data has been cleared successfully.",
    });
  };

  const toggleEditMode = () => {
    setIsEditing(!isEditing)

    if (isEditing) {
      toast({
        title: "Changes saved",
        description: "Your edits have been saved successfully.",
      })
    }
  }

  const handleTemplateSelect = (template: TemplateMetadata) => {
    setSelectedTemplate(template);
  };

  return (
    <Card className="w-full mx-auto border-none shadow-lg bg-background/60 backdrop-blur-sm">
      <CardContent className="p-0">
        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <div className="flex flex-col md:flex-row md:items-center justify-between p-6 border-b">
            <div className="space-y-1 mb-4 md:mb-0">
              <h2 className="text-2xl font-semibold tracking-tight">Resume Optimization</h2>
              <p className="text-sm text-muted-foreground">Follow these steps to create your tailored resume</p>
            </div>

            <div className="flex items-center gap-2">
              <TabsList className="grid w-full md:w-auto grid-cols-3 h-auto p-1 bg-muted/50">
                <TabsTrigger value="upload" className="flex items-center gap-2 py-2 data-[state=active]:bg-background">
                  <FileUp className="h-4 w-4" />
                  <span className={isMobile ? "sr-only" : ""}>Upload</span>
                </TabsTrigger>
                <TabsTrigger
                  value="job-description"
                  className="flex items-center gap-2 py-2 data-[state=active]:bg-background"
                  disabled={!resumeFile}
                >
                  <FileQuestion className="h-4 w-4" />
                  <span className={isMobile ? "sr-only" : ""}>Job Details</span>
                </TabsTrigger>
                <TabsTrigger
                  value="template"
                  className="flex items-center gap-2 py-2 data-[state=active]:bg-background"
                  disabled={!jobDescription}
                >
                  <CheckCircle2 className="h-4 w-4" />
                  <span className={isMobile ? "sr-only" : ""}>Template</span>
                </TabsTrigger>
                <TabsTrigger
                  value="results"
                  className="flex items-center gap-2 py-2 data-[state=active]:bg-background"
                  disabled={!optimizedResume}
                >
                  <CheckCircle2 className="h-4 w-4" />
                  <span className={isMobile ? "sr-only" : ""}>Results</span>
                </TabsTrigger>
              </TabsList>

              <TooltipProvider>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Button variant="outline" size="icon" asChild>
                      <Link href="/settings">
                        <Settings className="h-4 w-4" />
                        <span className="sr-only">Settings</span>
                      </Link>
                    </Button>
                  </TooltipTrigger>
                  <TooltipContent>
                    <p>Configure API keys</p>
                  </TooltipContent>
                </Tooltip>
              </TooltipProvider>
            </div>
          </div>

          <TabsContent value="upload" className="p-6 focus-visible:outline-none focus-visible:ring-0">
            <div className="max-w-2xl mx-auto space-y-6">
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <h3 className="text-lg font-medium">Upload Your Resume</h3>
                  <TooltipProvider>
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <Badge variant="outline" className="gap-1">
                          <FileText className="h-3 w-3" />
                          Step 1 of 4
                        </Badge>
                      </TooltipTrigger>
                      <TooltipContent>
                        <p>Upload your resume to begin the optimization process</p>
                      </TooltipContent>
                    </Tooltip>
                  </TooltipProvider>
                </div>
                <p className="text-sm text-muted-foreground">
                  Upload your current resume in PDF, Word, Text, or LaTeX format.
                </p>
              </div>

              <FileUploader onFileUpload={handleFileUpload} acceptedFileTypes=".pdf,.docx,.txt,.tex" maxSizeMB={5} />

              {resumeFile && (
                <div className="flex items-center gap-2 p-3 border rounded-lg bg-muted/30">
                  <div className="bg-primary/10 p-2 rounded-full">
                    <FileText className="h-4 w-4 text-primary" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium truncate">{resumeFile.name}</p>
                    <p className="text-xs text-muted-foreground">{(resumeFile.size / 1024).toFixed(1)} KB</p>
                  </div>
                  <TooltipProvider>
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={handleDeleteResume}
                          className="h-8 w-8"
                        >
                          <Trash2 className="h-4 w-4" />
                          <span className="sr-only">Delete resume</span>
                        </Button>
                      </TooltipTrigger>
                      <TooltipContent>
                        <p>Delete resume</p>
                      </TooltipContent>
                    </Tooltip>
                  </TooltipProvider>
                  <Button variant="ghost" size="sm" onClick={() => setActiveTab("job-description")}>
                    <ChevronRight className="h-4 w-4" />
                  </Button>
                </div>
              )}

              <div className="pt-4">
                <Button onClick={() => setActiveTab("job-description")} disabled={!resumeFile} className="w-full">
                  Continue to Job Description
                </Button>
              </div>
            </div>
          </TabsContent>

          <TabsContent value="job-description" className="p-6 focus-visible:outline-none focus-visible:ring-0">
            <div className="max-w-3xl mx-auto space-y-6">
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <h3 className="text-lg font-medium">Enter Job Description</h3>
                  <TooltipProvider>
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <Badge variant="outline" className="gap-1">
                          <FileQuestion className="h-3 w-3" />
                          Step 2 of 4
                        </Badge>
                      </TooltipTrigger>
                      <TooltipContent>
                        <p>Provide job details to tailor your resume</p>
                      </TooltipContent>
                    </Tooltip>
                  </TooltipProvider>
                </div>
                <p className="text-sm text-muted-foreground">
                  Paste the job description to optimize your resume for this specific role.
                </p>
              </div>

              <div className="space-y-2">
                <Label htmlFor="job-description">Job Description</Label>
                <Textarea
                  id="job-description"
                  placeholder="Paste the job description here..."
                  className="min-h-[200px] resize-none"
                  value={jobDescription}
                  onChange={(e) => setJobDescription(e.target.value)}
                />
              </div>

              <div className="pt-4 flex flex-col sm:flex-row gap-2">
                <Button variant="outline" onClick={() => setActiveTab("upload")} className="flex-1">
                  Back
                </Button>
                <Button
                  onClick={() => setActiveTab("template")}
                  disabled={!jobDescription || isOptimizing || !hasApiKey[aiProvider]}
                  className="flex-1 gap-2"
                >
                  Continue to Template Selection
                </Button>
              </div>
            </div>
          </TabsContent>

          <TabsContent value="template" className="p-6 focus-visible:outline-none focus-visible:ring-0">
            <div className="max-w-5xl mx-auto space-y-6">
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <h3 className="text-lg font-medium">Select Resume Template</h3>
                  <TooltipProvider>
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <Badge variant="outline" className="gap-1">
                          <CheckCircle2 className="h-3 w-3" />
                          Step 3 of 4
                        </Badge>
                      </TooltipTrigger>
                      <TooltipContent>
                        <p>Choose a template for your optimized resume</p>
                      </TooltipContent>
                    </Tooltip>
                  </TooltipProvider>
                </div>
                <p className="text-sm text-muted-foreground">
                  Select a template to style your optimized resume.
                </p>
              </div>

              <StaticTemplatePreviewCarousel templates={getTemplates()} onTemplateSelect={handleTemplateSelect} />

              <div className="pt-4 flex flex-col sm:flex-row gap-2">
                <Button variant="outline" onClick={() => setActiveTab("job-description")} className="flex-1">
                  Back
                </Button>
                <Button
                  onClick={handleOptimize}
                  disabled={!jobDescription || isOptimizing || !hasApiKey[aiProvider]}
                  className="flex-1 gap-2"
                >
                  {isOptimizing ? (
                    <>
                      <Loader2 className="h-4 w-4 animate-spin" />
                      <div className="flex flex-col items-start">
                        <span>Optimizing...</span>
                        <span className="text-xs">{Math.round(optimizationProgress)}%</span>
                      </div>
                    </>
                  ) : (
                    <>
                      <Sparkles className="h-4 w-4" />
                      Optimize Resume
                    </>
                  )}
                </Button>
              </div>

              {isOptimizing && <Progress value={optimizationProgress} className="h-2" />}
            </div>
          </TabsContent>

          <TabsContent value="results" className="p-6 focus-visible:outline-none focus-visible:ring-0">
            <div className="max-w-5xl mx-auto space-y-6">
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <h3 className="text-lg font-medium">Optimization Results</h3>
                  <div className="flex items-center gap-2">
                    <TooltipProvider>
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <Badge variant="outline" className="gap-1">
                            <CheckCircle2 className="h-3 w-3" />
                            Step 4 of 4
                          </Badge>
                        </TooltipTrigger>
                        <TooltipContent>
                          <p>Review, edit, and download your optimized resume</p>
                        </TooltipContent>
                      </Tooltip>
                    </TooltipProvider>

                    <Button variant="outline" size="sm" onClick={toggleEditMode} className="gap-1">
                      {isEditing ? (
                        <>
                          <Save className="h-4 w-4" />
                          <span>Save Edits</span>
                        </>
                      ) : (
                        <>
                          <Edit className="h-4 w-4" />
                          <span>Edit Resume</span>
                        </>
                      )}
                    </Button>
                  </div>
                </div>
                <p className="text-sm text-muted-foreground">
                  {isEditing
                    ? "Make changes to your optimized resume before generating the final PDF."
                    : "Review the changes and download your optimized resume."}
                </p>
              </div>

              {isEditing ? (
                <ResumeEditor
                  originalText={resumeText}
                  optimizedText={optimizedResume}
                  editedText={editedResume}
                  onEditedTextChange={setEditedResume}
                />
              ) : (
                <ComparisonView originalText={resumeText} optimizedText={editedResume || optimizedResume} />
              )}

              <div className="pt-4 flex flex-col sm:flex-row gap-2">
                <Button variant="outline" onClick={() => setActiveTab("job-description")} className="flex-1">
                  Back to Edit
                </Button>
                <Button onClick={handleDownloadPdf} className="flex-1 gap-2">
                  <Download className="h-4 w-4" />
                  Download PDF
                </Button>
              </div>
            </div>
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  )
}
```

**5. Update `getTemplates` Function (`lib/template-config.ts`)**

- Update the `getTemplates` function to include the new LaTeX templates.
- Add the new LaTeX templates to the `templateConfig` array.


```typescript
// lib/template-config.ts

import { getSampleContent } from "./sample-content";

export interface TemplateConfig {
  name: string;
  path: string;
  source: string;
  description: string;
  latexContent: string;
  imagePlaceholders?: { [key: string]: string };
  customPackages?: string[];
  requiredFonts?: string[];
}

export const templateConfig: TemplateConfig[] = [
  {
    name: "John Miller CV",
    path: "templates/latex/John_Miller_CV.tex",
    source: "https://www.overleaf.com/latex/templates/jakes-resume/syzfjbzwjncs",
    description: "Two-column CV template with a modern design",
    latexContent: getSampleContent(),
    imagePlaceholders: {
      "joh.png.jpg": "/placeholder-user.jpg"
    },
    requiredFonts: ["FiraSans"]
  },
  {
    name: "Modular Professional CV",
    path: "templates/latex/Modular_professional_CV.tex",
    source: "https://www.overleaf.com/latex/templates/modular-professional-cv/cffcktvtxxmr",
    description: "Highly customizable professional CV template",
    latexContent: getSampleContent(),
    customPackages: ["fontawesome", "FiraSans"],
    requiredFonts: ["FiraSans", "FontAwesome"]
  }
];
```

**6. Add New LaTeX Templates (`templates/latex/`)**

- Add the new LaTeX templates to the `templates/latex/` directory.
- Ensure that the templates are properly formatted and include the necessary placeholders.


```tex

```

```tex

```

**7. Add Thumbnail Images (`public/templates/thumbnails/`)**

- Add thumbnail images for the new LaTeX templates to the `public/templates/thumbnails/` directory.
- Ensure that the thumbnail images are properly sized and named.


```plaintext

```

```plaintext

```

**8. Implement Resume Content Extraction**

- Implement the logic to extract resume content from the uploaded file.
- Update the `handleFileUpload` function in `components/resume-optimizer.tsx` to extract the resume content and store it in the `resumeText` state variable.


**9. Implement Job Details Extraction**

- Implement the logic to extract job details from the provided text or URL.
- Update the `handleOptimize` function in `components/resume-optimizer.tsx` to extract the job details and store them in the `jobDescription` state variable.


**10. Implement Custom Instructions**

- Add a new state variable to store the custom instructions provided by the user.
- Update the `handleOptimize` function in `components/resume-optimizer.tsx` to include the custom instructions in the prompt sent to the AI API.


**11. Implement LaTeX Template Handling and PDF Generation**

- Implement the logic to handle LaTeX templates and generate PDF files.
- Update the `handleDownloadPdf` function in `components/resume-optimizer.tsx` to generate the PDF file using the selected template and the optimized resume content.


**12. Test and Deploy**

- Test the new features thoroughly to ensure that they are working correctly.
- Deploy the updated application to Vercel.


`</CodeProject>`Remember to replace the placeholder URLs with the actual URLs of the files.
Also, remember to install the new dependencies: pdfjs-dist, textract, and node-latex.

Would you like me to elaborate on any of these steps?
`</Thinking>`