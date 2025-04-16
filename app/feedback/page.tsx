"use client"

import React from 'react';
import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { ArrowLeft, Award, Check, AlertTriangle, HelpCircle, CheckCircle2, Loader2 } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Progress } from "@/components/ui/progress"
import { FeedbackLoading } from '../components/FeedbackLoading';
import { FeedbackError } from '../components/FeedbackError';
import { useToast } from "@/hooks/use-toast"

interface Feedback {
  score: number
  summary: string
  technicalScore?: number
  communicationScore?: number
  problemSolvingScore?: number
}

export default function FeedbackPage() {
  const router = useRouter()
  const { toast } = useToast()
  const [feedback, setFeedback] = useState<Feedback | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [isFetchingAnalysis, setIsFetchingAnalysis] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const fetchFeedback = async () => {
    setIsLoading(true)
    setIsFetchingAnalysis(true)
    setError(null)

    try {
      const callId = localStorage.getItem("mockr-call-id")
      if (!callId) {
        throw new Error("No call ID found. The interview may not have started properly.")
      }

      const response = await fetch(`/api/vapi?callId=${callId}`, {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
        },
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || `Error fetching analysis: ${response.statusText}`)
      }

      const data = await response.json()
      
      if (data.status === "in-progress") {
        toast({
          title: "Analysis in Progress",
          description: "Your interview is still being analyzed. Please try again in a few moments.",
          variant: "default",
        })
        return
      }

      if (!data?.analysis?.structuredData) {
        throw new Error("No analysis data available. The interview may have been too short.")
      }

      const feedbackData = {
        score: data?.analysis?.structuredData?.score || 0,
        summary: data?.analysis?.structuredData?.summary || 'No analysis data available.',
        technicalScore: data?.analysis?.structuredData?.technicalKnowledge || 0,
        communicationScore: data?.analysis?.structuredData?.communicationSkills || 0,
        problemSolvingScore: data?.analysis?.structuredData?.problemSolving || 0
      }

      setFeedback(feedbackData)
      localStorage.setItem("mockr-feedback", JSON.stringify(feedbackData))
      setIsLoading(false)

    } catch (error) {
      console.error("Error fetching feedback:", error)
      setError(error instanceof Error ? error.message : "Failed to fetch feedback. Please try again.")
    } finally {
      setIsFetchingAnalysis(false)
    }
  }

  useEffect(() => {
    // Check for interview error first
    const savedError = localStorage.getItem("mockr-interview-error")

    console.log("savedError", savedError)

    if (savedError) {
      try {
        const error = JSON.parse(savedError)
        // Only use errors that are less than 5 minutes old
        if (new Date().getTime() - new Date(error.timestamp).getTime() < 5 * 60 * 1000) {
          setError(error.message)
          setIsLoading(false)
          localStorage.removeItem("mockr-interview-error")
          return
        }
      } catch (e) {
        console.error("Error parsing saved error:", e)
      }
      localStorage.removeItem("mockr-interview-error")
    }

    // Load feedback from localStorage
    const savedFeedback = localStorage.getItem("mockr-feedback")
    const savedInterview = localStorage.getItem("mockr-interview")

    if (!savedInterview) {
      setError("No interview data found. Please complete an interview first.")
      setIsLoading(false)
      return
    }

    if (savedFeedback) {
      try {
        const parsedFeedback = JSON.parse(savedFeedback)
        
        // Validate the feedback data
        if (!parsedFeedback) {
          throw new Error("Invalid feedback data")
        }

        // Ensure we have both required fields with correct types and valid values
        const score = Number(parsedFeedback.score)
        const summary = String(parsedFeedback.summary || '')

        if (isNaN(score) || score < 0 || score > 100) {
          throw new Error("Invalid score value")
        }

        if (!summary || summary === "No feedback available.") {
          throw new Error("No feedback summary available")
        }

        // Store validated data with optional detailed scores
        setFeedback({
          score,
          summary,
          technicalScore: parsedFeedback.technicalScore,
          communicationScore: parsedFeedback.communicationScore,
          problemSolvingScore: parsedFeedback.problemSolvingScore
        })
      } catch (error) {
        console.error("Error parsing feedback:", error)
        setError("Click 'Get Feedback' to fetch your interview analysis.")
      }
    } else {
      setError("Click 'Get Feedback' to fetch your interview analysis.")
    }

    setIsLoading(false)
  }, [])

  const getScoreColor = (score: number) => {
    if (score > 75) return "text-green-500"
    if (score > 45) return "text-yellow-500"
    return "text-red-500"
  }

  const getProgressColor = (score: number) => {
    if (score > 75) return "bg-green-500"
    if (score > 45) return "bg-yellow-500"
    return "bg-red-500"
  }

  const getBackgroundColor = (score: number) => {
    if (score > 75) return "bg-green-50"
    if (score > 45) return "bg-yellow-50"
    return "bg-red-50"
  }

  const getCheckColor = (score: number) => {
    if (score > 75) return "text-green-600"
    if (score > 45) return "text-yellow-600"
    return "text-red-600"
  }

  const startNewInterview = () => {
    // Clear interview data
    localStorage.removeItem("mockr-interview")
    localStorage.removeItem("mockr-feedback")

    // Navigate to home page
    router.push("/")
  }

  if (isLoading) {
    return <FeedbackLoading />;
  }

  if (error) {
    return (
      <div className="flex flex-col min-h-screen bg-gray-50">
        <header className="bg-white border-b p-4 sticky top-0 z-10">
          <div className="max-w-4xl mx-auto flex justify-between items-center">
            <div className="flex items-center">
              <Button variant="ghost" size="icon" onClick={() => router.push("/")} className="mr-2">
                <ArrowLeft className="h-5 w-5" />
              </Button>
              <h1 className="text-xl font-bold">Interview Feedback</h1>
            </div>
          </div>
        </header>

        <main className="flex-1 max-w-4xl mx-auto w-full p-4">
          <Card>
            <CardContent className="pt-6">
              <div className="text-center">
                <p className="text-gray-600 mb-6">{error}</p>
                <Button 
                  onClick={fetchFeedback} 
                  disabled={isFetchingAnalysis}
                  className="bg-blue-500 hover:bg-blue-600"
                >
                  {isFetchingAnalysis ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Fetching Analysis...
                    </>
                  ) : (
                    'Get Feedback'
                  )}
                </Button>
              </div>
            </CardContent>
          </Card>
        </main>
      </div>
    );
  }

  if (error) {
    return <FeedbackError 
      message={error} 
      onRetry={() => {
        localStorage.removeItem("mockr-feedback")
        localStorage.removeItem("mockr-interview-error")
        router.push("/")
      }} 
    />;
  }

  if ( !feedback || !feedback.score) {
    if(error) {
      return <FeedbackError 
        message="No feedback data available. Please try again." 
        onRetry={() => {
          localStorage.removeItem("mockr-feedback")
          localStorage.removeItem("mockr-interview-error")
          router.push("/")
        }}
      />
    }
  }

  return (
    <div className="flex flex-col min-h-screen bg-gray-50">
      <header className="bg-white border-b p-4 sticky top-0 z-10">
        <div className="max-w-4xl mx-auto flex justify-between items-center">
          <div className="flex items-center">
            <Button variant="ghost" size="icon" onClick={() => router.push("/")} className="mr-2">
              <ArrowLeft className="h-5 w-5" />
            </Button>
            <h1 className="text-xl font-bold">Interview Feedback</h1>
          </div>

          <Button variant="outline" size="sm" onClick={startNewInterview}>
            Start New Interview
          </Button>
        </div>
      </header>

      <main className="flex-1 max-w-4xl mx-auto w-full p-4">
        <div className="space-y-8">
          {/* Performance Score */}
          <section className="bg-white rounded-lg shadow p-6">
            <h2 className="text-3xl font-bold mb-6">Performance Score</h2>
            <div className="mb-6">
              <div className="flex justify-between items-center mb-2">
                <span className="text-gray-600 text-xl">Overall Score</span>
                <span className={`text-2xl font-semibold ${getScoreColor(feedback?.score || 0)}`}>
                  {feedback?.score || 0}/100
                </span>
              </div>
              <div className="h-4 bg-gray-100 rounded-full">
                <div
                  className={`h-full ${getProgressColor(feedback?.score || 0)} rounded-full transition-all duration-500`}
                  style={{ width: `${feedback?.score}%` }}
                />
              </div>
            </div>

            {/* Detailed Scores */}
            {(feedback?.technicalScore || feedback?.communicationScore || feedback?.problemSolvingScore) && (
              <div className="mb-6 space-y-4">
                {feedback?.technicalScore && (
                  <div>
                    <div className="flex justify-between items-center mb-1">
                      <span className="text-gray-600">Technical Knowledge</span>
                      <span className={getScoreColor(feedback?.technicalScore)}>
                        {feedback?.technicalScore}/100
                      </span>
                    </div>
                    <div className="h-2 bg-gray-100 rounded-full">
                      <div
                        className={`h-full ${getProgressColor(feedback?.technicalScore)} rounded-full transition-all duration-500`}
                        style={{ width: `${feedback?.technicalScore}%` }}
                      />
                    </div>
                  </div>
                )}

                {feedback?.communicationScore && (
                  <div>
                    <div className="flex justify-between items-center mb-1">
                      <span className="text-gray-600">Communication Skills</span>
                      <span className={getScoreColor(feedback?.communicationScore)}>
                        {feedback?.communicationScore}/100
                      </span>
                    </div>
                    <div className="h-2 bg-gray-100 rounded-full">
                      <div
                        className={`h-full ${getProgressColor(feedback?.communicationScore)} rounded-full transition-all duration-500`}
                        style={{ width: `${feedback?.communicationScore}%` }}
                      />
                    </div>
                  </div>
                )}

                {feedback?.problemSolvingScore && (
                  <div>
                    <div className="flex justify-between items-center mb-1">
                      <span className="text-gray-600">Problem Solving</span>
                      <span className={getScoreColor(feedback?.problemSolvingScore)}>
                        {feedback?.problemSolvingScore}/100
                      </span>
                    </div>
                    <div className="h-2 bg-gray-100 rounded-full">
                      <div
                        className={`h-full ${getProgressColor(feedback?.problemSolvingScore)} rounded-full transition-all duration-500`}
                        style={{ width: `${feedback?.problemSolvingScore}%` }}
                      />
                    </div>
                  </div>
                )}
              </div>
            )}

            {feedback?.summary && (
              <div className={`${getBackgroundColor(feedback?.score)} rounded-lg p-6`}>
                <div className="space-y-2">
                  <div className="flex items-center gap-2">
                    <Check className={`h-5 w-5 ${getCheckColor(feedback?.score)}`} />
                    <h3 className="text-xl font-semibold">Performance Summary</h3>
                  </div>
                  <p className="text-gray-800 text-lg whitespace-pre-wrap">
                    {feedback?.summary}
                  </p>
                </div>
              </div>
            )}
          </section>

          {/* Practice Again Button */}
          <div className="flex justify-center">
            <button
              onClick={startNewInterview}
              className={`${getProgressColor(feedback?.score || 0)} text-white px-8 py-3 rounded-lg font-semibold hover:opacity-90 transition-colors text-lg`}
            >
              Practice Again
            </button>
          </div>
        </div>
      </main>
    </div>
  )
}
