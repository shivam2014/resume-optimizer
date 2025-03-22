"use client"

import { useState, useEffect } from "react"
import { getTemplates } from "@/lib/template-config"
import type { TemplateMetadata } from "@/types/templates"
import { ErrorBoundary } from "@/components/error-boundary"

interface OptimizationResponse {
  result: {
    optimizedText: string;
    extractedText: string;
    latexContent: string;
    improvements: string[];
    score: number;
  };
  error?: string;
}
import LatexPreview from "@/components/latex-preview"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Textarea } from "@/components/ui/textarea"
import { Label } from "@/components/ui/label"
// Remove optimizeResume import as we'll use the API directly
import {
  Loader2,
  FileText,
  Download,
  Sparkles,
  FileUp,
  FileQuestion,
  CheckCircle2,
  ChevronRight,
  Settings,
  AlertCircle,
  Edit,
  Save,
  Trash2,
} from "lucide-react"
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
  extractedResume: string
  optimizedResume: string
  editedResume: string
  latexContent: string
  lastUpdated: number
}

export default function ResumeOptimizer() {
  // State definitions with initialization from localStorage
  const [resumeFile, setResumeFile] = useState<File | null>(null)
  const [resumeText, setResumeText] = useState("")
  const [jobDescription, setJobDescription] = useState("")
  const [extractedResume, setExtractedResume] = useState("")
  const [optimizedResume, setOptimizedResume] = useState("")
  const [editedResume, setEditedResume] = useState("")
  const [latexContent, setLatexContent] = useState("")
  const [isOptimizing, setIsOptimizing] = useState(false)
  const [optimizationProgress, setOptimizationProgress] = useState(0)
  const [activeTab, setActiveTab] = useState("upload")
  const [aiProvider, setAiProvider] = useState("mistral")
  const [selectedTemplate, setSelectedTemplate] = useState<TemplateMetadata | null>(() => {
    try {
      const templates = getTemplates();
      return templates.length > 0 ? templates[0] : null;
    } catch (error) {
      console.error('Error initializing template:', error);
      return null;
    }
  });
  const [isTemplateLoading, setIsTemplateLoading] = useState(true);
  const [isEditing, setIsEditing] = useState(false)
  const [hasApiKey, setHasApiKey] = useState<Record<string, boolean>>({
    mistral: false,
    openai: false,
    claude: false,
    deepseek: false,
  })

  // Load saved resume state on component mount
  useEffect(() => {
    try {
      const savedState = localStorage.getItem(RESUME_STORAGE_KEY)
      if (savedState) {
        const parsedState: StoredResumeData = JSON.parse(savedState)
        
        // Check if the saved state is from within the last 24 hours
        const isRecent = (Date.now() - parsedState.lastUpdated) < 24 * 60 * 60 * 1000
        
        if (isRecent) {
          setResumeText(parsedState.resumeText)
          setJobDescription(parsedState.jobDescription)
          setExtractedResume(parsedState.extractedResume || '')
          setOptimizedResume(typeof parsedState.optimizedResume === 'string' ? parsedState.optimizedResume : '')
          setEditedResume(typeof parsedState.editedResume === 'string' ? parsedState.editedResume : '')
          setLatexContent(parsedState.latexContent || '')
          
          // Create a new File object from the stored metadata
          // Note: We can't restore the actual File object, but we can create a placeholder
          const mockFile = new File([parsedState.resumeText], parsedState.fileName, {
            type: 'text/plain',
          })
          setResumeFile(mockFile)
          
          // If we have resume data, set the active tab appropriately
          if (parsedState.optimizedResume) {
            setActiveTab('results')
          } else if (parsedState.resumeText) {
            setActiveTab('job-description')
          }
        } else {
          // Clear expired data
          localStorage.removeItem(RESUME_STORAGE_KEY)
        }
      }
    } catch (error) {
      console.error('Error loading saved resume state:', error)
      // Clear potentially corrupted data
      localStorage.removeItem(RESUME_STORAGE_KEY)
    }
  }, [])

  // Save resume state when relevant data changes
  useEffect(() => {
    // Always save state if we have either a file or optimized content
    if (resumeFile || optimizedResume) {
      try {
        const stateToStore: StoredResumeData = {
          fileName: resumeFile?.name || "resume.txt",
          fileSize: resumeFile?.size || 0,
          resumeText,
          jobDescription,
          extractedResume: extractedResume || '',
          optimizedResume: typeof optimizedResume === 'string' ? optimizedResume : '',
          editedResume: typeof editedResume === 'string' ? editedResume : '',
          latexContent: latexContent || '',
          lastUpdated: Date.now()
        }
        localStorage.setItem(RESUME_STORAGE_KEY, JSON.stringify(stateToStore))
      } catch (error) {
        console.error('Error saving resume state:', error)
      }
    }
  }, [resumeFile, resumeText, jobDescription, extractedResume, optimizedResume, editedResume, latexContent])

  // Cleanup storage when component unmounts
  useEffect(() => {
    return () => {
      // Clear storage if it's older than 24 hours
      try {
        const savedState = localStorage.getItem(RESUME_STORAGE_KEY)
        if (savedState) {
          const parsedState: StoredResumeData = JSON.parse(savedState)
          const isExpired = (Date.now() - parsedState.lastUpdated) >= 24 * 60 * 60 * 1000
          if (isExpired) {
            localStorage.removeItem(RESUME_STORAGE_KEY)
          }
        }
      } catch (error) {
        console.error('Error cleaning up storage:', error)
      }
    }
  }, [])
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

  // Handle template initialization and loading state
  useEffect(() => {
    setIsTemplateLoading(true)
    try {
      const templates = getTemplates()
      if (!selectedTemplate && templates.length > 0) {
        setSelectedTemplate(templates[0])
      }
    } catch (error) {
      console.error('Error loading templates:', error)
      toast({
        title: "Template Error",
        description: "Failed to load resume templates. Please try again.",
        variant: "destructive",
      })
    } finally {
      setIsTemplateLoading(false)
    }
  }, [])

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
              extractedResume: "",
              optimizedResume: "",
              editedResume: "",
              latexContent: "",
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

      const data = await response.json() as OptimizationResponse;
      
      // Validate the response structure and extract data
      if (!data.result || typeof data.result !== 'object') {
        throw new Error('Invalid response format');
      }

      const { optimizedText, extractedText, latexContent } = data.result;

      if (!optimizedText || typeof optimizedText !== 'string') {
        throw new Error('Missing optimized text in response');
      }

      // Set all the content
      setExtractedResume(extractedText?.trim() || resumeText.trim());
      setOptimizedResume(optimizedText.trim());
      setEditedResume(optimizedText.trim());
      setLatexContent(latexContent?.trim() || '');
      
      setOptimizationProgress(100);
      setActiveTab("results");

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

  const handleDownloadLatex = () => {
    try {
      const element = document.createElement("a");
      const file = new Blob([latexContent], { type: 'text/plain' });
      element.href = URL.createObjectURL(file);
      element.download = "resume.tex";
      document.body.appendChild(element);
      element.click();
      document.body.removeChild(element);
      URL.revokeObjectURL(element.href);
      
      toast({
        title: "LaTeX downloaded",
        description: "Your LaTeX file has been downloaded successfully.",
      });
    } catch (error) {
      console.error("LaTeX download error:", error);
      toast({
        title: "Download failed",
        description: "Failed to download LaTeX file. Please try again.",
        variant: "destructive",
      });
    }
  };

  const handleDownloadPdf = async () => {
    try {
      const response = await fetch("/api/latex", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          content: editedResume || optimizedResume,
          template: selectedTemplate?.path || getTemplates()[0].path
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

  return (
    <ErrorBoundary>
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
                          Step 1 of 3
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

              <FileUploader
                onFileUpload={handleFileUpload}
                acceptedFileTypes=".pdf,.docx,.txt,.tex"
                maxSizeMB={5}
                testId="file-upload-input"
              />

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
                          Step 2 of 3
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
                  data-testid="job-description-input"
                  data-testid="job-description-input"
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <Label htmlFor="ai-provider" className="flex items-center gap-2">
                    AI Provider
                    <HoverCard>
                      <HoverCardTrigger asChild>
                        <Button variant="ghost" size="icon" className="h-4 w-4">
                          <span className="sr-only">Info</span>
                          <svg
                            xmlns="http://www.w3.org/2000/svg"
                            viewBox="0 0 24 24"
                            fill="none"
                            stroke="currentColor"
                            strokeWidth="2"
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            className="h-4 w-4"
                          >
                            <circle cx="12" cy="12" r="10" />
                            <path d="M12 16v-4" />
                            <path d="M12 8h.01" />
                          </svg>
                        </Button>
                      </HoverCardTrigger>
                      <HoverCardContent className="w-80">
                        <div className="space-y-2">
                          <h4 className="text-sm font-semibold">AI Provider Selection</h4>
                          <p className="text-sm text-muted-foreground">
                            Choose the AI model that will optimize your resume. Different providers may have different
                            strengths.
                          </p>
                          <div className="grid grid-cols-2 gap-2 pt-2">
                            <div className="flex items-center gap-2">
                              <Avatar className="h-6 w-6">
                                <AvatarImage src="/placeholder.svg?height=24&width=24" />
                                <AvatarFallback>M</AvatarFallback>
                              </Avatar>
                              <span className="text-xs">Mistral AI</span>
                            </div>
                            <div className="flex items-center gap-2">
                              <Avatar className="h-6 w-6">
                                <AvatarImage src="/placeholder.svg?height=24&width=24" />
                                <AvatarFallback>O</AvatarFallback>
                              </Avatar>
                              <span className="text-xs">OpenAI</span>
                            </div>
                          </div>
                        </div>
                      </HoverCardContent>
                    </HoverCard>
                  </Label>
                  <Select value={aiProvider} onValueChange={setAiProvider}>
                    <SelectTrigger id="ai-provider" className="w-full">
                      <SelectValue placeholder="Select AI Provider" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="mistral" className="flex items-center gap-2">
                        <div className="flex items-center gap-2">
                          <Avatar className="h-6 w-6">
                            <AvatarImage src="/placeholder.svg?height=24&width=24" />
                            <AvatarFallback>M</AvatarFallback>
                          </Avatar>
                          <span>Mistral AI</span>
                        </div>
                      </SelectItem>
                      <SelectItem value="openai" className="flex items-center gap-2">
                        <div className="flex items-center gap-2">
                          <Avatar className="h-6 w-6">
                            <AvatarImage src="/placeholder.svg?height=24&width=24" />
                            <AvatarFallback>O</AvatarFallback>
                          </Avatar>
                          <span>OpenAI</span>
                        </div>
                      </SelectItem>
                      <SelectItem value="claude" className="flex items-center gap-2">
                        <div className="flex items-center gap-2">
                          <Avatar className="h-6 w-6">
                            <AvatarImage src="/placeholder.svg?height=24&width=24" />
                            <AvatarFallback>C</AvatarFallback>
                          </Avatar>
                          <span>Anthropic Claude</span>
                        </div>
                      </SelectItem>
                      <SelectItem value="deepseek" className="flex items-center gap-2">
                        <div className="flex items-center gap-2">
                          <Avatar className="h-6 w-6">
                            <AvatarImage src="/placeholder.svg?height=24&width=24" />
                            <AvatarFallback>D</AvatarFallback>
                          </Avatar>
                          <span>DeepSeek AI</span>
                        </div>
                      </SelectItem>
                    </SelectContent>
                  </Select>

                  {!hasApiKey[aiProvider] && (
                    <div className="text-xs text-amber-500 flex items-center gap-1 mt-1">
                      <AlertCircle className="h-3 w-3" />
                      <span>
                        API key not configured.{" "}
                        <Link href="/settings" className="underline">
                          Configure in settings
                        </Link>
                      </span>
                    </div>
                  )}
                </div>

                <div className="space-y-2">
                  <Label htmlFor="latex-template" className="flex items-center gap-2">
                    LaTeX Template
                    <Popover>
                      <PopoverTrigger asChild>
                        <Button variant="ghost" size="icon" className="h-4 w-4">
                          <span className="sr-only">Info</span>
                          <svg
                            xmlns="http://www.w3.org/2000/svg"
                            viewBox="0 0 24 24"
                            fill="none"
                            stroke="currentColor"
                            strokeWidth="2"
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            className="h-4 w-4"
                          >
                            <circle cx="12" cy="12" r="10" />
                            <path d="M12 16v-4" />
                            <path d="M12 8h.01" />
                          </svg>
                        </Button>
                      </PopoverTrigger>
                      <PopoverContent className="w-80">
                        <div className="grid gap-4">
                          <div className="space-y-2">
                            <h4 className="font-medium leading-none">Resume Templates</h4>
                            <p className="text-sm text-muted-foreground">Choose a template for your resume</p>
                          </div>
                          <div className="grid grid-cols-2 gap-4">
                            {getTemplates().map((template) => (
                              <div
                                key={template.path}
                                className={`border rounded p-2 hover:border-primary cursor-pointer ${
                                  selectedTemplate?.path === template.path ? 'border-primary' : ''
                                }`}
                                onClick={() => setSelectedTemplate(template)}
                              >
                                <div className="aspect-[8.5/11] relative rounded-sm overflow-hidden">
                                  <LatexPreview
                                    template={template.path}
                                    content={template.latexContent}
                                  />
                                </div>
                                <div className="mt-2 space-y-1">
                                  <p className="text-sm font-medium text-center">{template.name}</p>
                                  {template.source && (
                                    <a
                                      href={template.source}
                                      target="_blank"
                                      rel="noopener noreferrer"
                                      className="text-xs text-blue-500 hover:underline text-center block"
                                    >
                                      Source
                                    </a>
                                  )}
                                </div>
                              </div>
                            ))}
                          </div>
                        </div>
                      </PopoverContent>
                    </Popover>
                  </Label>
                  {isTemplateLoading ? (
                    <div className="flex items-center justify-center space-x-2 py-2">
                      <Loader2 className="h-4 w-4 animate-spin" />
                      <span className="text-sm">Loading templates...</span>
                    </div>
                  ) : (
                    <Select
                      value={selectedTemplate?.path || getTemplates()[0].path}
                      onValueChange={(path) => setSelectedTemplate(getTemplates().find(t => t.path === path) || getTemplates()[0])}
                    >
                      <SelectTrigger id="latex-template" className="w-full">
                        <SelectValue placeholder="Select Template" />
                      </SelectTrigger>
                      <SelectContent>
                        {getTemplates().map((template) => (
                          <SelectItem key={template.path} value={template.path}>
                            <div className="flex items-center justify-between w-full">
                              <span>{template.name}</span>
                              {template.source && (
                                <a
                                  href={template.source}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  onClick={(e) => e.stopPropagation()}
                                  className="text-xs text-blue-500 hover:underline ml-2"
                                >
                                  Source
                                </a>
                              )}
                            </div>
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  )}
                </div>
              </div>

              <div className="pt-4 flex flex-col sm:flex-row gap-2">
                <Button variant="outline" onClick={() => setActiveTab("upload")} className="flex-1">
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
                            Step 3 of 3
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

              <div data-testid="results-section">
                <div className="flex justify-end space-x-2 mb-4">
                  <Button onClick={handleDownloadPdf} data-testid="download-pdf-button">
                    Download PDF
                  </Button>
                  <Button onClick={handleDownloadLatex} data-testid="download-latex-button">
                    Download LaTeX
                  </Button>
                </div>
                {isEditing ? (
                  <ResumeEditor
                    originalText={resumeText}
                    optimizedText={optimizedResume || ''}
                    editedText={editedResume}
                    onEditedTextChange={setEditedResume}
                    data-testid="resume-editor"
                  />
                ) : (
                  <ComparisonView
                    originalText={extractedResume}
                    optimizedText={editedResume || optimizedResume || ''}
                    data-testid="comparison-view"
                  />
                )}
              </div>
              )}

              <div className="pt-4 flex flex-col sm:flex-row gap-2">
                <Button variant="outline" onClick={() => setActiveTab("job-description")} className="flex-1">
                  Back to Edit
                </Button>
                <Button
                  onClick={handleDownloadLatex}
                  disabled={isOptimizing || !latexContent}
                  variant="outline"
                  className="flex-1"
                >
                  <FileText className="mr-2 h-4 w-4" />
                  Download LaTeX
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
    </ErrorBoundary>
  )
}

