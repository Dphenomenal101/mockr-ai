"use client"

import React from 'react';
import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { ArrowLeft, Award, Check, AlertTriangle, HelpCircle, CheckCircle2 } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Progress } from "@/components/ui/progress"
import { FeedbackLoading } from '../components/FeedbackLoading';
import { FeedbackError } from '../components/FeedbackError';

interface Feedback {
  score: number
  summary: string
}

export default function FeedbackPage() {
  const router = useRouter()
  const [feedback, setFeedback] = useState<Feedback | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    // Load feedback from localStorage
    const savedFeedback = localStorage.getItem("mockr-feedback")

    if (savedFeedback) {
      try {
        const parsedFeedback = JSON.parse(savedFeedback)
        
        // Validate the feedback data
        if (!parsedFeedback) {
          throw new Error("No feedback data found")
        }

        // Ensure we have both required fields with correct types
        const score = Number(parsedFeedback.score)
        const summary = String(parsedFeedback.summary || '')

        if (isNaN(score) || !summary) {
          throw new Error("Invalid feedback format")
        }

        // Store validated data
        setFeedback({
          score,
          summary
        })
      } catch (error) {
        console.error("Error parsing feedback:", error)
        setError(error instanceof Error ? error.message : "Error generating feedback. Please try again.")
      }
    } else {
      setError("No feedback data available. Please complete an interview first.")
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
    return <FeedbackError message={error} />;
  }

  if (!feedback || !feedback.score) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen bg-gray-50 px-4">
        <Card className="max-w-md w-full">
          <CardContent className="pt-6">
            <div className="text-center mb-6">
              <AlertTriangle className="h-12 w-12 text-yellow-500 mx-auto mb-2" />
              <h2 className="text-xl font-bold">No Feedback Available</h2>
              <p className="text-gray-500 mt-2">We couldn't find any feedback for your interview. Please try again.</p>
            </div>

            <Button className="w-full" onClick={() => router.push("/")}>
              <ArrowLeft className="mr-2 h-4 w-4" />
              Return to Home
            </Button>
          </CardContent>
        </Card>
      </div>
    )
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
                <span className={`text-2xl font-semibold ${getScoreColor(feedback.score)}`}>
                  {feedback.score}/100
                </span>
              </div>
              <div className="h-4 bg-gray-100 rounded-full">
                <div
                  className={`h-full ${getProgressColor(feedback.score)} rounded-full`}
                  style={{ width: `${feedback.score}%` }}
                />
              </div>
            </div>
            {feedback.summary && (
              <div className={`${getBackgroundColor(feedback.score)} rounded-lg p-6`}>
                <div className="space-y-2">
                  <div className="flex items-center gap-2">
                    <Check className={`h-5 w-5 ${getCheckColor(feedback.score)}`} />
                    <h3 className="text-xl font-semibold">Performance Summary</h3>
                  </div>
                  <p className="text-gray-800 text-lg">
                    {feedback.summary}
                  </p>
                </div>
              </div>
            )}
          </section>

          {/* Practice Again Button */}
          <div className="flex justify-center">
            <button
              onClick={startNewInterview}
              className={`${getProgressColor(feedback.score)} text-white px-8 py-3 rounded-lg font-semibold hover:opacity-90 transition-colors text-lg`}
            >
              Practice Again
            </button>
          </div>
        </div>
      </main>
    </div>
  )
}
