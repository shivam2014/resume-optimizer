import { useState, useRef } from "react"
import { Upload, FileText, Loader2 } from "lucide-react"
import { useToast } from "@/hooks/use-toast"
import { motion } from "framer-motion"
import { extractPDFText } from "@/lib/pdf-extractor"

interface FileUploaderProps {
  onFileUpload: (file: File, extractedText?: string) => void
  acceptedFileTypes: string
  maxSizeMB: number
  testId?: string
}

export default function FileUploader({ onFileUpload, acceptedFileTypes, maxSizeMB, testId }: FileUploaderProps) {
  const [isDragging, setIsDragging] = useState(false)
  const [isProcessing, setIsProcessing] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)
  const { toast } = useToast()

  const handleDragOver = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault()
    setIsDragging(true)
  }

  const handleDragLeave = () => {
    setIsDragging(false)
  }

  const handleDrop = async (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault()
    setIsDragging(false)

    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      await validateAndUploadFile(e.dataTransfer.files[0])
    }
  }

  const handleFileInputChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      await validateAndUploadFile(e.target.files[0])
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

    try {
      setIsProcessing(true)
      let extractedText: string | undefined

      // Handle PDF files
      if (fileExtension === '.pdf') {
        try {
          extractedText = await extractPDFText(file)
        } catch (error) {
          toast({
            title: "PDF Processing Error",
            description: "Failed to extract text from PDF file",
            variant: "destructive",
          })
          return
        }
      }

      // Pass both file and extracted text to parent
      onFileUpload(file, extractedText)
    } catch (error) {
      toast({
        title: "Error",
        description: "An error occurred while processing the file",
        variant: "destructive",
      })
    } finally {
      setIsProcessing(false)
    }
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
        data-testid={testId}
      />

      <div className="flex flex-col items-center justify-center gap-3">
        <div className="bg-primary/10 p-4 rounded-full">
          {isProcessing ? (
            <Loader2 className="h-6 w-6 text-primary animate-spin" />
          ) : (
            <Upload className="h-6 w-6 text-primary" />
          )}
        </div>
        <div className="space-y-1">
          <p className="font-medium">
            {isProcessing ? "Processing file..." : "Click to upload or drag and drop"}
          </p>
          <p className="text-sm text-muted-foreground">
            {acceptedFileTypes.replace(/,/g, ", ")} (Max {maxSizeMB}MB)
          </p>
        </div>
        <div className="flex items-center justify-center gap-2 mt-2">
          {acceptedFileTypes.split(",").map((type) => (
            <div
              key={type}
              className="flex items-center gap-1 text-xs text-muted-foreground bg-muted px-2 py-1 rounded-full"
            >
              <FileText className="h-3 w-3" />
              {type.replace(".", "").toUpperCase()}
            </div>
          ))}
        </div>
      </div>
    </motion.div>
  )
}
