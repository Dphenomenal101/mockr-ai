"use client"

import type React from "react"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { Upload, X } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Textarea } from "@/components/ui/textarea"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent } from "@/components/ui/card"
import { useToast } from "@/hooks/use-toast"
import FileUpload from "@/components/file-upload"

export default function Home() {
  const router = useRouter()
  const { toast } = useToast()
  const [isLoading, setIsLoading] = useState(false)
  const [resumeFile, setResumeFile] = useState<File | null>(null)
  const [resumeText, setResumeText] = useState("")
  const [jobDescription, setJobDescription] = useState("")
  const [role, setRole] = useState("product-manager")
  const [customRole, setCustomRole] = useState("")
  const [showCustomRole, setShowCustomRole] = useState(false)
  const [charCount, setCharCount] = useState(0)

  const isFormValid = () => {
    if (!resumeText || !jobDescription) return false
    if (showCustomRole && !customRole) return false
    return true
  }

  const handleRoleChange = (value: string) => {
    setRole(value)
    setShowCustomRole(value === "custom")
  }

  const handleJobDescriptionChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setJobDescription(e.target.value)
    setCharCount(e.target.value.length)
  }

  const handleResumeUpload = (file: File, text: string) => {
    setResumeFile(file)
    setResumeText(text)
    toast({
      title: "Resume uploaded",
      description: `Successfully parsed ${file.name}`,
    })
  }

  const clearResume = () => {
    setResumeFile(null)
    setResumeText("")
  }

  const startInterview = async () => {
    if (!resumeText) {
      toast({
        title: "Resume required",
        description: "Please upload your resume to continue",
        variant: "destructive",
      })
      return
    }

    if (!jobDescription) {
      toast({
        title: "Job description required",
        description: "Please enter a job description to continue",
        variant: "destructive",
      })
      return
    }

    setIsLoading(true)

    try {
      // Save interview data to localStorage for persistence
      localStorage.setItem(
        "mockr-interview",
        JSON.stringify({
          resumeText,
          jobDescription,
          role: showCustomRole ? customRole : role,
          timestamp: new Date().toISOString(),
        }),
      )

      // Navigate to the interview page
      router.push("/interview")
    } catch (error) {
      console.error("Error starting interview:", error)
      toast({
        title: "Error",
        description: "Failed to start interview. Please try again.",
        variant: "destructive",
      })
      setIsLoading(false)
    }
  }

  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-gray-50 px-4 py-8">
      <div className="w-full max-w-2xl">
        <div className="text-center mb-8">
          <h1 className="text-5xl font-bold mb-2">Mockr</h1>
          <p className="text-xl">AI-Powered Voice Interview Practice</p>
        </div>

        <Card className="mb-8">
          <CardContent className="pt-6">
            <div className="mb-6">
              <h2 className="text-2xl font-bold mb-4">Resume</h2>
              {!resumeFile ? (
                <FileUpload onUpload={handleResumeUpload} />
              ) : (
                <div className="border rounded-lg p-4 bg-gray-50">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <div className="bg-blue-100 text-blue-700 p-2 rounded">
                        <Upload className="h-5 w-5" />
                      </div>
                      <div>
                        <p className="font-medium">{resumeFile.name}</p>
                        <p className="text-sm text-gray-500">{Math.round(resumeFile.size / 1024)} KB</p>
                      </div>
                    </div>
                    <Button variant="ghost" size="icon" onClick={clearResume}>
                      <X className="h-5 w-5" />
                    </Button>
                  </div>
                </div>
              )}
            </div>

            <div className="mb-6">
              <div className="flex justify-between items-center mb-4">
                <h2 className="text-2xl font-bold">Job Description</h2>
                <span className="text-sm text-gray-500">{charCount} characters</span>
              </div>
              <Textarea
                placeholder="Paste the job description here"
                className="min-h-[120px] resize-y"
                value={jobDescription}
                onChange={handleJobDescriptionChange}
              />
            </div>

            <div className="mb-6">
              <h2 className="text-2xl font-bold mb-4">Select Role</h2>
              <Select value={role} onValueChange={handleRoleChange}>
                <SelectTrigger>
                  <SelectValue placeholder="Select a role" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="product-manager">Product Manager</SelectItem>
                  <SelectItem value="software-engineer">Software Engineer</SelectItem>
                  <SelectItem value="data-scientist">Data Scientist</SelectItem>
                  <SelectItem value="ai-ml-engineer">AI/ML Engineer</SelectItem>
                  <SelectItem value="devops-engineer">DevOps Engineer</SelectItem>
                  <SelectItem value="growth-marketing">Growth Marketing</SelectItem>
                  <SelectItem value="technical-writer">Technical Writer</SelectItem>
                  <SelectItem value="ux-designer">UX Designer</SelectItem>
                  <SelectItem value="product-designer">Product Designer</SelectItem>
                  <SelectItem value="sales-engineer">Sales Engineer</SelectItem>
                  <SelectItem value="customer-success">Customer Success</SelectItem>
                  <SelectItem value="generalist-role">Generalist Role</SelectItem>
                  <SelectItem value="custom">Custom Role</SelectItem>
                </SelectContent>
              </Select>

              {showCustomRole && (
                <div className="mt-4">
                  <Label htmlFor="custom-role">Custom Role Name</Label>
                  <Input
                    id="custom-role"
                    placeholder="Enter role name"
                    className="mt-1"
                    value={customRole}
                    onChange={(e) => setCustomRole(e.target.value)}
                  />
                </div>
              )}
            </div>

            <Button
              className="w-full bg-blue-500 hover:bg-blue-600 text-white py-6 text-lg"
              onClick={startInterview}
              disabled={isLoading || !isFormValid()}
            >
              {isLoading ? "Preparing Interview..." : "Start Interview"}
            </Button>
          </CardContent>
        </Card>

        <div className="text-center text-sm text-gray-500">
          <a 
            href="https://vapi.ai?utm_source=mockr"
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center justify-center hover:opacity-80"
          >
            <span className="mr-1">Powered by</span>
            <img src="/vapi-logo.svg" alt="Vapi" className="h-4 inline-block" />
          </a>
        </div>
      </div>
    </div>
  )
}
