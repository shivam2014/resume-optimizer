"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { useToast } from "@/hooks/use-toast"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Eye, EyeOff, Save, Key, AlertCircle, CheckCircle2, Loader2, Sparkles } from "lucide-react"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import Link from "next/link"
import { Textarea } from "@/components/ui/textarea"

// Update the ApiKeys type to include the optimization prompt
type ApiKeys = {
  mistral: string
  openai: string
  claude: string
  deepseek: string
  optimizationPrompt: string
}

// Add the default optimization prompt
const DEFAULT_OPTIMIZATION_PROMPT = `# Professional Resume Template Guidelines

## 1. HEADER
- Full name in large letters (centered)
- Contact information on one line including: phone | email | LinkedIn | relevant visa/work permit status
- Keep contact line concise and separated by vertical bars (|)

## 2. PROFESSIONAL SUMMARY
- 2-3 lines maximum
- Structure: [Role/Title] with [X] years of experience in [key areas]. Skilled in [core competencies], with [notable achievement/capability].
- Focus on quantifiable experience and industry-specific expertise

## 3. SKILLS SECTION
Format in categories with 4-5 bullet points:
- Technical Expertise: Core domain-specific skills
- Software Development: Relevant programming languages and tools  
- Systems/Domain Knowledge: Industry-specific methodologies
- Project Leadership: Management and soft skills
- Tools: Specific software/platforms used

## 4. EXPERIENCE SECTION
For each position:
- Job Title - Company Name (bold) [right-aligned dates]
- Company Location [right-aligned]
- 3-4 bullet points per role that:
  * Start with strong action verbs
  * Include quantifiable achievements (%, numbers, scale)
  * Highlight technical skills used
  * Demonstrate impact and results
  * Follow format: Action Verb + Project/Task + Technology/Method + Result/Impact
  * Focus on most relevant accomplishments for the target role

## 5. EDUCATION
- List degrees in reverse chronological order
- Include: Institution Name - Degree Program [right-aligned dates]
- Keep concise, focus on relevant specializations

## 6. ADDITIONAL SECTIONS (if relevant)
- Professional Development & Languages
- Publications/Patents  
- Significant Projects
- Certifications
- Language Proficiencies

## Key Guidelines
1. Use bullet points for all accomplishments
2. Quantify achievements where possible
3. Emphasize technical skills relevant to the target position
4. Maintain consistent formatting throughout
5. Keep to one page
6. Use present tense for current roles, past tense for previous positions

## Using The Template
When applying this template, analyze the target job description and:
1. Match keywords from the job posting
2. Prioritize relevant technical skills
3. Highlight experiences that directly relate to the role's requirements
4. Adjust bullet points to emphasize matching qualifications
5. Maintain the same professional tone and quantifiable achievements format`

// Define a constant for the localStorage key to ensure consistency
const STORAGE_KEY = "resume-optimizer-api-keys"

export default function ApiKeySettings() {
  const [apiKeys, setApiKeys] = useState<ApiKeys>({
    mistral: "",
    openai: "",
    claude: "",
    deepseek: "",
    optimizationPrompt: DEFAULT_OPTIMIZATION_PROMPT,
  })

  const [showKeys, setShowKeys] = useState<Record<string, boolean>>({
    mistral: false,
    openai: false,
    claude: false,
    deepseek: false,
  })

  const [isSaving, setIsSaving] = useState(false)
  const { toast } = useToast()

  // Load saved keys on component mount
  useEffect(() => {
    try {
      const savedKeys = localStorage.getItem(STORAGE_KEY)
      if (savedKeys) {
        const parsedKeys = JSON.parse(savedKeys)
        console.log("Loaded API keys:", {
          mistral: !!parsedKeys.mistral,
          openai: !!parsedKeys.openai,
          claude: !!parsedKeys.claude,
          deepseek: !!parsedKeys.deepseek,
          hasOptimizationPrompt: !!parsedKeys.optimizationPrompt,
        })

        // Ensure the optimization prompt exists, or use the default
        if (!parsedKeys.optimizationPrompt) {
          parsedKeys.optimizationPrompt = DEFAULT_OPTIMIZATION_PROMPT
        }

        setApiKeys({
          mistral: parsedKeys.mistral || "",
          openai: parsedKeys.openai || "",
          claude: parsedKeys.claude || "",
          deepseek: parsedKeys.deepseek || "",
          optimizationPrompt: parsedKeys.optimizationPrompt || DEFAULT_OPTIMIZATION_PROMPT,
        })
      }
    } catch (error) {
      console.error("Error loading saved API keys:", error)
      // Use defaults if there's an error
      setApiKeys({
        mistral: "",
        openai: "",
        claude: "",
        deepseek: "",
        optimizationPrompt: DEFAULT_OPTIMIZATION_PROMPT,
      })
    }
  }, [])

  const handleSaveKeys = () => {
    setIsSaving(true)

    // Simulate API call delay
    setTimeout(() => {
      try {
        // Ensure we're not saving empty strings for API keys
        const keysToSave = {
          ...apiKeys,
          mistral: apiKeys.mistral.trim(),
          openai: apiKeys.openai.trim(),
          claude: apiKeys.claude.trim(),
          deepseek: apiKeys.deepseek.trim(),
          optimizationPrompt: apiKeys.optimizationPrompt || DEFAULT_OPTIMIZATION_PROMPT,
        }

        // Save to localStorage
        localStorage.setItem(STORAGE_KEY, JSON.stringify(keysToSave))

        // Log success (without showing the actual keys)
        console.log("API keys saved successfully:", {
          mistral: !!keysToSave.mistral,
          openai: !!keysToSave.openai,
          claude: !!keysToSave.claude,
          deepseek: !!keysToSave.deepseek,
          hasOptimizationPrompt: !!keysToSave.optimizationPrompt,
        })

        // Update the state with the trimmed values
        setApiKeys(keysToSave)

        toast({
          title: "Settings saved",
          description: "Your API keys and optimization prompt have been saved successfully.",
        })
      } catch (error) {
        console.error("Error saving API keys:", error)
        toast({
          title: "Error saving settings",
          description: "There was an error saving your settings. Please try again.",
          variant: "destructive",
        })
      } finally {
        setIsSaving(false)
      }
    }, 1000)
  }

  const toggleShowKey = (provider: keyof Omit<ApiKeys, "optimizationPrompt">) => {
    setShowKeys((prev) => ({
      ...prev,
      [provider]: !prev[provider],
    }))
  }

  const handleKeyChange = (provider: keyof Omit<ApiKeys, "optimizationPrompt">, value: string) => {
    setApiKeys((prev) => ({
      ...prev,
      [provider]: value,
    }))
  }

  const getKeyStatus = (provider: keyof Omit<ApiKeys, "optimizationPrompt">) => {
    if (!apiKeys[provider]) return "missing"
    return "valid" // In a real app, you would validate the key format or test it
  }

  // Add a function to reset the optimization prompt to default
  const resetOptimizationPrompt = () => {
    setApiKeys((prev) => ({
      ...prev,
      optimizationPrompt: DEFAULT_OPTIMIZATION_PROMPT,
    }))

    toast({
      title: "Prompt reset",
      description: "The optimization prompt has been reset to the default template.",
    })
  }

  // Add this new section to the render function, after the API keys card
  return (
    <div className="space-y-8">
      {/* Existing API Keys Card */}
      <Card className="border shadow-sm">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Key className="h-5 w-5" />
            API Keys
          </CardTitle>
          <CardDescription>
            Configure your API keys for different AI providers. These keys are required to use the resume optimization
            features.
          </CardDescription>
        </CardHeader>

        <CardContent>
          <Alert className="mb-6">
            <AlertCircle className="h-4 w-4" />
            <AlertTitle>Important</AlertTitle>
            <AlertDescription>
              Your API keys are stored locally in your browser. We never send your keys to our servers.
            </AlertDescription>
          </Alert>

          <Tabs defaultValue="mistral" className="w-full">
            <TabsList className="grid grid-cols-4 mb-6">
              <TabsTrigger value="mistral">Mistral AI</TabsTrigger>
              <TabsTrigger value="openai">OpenAI</TabsTrigger>
              <TabsTrigger value="claude">Claude</TabsTrigger>
              <TabsTrigger value="deepseek">DeepSeek</TabsTrigger>
            </TabsList>

            <TabsContent value="mistral" className="space-y-4">
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <Label htmlFor="mistral-key">Mistral AI API Key</Label>
                  {getKeyStatus("mistral") === "valid" && (
                    <span className="text-xs flex items-center gap-1 text-green-500">
                      <CheckCircle2 className="h-3 w-3" />
                      Valid
                    </span>
                  )}
                </div>
                <div className="flex gap-2">
                  <div className="relative flex-1">
                    <Input
                      id="mistral-key"
                      type={showKeys.mistral ? "text" : "password"}
                      placeholder="Enter your Mistral API key"
                      value={apiKeys.mistral}
                      onChange={(e) => handleKeyChange("mistral", e.target.value)}
                    />
                    <Button
                      variant="ghost"
                      size="icon"
                      type="button"
                      className="absolute right-0 top-0 h-full"
                      onClick={() => toggleShowKey("mistral")}
                    >
                      {showKeys.mistral ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                    </Button>
                  </div>
                </div>
              </div>

              <div className="text-sm text-muted-foreground">
                <p>Don't have a Mistral AI API key?</p>
                <a
                  href="https://console.mistral.ai/"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-primary hover:underline"
                >
                  Get one from the Mistral AI platform
                </a>
              </div>
            </TabsContent>

            <TabsContent value="openai" className="space-y-4">
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <Label htmlFor="openai-key">OpenAI API Key</Label>
                  {getKeyStatus("openai") === "valid" && (
                    <span className="text-xs flex items-center gap-1 text-green-500">
                      <CheckCircle2 className="h-3 w-3" />
                      Valid
                    </span>
                  )}
                </div>
                <div className="flex gap-2">
                  <div className="relative flex-1">
                    <Input
                      id="openai-key"
                      type={showKeys.openai ? "text" : "password"}
                      placeholder="Enter your OpenAI API key"
                      value={apiKeys.openai}
                      onChange={(e) => handleKeyChange("openai", e.target.value)}
                    />
                    <Button
                      variant="ghost"
                      size="icon"
                      type="button"
                      className="absolute right-0 top-0 h-full"
                      onClick={() => toggleShowKey("openai")}
                    >
                      {showKeys.openai ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                    </Button>
                  </div>
                </div>
              </div>

              <div className="text-sm text-muted-foreground">
                <p>Don't have an OpenAI API key?</p>
                <a
                  href="https://platform.openai.com/api-keys"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-primary hover:underline"
                >
                  Get one from the OpenAI platform
                </a>
              </div>
            </TabsContent>

            <TabsContent value="claude" className="space-y-4">
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <Label htmlFor="claude-key">Anthropic Claude API Key</Label>
                  {getKeyStatus("claude") === "valid" && (
                    <span className="text-xs flex items-center gap-1 text-green-500">
                      <CheckCircle2 className="h-3 w-3" />
                      Valid
                    </span>
                  )}
                </div>
                <div className="flex gap-2">
                  <div className="relative flex-1">
                    <Input
                      id="claude-key"
                      type={showKeys.claude ? "text" : "password"}
                      placeholder="Enter your Anthropic Claude API key"
                      value={apiKeys.claude}
                      onChange={(e) => handleKeyChange("claude", e.target.value)}
                    />
                    <Button
                      variant="ghost"
                      size="icon"
                      type="button"
                      className="absolute right-0 top-0 h-full"
                      onClick={() => toggleShowKey("claude")}
                    >
                      {showKeys.claude ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                    </Button>
                  </div>
                </div>
              </div>

              <div className="text-sm text-muted-foreground">
                <p>Don't have a Claude API key?</p>
                <a
                  href="https://console.anthropic.com/settings/keys"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-primary hover:underline"
                >
                  Get one from the Anthropic platform
                </a>
              </div>
            </TabsContent>

            <TabsContent value="deepseek" className="space-y-4">
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <Label htmlFor="deepseek-key">DeepSeek AI API Key</Label>
                  {getKeyStatus("deepseek") === "valid" && (
                    <span className="text-xs flex items-center gap-1 text-green-500">
                      <CheckCircle2 className="h-3 w-3" />
                      Valid
                    </span>
                  )}
                </div>
                <div className="flex gap-2">
                  <div className="relative flex-1">
                    <Input
                      id="deepseek-key"
                      type={showKeys.deepseek ? "text" : "password"}
                      placeholder="Enter your DeepSeek AI API key"
                      value={apiKeys.deepseek}
                      onChange={(e) => handleKeyChange("deepseek", e.target.value)}
                    />
                    <Button
                      variant="ghost"
                      size="icon"
                      type="button"
                      className="absolute right-0 top-0 h-full"
                      onClick={() => toggleShowKey("deepseek")}
                    >
                      {showKeys.deepseek ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                    </Button>
                  </div>
                </div>
              </div>

              <div className="text-sm text-muted-foreground">
                <p>Don't have a DeepSeek AI API key?</p>
                <a
                  href="https://platform.deepseek.com/"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-primary hover:underline"
                >
                  Get one from the DeepSeek platform
                </a>
              </div>
            </TabsContent>
          </Tabs>
        </CardContent>

        <CardFooter className="flex justify-between">
          <Button variant="outline" asChild>
            <Link href="/">Back to Home</Link>
          </Button>
          <Button onClick={handleSaveKeys} disabled={isSaving}>
            {isSaving ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Saving...
              </>
            ) : (
              <>
                <Save className="mr-2 h-4 w-4" />
                Save API Keys
              </>
            )}
          </Button>
        </CardFooter>
      </Card>

      {/* New Optimization Prompt Card */}
      <Card className="border shadow-sm">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Sparkles className="h-5 w-5" />
            Resume Optimization Prompt
          </CardTitle>
          <CardDescription>
            Customize the instructions given to the AI when optimizing resumes. This prompt guides the AI on how to
            structure and format the optimized resume.
          </CardDescription>
        </CardHeader>

        <CardContent>
          <div className="space-y-4">
            <Alert>
              <AlertCircle className="h-4 w-4" />
              <AlertTitle>Prompt Guidelines</AlertTitle>
              <AlertDescription>
                The default prompt includes professional resume template guidelines. You can customize this to focus on
                specific aspects or formatting preferences.
              </AlertDescription>
            </Alert>

            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <Label htmlFor="optimization-prompt">AI Optimization Instructions</Label>
                <Button variant="outline" size="sm" onClick={resetOptimizationPrompt} className="h-8 text-xs">
                  Reset to Default
                </Button>
              </div>
              <Textarea
                id="optimization-prompt"
                value={apiKeys.optimizationPrompt}
                onChange={(e) =>
                  setApiKeys((prev) => ({
                    ...prev,
                    optimizationPrompt: e.target.value,
                  }))
                }
                className="min-h-[300px] font-mono text-sm"
                placeholder="Enter instructions for the AI to follow when optimizing resumes..."
              />
              <p className="text-xs text-muted-foreground mt-2">
                This prompt will be sent to the AI along with the resume and job description to guide the optimization
                process.
              </p>
            </div>
          </div>
        </CardContent>

        <CardFooter className="flex justify-between">
          <Button variant="outline" asChild>
            <Link href="/">Back to Home</Link>
          </Button>
          <Button onClick={handleSaveKeys} disabled={isSaving}>
            {isSaving ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Saving...
              </>
            ) : (
              <>
                <Save className="mr-2 h-4 w-4" />
                Save Settings
              </>
            )}
          </Button>
        </CardFooter>
      </Card>

      {/* Usage & Billing Card */}
      <Card className="border shadow-sm">
        <CardHeader>
          <CardTitle>Usage & Billing</CardTitle>
          <CardDescription>Monitor your API usage and manage billing information</CardDescription>
        </CardHeader>

        <CardContent>
          <div className="space-y-4">
            <Alert>
              <AlertCircle className="h-4 w-4" />
              <AlertTitle>Usage Information</AlertTitle>
              <AlertDescription>
                Each resume optimization will use tokens from your AI provider account. Check your provider's dashboard
                for detailed usage statistics.
              </AlertDescription>
            </Alert>

            <div className="grid gap-4 md:grid-cols-4">
              <div className="space-y-2">
                <h4 className="text-sm font-medium">Mistral AI</h4>
                <p className="text-sm text-muted-foreground">
                  {apiKeys.mistral ? "API key configured" : "No API key configured"}
                </p>
              </div>

              <div className="space-y-2">
                <h4 className="text-sm font-medium">OpenAI</h4>
                <p className="text-sm text-muted-foreground">
                  {apiKeys.openai ? "API key configured" : "No API key configured"}
                </p>
              </div>

              <div className="space-y-2">
                <h4 className="text-sm font-medium">Claude</h4>
                <p className="text-sm text-muted-foreground">
                  {apiKeys.claude ? "API key configured" : "No API key configured"}
                </p>
              </div>

              <div className="space-y-2">
                <h4 className="text-sm font-medium">DeepSeek</h4>
                <p className="text-sm text-muted-foreground">
                  {apiKeys.deepseek ? "API key configured" : "No API key configured"}
                </p>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}

