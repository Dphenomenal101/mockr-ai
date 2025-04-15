"use client"

import type React from "react"

import { useState, useRef } from "react"
import { Upload, FileText } from "lucide-react"
import { useToast } from "@/hooks/use-toast"

interface FileUploadProps {
  onUpload: (file: File, text: string) => void
}

export default function FileUpload({ onUpload }: FileUploadProps) {
  const [isDragging, setIsDragging] = useState(false)
  const [isProcessing, setIsProcessing] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)
  const { toast } = useToast()

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault()
    setIsDragging(true)
  }

  const handleDragLeave = () => {
    setIsDragging(false)
  }

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault()
    setIsDragging(false)

    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      processFile(e.dataTransfer.files[0])
    }
  }

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      processFile(e.target.files[0])
    }
  }

  const processFile = async (file: File) => {
    if (!file) return

    const fileType = file.type
    if (fileType !== "application/pdf" && fileType !== "text/plain") {
      toast({
        title: "Invalid file type",
        description: "Please upload a PDF or TXT file",
        variant: "destructive",
      })
      return
    }

    setIsProcessing(true)

    try {
      // Create form data for upload
      const formData = new FormData()
      formData.append("file", file)
      formData.append(
        "metadata",
        JSON.stringify({
          title: file.name,
          scope: "resumes",
          type: "resume"
        })
      )

      // Upload to Ragie through our API route
      const uploadResponse = await fetch("/api/ragie/upload", {
        method: "POST",
        body: formData,
      })

      if (!uploadResponse.ok) {
        const error = await uploadResponse.json()
        throw new Error(error.error || "Failed to upload document")
      }

      const uploadData = await uploadResponse.json()
      const documentId = uploadData.id

      // Poll for document processing status
      let isReady = false
      let attempts = 0
      const maxAttempts = 30 // 30 seconds timeout
      
      while (!isReady && attempts < maxAttempts) {
        const statusResponse = await fetch(`/api/ragie/status/${documentId}`)

        if (!statusResponse.ok) {
          const error = await statusResponse.json()
          throw new Error(error.error || "Failed to check document status")
        }

        const statusData = await statusResponse.json()
        if (statusData.status === "ready") {
          isReady = true
        } else {
          attempts++
          await new Promise(resolve => setTimeout(resolve, 1000)) // Wait 1 second before next check
        }
      }

      if (!isReady) {
        throw new Error("Document processing timed out")
      }

      // Get the processed text using retrieval API
      const retrievalResponse = await fetch("/api/ragie/retrieve", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          query: "Extract all relevant information from this resume",
          filter: {
            scope: "resumes",
            type: "resume"
          }
        }),
      })

      if (!retrievalResponse.ok) {
        const error = await retrievalResponse.json()
        throw new Error(error.error || "Failed to retrieve document content")
      }

      const retrievalData = await retrievalResponse.json()
      const extractedText = retrievalData.scored_chunks.map((chunk: any) => chunk.text).join("\n")

      onUpload(file, extractedText)
    } catch (error) {
      console.error("Error processing file:", error)
      toast({
        title: "Error processing file",
        description: error instanceof Error ? error.message : "Failed to process the file. Please try again.",
        variant: "destructive",
      })
    } finally {
      setIsProcessing(false)
    }
  }

  return (
    <div
      className={`border-2 border-dashed rounded-lg p-8 text-center cursor-pointer transition-colors ${
        isDragging ? "border-blue-500 bg-blue-50" : "border-gray-300 hover:border-gray-400"
      }`}
      onDragOver={handleDragOver}
      onDragLeave={handleDragLeave}
      onDrop={handleDrop}
      onClick={() => fileInputRef.current?.click()}
    >
      <input type="file" ref={fileInputRef} className="hidden" accept=".pdf,.txt" onChange={handleFileChange} />

      {isProcessing ? (
        <div className="flex flex-col items-center justify-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500 mb-2"></div>
          <p className="text-gray-600">Processing resume...</p>
        </div>
      ) : (
        <div className="flex flex-col items-center justify-center">
          <div className="bg-gray-100 p-3 rounded-full mb-3">
            {isDragging ? <FileText className="h-6 w-6 text-blue-500" /> : <Upload className="h-6 w-6 text-gray-500" />}
          </div>
          <p className="font-medium mb-1">{isDragging ? "Drop your file here" : "Upload your resume"}</p>
          <p className="text-sm text-gray-500 mb-2">Drag and drop or click to browse</p>
          <p className="text-xs text-gray-400">Supports PDF and TXT files</p>
        </div>
      )}
    </div>
  )
}
