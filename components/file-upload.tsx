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
      let text = ""

      if (fileType === "text/plain") {
        text = await readTextFile(file)
      } else if (fileType === "application/pdf") {
        text = await readPdfFile(file)
      }

      onUpload(file, text)
    } catch (error) {
      console.error("Error processing file:", error)
      toast({
        title: "Error processing file",
        description: "Failed to read the file. Please try again.",
        variant: "destructive",
      })
    } finally {
      setIsProcessing(false)
    }
  }

  const readTextFile = (file: File): Promise<string> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader()
      reader.onload = (e) => {
        if (e.target?.result) {
          resolve(e.target.result as string)
        } else {
          reject(new Error("Failed to read text file"))
        }
      }
      reader.onerror = () => reject(reader.error)
      reader.readAsText(file)
    })
  }

  const readPdfFile = async (file: File): Promise<string> => {
    try {
      // For a real implementation, we would use pdf.js
      // This is a simplified version that doesn't actually parse PDFs
      // In production, you would use the pdf.js library

      const reader = new FileReader()
      return new Promise((resolve, reject) => {
        reader.onload = async (event) => {
          try {
            // In a real implementation with pdf.js:
            // const pdfData = new Uint8Array(event.target.result as ArrayBuffer);
            // const loadingTask = pdfjsLib.getDocument({ data: pdfData });
            // const pdf = await loadingTask.promise;
            // let text = '';
            // for (let i = 1; i <= pdf.numPages; i++) {
            //   const page = await pdf.getPage(i);
            //   const content = await page.getTextContent();
            //   text += content.items.map(item => item.str).join(' ');
            // }

            // For now, we'll just return a placeholder
            resolve(
              `Content extracted from ${file.name}. In a real implementation, we would use pdf.js to extract the text.`,
            )
          } catch (error) {
            reject(error)
          }
        }
        reader.onerror = reject
        reader.readAsArrayBuffer(file)
      })
    } catch (error) {
      console.error("Error parsing PDF:", error)
      throw new Error("Failed to parse PDF file")
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
          <p className="text-gray-600">Processing file...</p>
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
