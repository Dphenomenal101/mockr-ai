"use client"

import { useState, useEffect, useRef } from "react"
import { useRouter } from "next/navigation"
import { Mic, MicOff, Volume2, Pause, Play, X, ArrowLeft } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { useToast } from "@/hooks/use-toast"
import VolumeIndicator from "@/components/volume-indicator"
import TranscriptDisplay from "@/components/transcript-display"
import { Alert, AlertDescription } from "@/components/ui/alert"

// Try to import from vapi-client, but have a fallback
let getVapiClient: () => any
let analyzeFeedback: (transcript: any, options: any) => Promise<any>

try {
  const vapiModule = require("@/lib/vapi-client")
  getVapiClient = vapiModule.getVapiClient
  analyzeFeedback = vapiModule.analyzeFeedback
} catch (error) {
  console.error("Error importing Vapi client:", error)

  // Fallback mock implementation
  class MockVapi {
    private apiKey: string
    private call: any = null
    private listeners: Record<string, Function[]> = {}

    constructor(apiKey: string) {
      this.apiKey = apiKey
    }

    async start(config: any) {
      console.log("Starting Vapi call with config:", config)

      // Simulate API call
      this.call = {
        id: "mock-call-" + Math.random().toString(36).substring(2, 9),
        status: "in-progress",
        config,
      }

      // Simulate events
      setTimeout(() => this.emitEvent("started", { call: this.call }), 1000)

      // Start simulating transcript
      this.simulateTranscript()

      return this.call
    }

    async stop() {
      if (!this.call) return

      this.call.status = "completed"
      this.emitEvent("stopped", { call: this.call })
      return this.call
    }

    async pause() {
      if (!this.call) return

      this.call.status = "paused"
      this.emitEvent("paused", { call: this.call })
      return this.call
    }

    async resume() {
      if (!this.call) return

      this.call.status = "in-progress"
      this.emitEvent("resumed", { call: this.call })
      return this.call
    }

    on(event: string, callback: Function) {
      if (!this.listeners[event]) {
        this.listeners[event] = []
      }
      this.listeners[event].push(callback)
    }

    private emitEvent(event: string, data: any) {
      if (this.listeners[event]) {
        this.listeners[event].forEach((callback) => callback(data))
      }
    }

    // Simulate transcript events for demo
    simulateTranscript() {
      const questions = [
        "Tell me about your experience with product management methodologies.",
        "How do you prioritize features in your product roadmap?",
        "Can you describe a situation where you had to make a difficult product decision?",
      ]

      let questionIndex = 0

      // Simulate AI speaking
      const simulateQuestion = () => {
        if (questionIndex >= questions.length) return

        const question = questions[questionIndex]

        // Emit transcript for AI speaking
        this.emitEvent("transcript", {
          transcript: {
            text: question,
            isFinal: true,
            speaker: "assistant",
          },
        })

        questionIndex++

        // Schedule next question after user response
        if (questionIndex < questions.length) {
          setTimeout(simulateQuestion, 20000) // Wait 20s between questions
        } else {
          // End interview after last question
          setTimeout(() => {
            this.emitEvent("transcript", {
              transcript: {
                text: "Thank you for your responses. The interview is now complete.",
                isFinal: true,
                speaker: "assistant",
              },
            })

            setTimeout(() => {
              this.stop()
              // Store mock feedback directly
              const mockFeedback = {
                score: 85,
                summary: "You demonstrated strong product thinking and methodical approaches to prioritization. Consider providing more specific metrics when discussing product success."
              };
              localStorage.setItem("mockr-feedback", JSON.stringify(mockFeedback));
              
              // Emit feedback event for consistency
              this.emitEvent("feedback", {
                feedback: mockFeedback
              })
            }, 2000)
          }, 5000)
        }
      }

      // Start the first question after 2 seconds
      setTimeout(simulateQuestion, 2000)

      // Simulate user responses
      const userResponses = [
        "I have experience with agile and lean methodologies. I've worked in scrum teams and used kanban boards for tracking work. I also believe in continuous delivery and getting feedback early.",
        "I prioritize features based on business value, user impact, and effort required. I use frameworks like RICE - Reach, Impact, Confidence, and Effort - to score features objectively.",
        "Yes, we had to decide whether to rebuild our platform from scratch or continue iterating on the existing codebase. After analyzing technical debt and future scalability needs, I recommended the rebuild despite short-term costs.",
      ]

      // Simulate user speaking after each AI question
      let responseIndex = 0
      const simulateUserResponse = () => {
        if (responseIndex >= userResponses.length) return

        const words = userResponses[responseIndex].split(" ")
        let currentText = ""

        // Simulate word-by-word transcription
        const wordInterval = setInterval(() => {
          if (words.length === 0) {
            clearInterval(wordInterval)

            // Final transcript
            this.emitEvent("transcript", {
              transcript: {
                text: userResponses[responseIndex],
                isFinal: true,
                speaker: "user",
              },
            })

            responseIndex++
            return
          }

          currentText += " " + words.shift()

          // Partial transcript
          this.emitEvent("transcript", {
            transcript: {
              text: currentText,
              isFinal: false,
              speaker: "user",
            },
          })
        }, 300)
      }

      // Start user responses after AI questions
      setTimeout(() => {
        simulateUserResponse()

        // Schedule next responses
        const responseInterval = setInterval(() => {
          if (responseIndex >= userResponses.length) {
            clearInterval(responseInterval)
            return
          }
          simulateUserResponse()
        }, 20000) // Match the question interval
      }, 7000) // Start first response 5s after first question
    }
  }

  // Fallback implementations
  getVapiClient = () => new MockVapi(process.env.NEXT_PUBLIC_VAPI_API_KEY || "mock-key")
  analyzeFeedback = async (transcript: any, options: any) => {
    return {
      score: 85,
      summary: "You demonstrated strong product thinking and methodical approaches to prioritization. Consider providing more specific metrics when discussing product success."
    }
  }
}

interface InterviewData {
  resumeText: string
  jobDescription: string
  role: string
  timestamp: string
}

interface FeedbackData {
  feedback: {
    score: number;
    summary: string;
  };
}

export default function InterviewPage() {
  const router = useRouter()
  const { toast } = useToast()
  const [interviewData, setInterviewData] = useState<InterviewData | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [isStarted, setIsStarted] = useState(false)
  const [volume, setVolume] = useState(0)
  const [isSpeaking, setIsSpeaking] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [timeLeft, setTimeLeft] = useState(600) // 10 minutes in seconds

  const vapiRef = useRef<any>(null)
  const volumeIntervalRef = useRef<NodeJS.Timeout | null>(null)
  const timerIntervalRef = useRef<NodeJS.Timeout | null>(null)

  useEffect(() => {
    // Load interview data from localStorage
    const savedData = localStorage.getItem("mockr-interview")

    if (!savedData) {
      setError("No interview data found. Please return to the setup page.")
      setIsLoading(false)
      return
    }

    try {
      const parsedData = JSON.parse(savedData) as InterviewData
      setInterviewData(parsedData)

      // Initialize Vapi
      try {
        vapiRef.current = getVapiClient()
        
        // Set up event listeners
        vapiRef.current.on("error", handleError)
      } catch (error) {
        console.error("Error initializing Vapi:", error)
        setError("Failed to initialize Vapi. Please check your API key.")
        setIsLoading(false)
        return
      }

      setIsLoading(false)
    } catch (error) {
      console.error("Error parsing interview data:", error)
      setError("Failed to load interview data. Please try again.")
      setIsLoading(false)
    }

    // Cleanup function
    return () => {
      if (vapiRef.current) {
        // Remove event listeners
        try {
          vapiRef.current.removeAllListeners?.()
        } catch (error) {
          console.error("Error removing event listeners:", error)
        }
      }
    }
  }, [])

  useEffect(() => {
    // Clean up on unmount
    return () => {
      if (volumeIntervalRef.current) {
        clearInterval(volumeIntervalRef.current)
      }

      if (timerIntervalRef.current) {
        clearInterval(timerIntervalRef.current)
      }

      // Safely cleanup Vapi client and stop microphone
      if (vapiRef.current && isStarted) {
        try {
          vapiRef.current.stop()
        } catch (error) {
          console.error("Error stopping Vapi client:", error)
        }
      }

      // Ensure microphone is stopped
      navigator.mediaDevices.getUserMedia({ audio: true })
        .then(stream => {
          stream.getTracks().forEach(track => {
            track.stop()
          })
        })
        .catch(error => {
          console.error("Error stopping microphone:", error)
        })

      // Clean up audio context if it exists
      try {
        const audioContext = new AudioContext()
        audioContext.close()
      } catch (error) {
        console.error("Error closing audio context:", error)
      }
    }
  }, [isStarted])

  useEffect(() => {
    // Timer effect
    if (isStarted && timeLeft > 0) {
      timerIntervalRef.current = setInterval(() => {
        setTimeLeft((prev) => {
          if (prev <= 1) {
            // Time's up - end interview
            endInterview()
            toast({
              title: "Time's Up",
              description: "The interview has ended as the 10-minute limit was reached.",
              variant: "default",
            })
            return 0
          }
          return prev - 1
        })
      }, 1000)

      return () => {
        if (timerIntervalRef.current) {
          clearInterval(timerIntervalRef.current)
        }
      }
    }
  }, [isStarted, timeLeft])

  const requestMicrophonePermission = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      // Store the stream to stop it later
      if (stream) {
        // Stop all tracks to release the microphone
        stream.getTracks().forEach(track => track.stop());
      }
      return true;
    } catch (error) {
      console.error("Error accessing microphone:", error);
      setError("Please allow microphone access to start the interview.");
      return false;
    }
  };

  const startInterview = async () => {
    if (!interviewData || !vapiRef.current) return;

    try {
      // Reset all state
      setError(null);
      
      // Request microphone permission first
      const hasMicrophoneAccess = await requestMicrophonePermission();
      if (!hasMicrophoneAccess) {
        return;
      }

      // Set up feedback event handler
      vapiRef.current.on("feedback", (data: FeedbackData) => {
        // Store the feedback data in localStorage
        if (data.feedback) {
          localStorage.setItem("mockr-feedback", JSON.stringify({
            score: data.feedback.score,
            summary: data.feedback.summary
          }));
        }
      });

      // Start the call with explicit microphone configuration
      await vapiRef.current.start({
        name: "Technical Interviewer",
        transcriber: {
          provider: "deepgram",
          model: "nova-2"
        },
        model: {
          provider: "openai",
          model: "gpt-4",
          messages: [
            {
              role: "system",
              content: `You are conducting a job interview for a ${interviewData.role} position. Review the candidate's resume: ${interviewData.resumeText} And the job description: ${interviewData.jobDescription}. Begin immediately with a relevant technical or behavioral question - do not introduce yourself or ask "how can I help you today". Maintain a professional tone throughout the interview. Ask one question at a time and wait for the response before proceeding. Be constructive in feedback.`
            }
          ]
        },
        voice: {
          provider: "playht",
          voiceId: "jennifer"
        },
        analysisPlan: {
          summaryPrompt: "You are an expert interviewer. Summarize the candidate's performance in the interview, highlighting their strengths and areas for improvement in 2-3 sentences.",
          structuredDataSchema: {
            type: "object",
            properties: {
              score: {
                type: "number",
                description: "Overall interview score from 0-100"
              },
              summary: {
                type: "string",
                description: "Summary of interview performance including strengths and areas for improvement"
              }
            },
            required: ["score", "summary"]
          },
          successEvaluationPrompt: "Evaluate the candidate's interview performance based on their technical knowledge, communication skills, and problem-solving ability.",
          successEvaluationRubric: "PercentageScale"
        }
      });

      setIsStarted(true);
      setTimeLeft(480); // 8 minutes
      setupVolumeMeter();

      // Clear any existing timer
      if (timerIntervalRef.current) {
        clearInterval(timerIntervalRef.current);
      }

    } catch (error) {
      console.error("Error starting interview:", error);
      setError("Failed to start interview. Please check your microphone permissions and try again.");
    }
  };

  const endInterview = async () => {
    if (!vapiRef.current || !isStarted) return

    try {
      // Generate and get the feedback
      const analysis = await vapiRef.current.analyze();
      
      // Store the feedback
      if (analysis && analysis.structuredData) {
        const feedback = {
          score: analysis.structuredData.score || 75,
          summary: analysis.summary || "Interview completed. The AI will analyze your responses and provide detailed feedback."
        };
        localStorage.setItem("mockr-feedback", JSON.stringify(feedback));
      }

      // Stop the call
      await vapiRef.current.stop()

      // Clear volume meter interval
      if (volumeIntervalRef.current) {
        clearInterval(volumeIntervalRef.current)
        volumeIntervalRef.current = null
      }

      // Stop all microphone tracks
      try {
        const stream = await navigator.mediaDevices.getUserMedia({ audio: true })
        stream.getTracks().forEach(track => track.stop())
      } catch (error) {
        console.error("Error stopping microphone:", error)
      }

      // Clean up audio context if it exists
      try {
        const audioContext = new AudioContext()
        await audioContext.close()
      } catch (error) {
        console.error("Error closing audio context:", error)
      }

      setIsStarted(false)
      router.push("/feedback")
    } catch (error) {
      console.error("Error ending interview:", error)
      // Even if there's an error, try to clean up and move to feedback
      setIsStarted(false)
      
      // Store a default feedback if analysis failed
      const defaultFeedback = {
        score: 75,
        summary: "Interview completed. We encountered an issue analyzing your responses, but you can still review the general feedback."
      };
      localStorage.setItem("mockr-feedback", JSON.stringify(defaultFeedback));
      
      router.push("/feedback")
    }
  }

  const handleError = (error: any) => {
    console.error("Vapi error:", error)
    setError(`Error during interview: ${error.message || "Unknown error"}`)
  }

  const setupVolumeMeter = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const audioContext = new AudioContext();
      const source = audioContext.createMediaStreamSource(stream);
      const analyser = audioContext.createAnalyser();
      analyser.fftSize = 256;
      source.connect(analyser);

      const dataArray = new Uint8Array(analyser.frequencyBinCount);

      if (volumeIntervalRef.current) {
        clearInterval(volumeIntervalRef.current);
      }

      volumeIntervalRef.current = setInterval(() => {
        analyser.getByteFrequencyData(dataArray);
        const average = dataArray.reduce((acc, value) => acc + value, 0) / dataArray.length;
        const normalizedVolume = average / 128; // Normalize to 0-1 range
        setVolume(normalizedVolume);
      }, 100);

      // Clean up function
      return () => {
        if (volumeIntervalRef.current) {
          clearInterval(volumeIntervalRef.current);
        }
        stream.getTracks().forEach(track => track.stop());
        audioContext.close();
      };
    } catch (error) {
      console.error("Error setting up volume meter:", error);
    }
  };

  const formatTime = (seconds: number) => {
    const minutes = Math.floor(seconds / 60)
    const remainingSeconds = seconds % 60
    return `${minutes}:${remainingSeconds.toString().padStart(2, '0')}`
  }

  if (isLoading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen bg-gray-50 px-4">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 mb-4"></div>
        <p className="text-lg">Preparing your interview...</p>
      </div>
    )
  }

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen bg-gray-50 px-4">
        <Alert variant="destructive" className="mb-4 max-w-md">
          <AlertDescription>{error}</AlertDescription>
        </Alert>
        <Button onClick={() => router.push("/")}>
          <ArrowLeft className="mr-2 h-4 w-4" />
          Go Back Home
        </Button>
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
            <h1 className="text-xl font-bold">Mockr Interview</h1>
            {isStarted && (
              <div className={`ml-4 font-mono ${timeLeft <= 60 ? 'text-red-500' : 'text-gray-500'}`}>
                Time left: {formatTime(timeLeft)}
              </div>
            )}
          </div>

          <div className="flex items-center gap-2">
            {isStarted ? (
              <Button variant="destructive" size="sm" onClick={endInterview}>
                <X className="h-4 w-4 mr-2" />
                End Interview
              </Button>
            ) : (
              <Button className="bg-blue-500 hover:bg-blue-600" size="sm" onClick={startInterview}>
                <Mic className="h-4 w-4 mr-2" />
                Start Interview
              </Button>
            )}
          </div>
        </div>
      </header>

      <main className="flex-1 max-w-4xl mx-auto w-full p-4">
        {!isStarted ? (
          <Card className="mb-6">
            <CardContent className="pt-6">
              <h2 className="text-xl font-bold mb-4">Interview Ready</h2>
              <p className="mb-4">
                Your interview for the <strong>{interviewData?.role}</strong> position is ready to begin.
              </p>
              <p className="mb-4">
                You'll be asked questions related to the job description you provided. Speak clearly and take your
                time with your responses.
              </p>
              <p className="mb-6">Click "Start Interview" when you're ready to begin.</p>

              <Button className="w-full bg-blue-500 hover:bg-blue-600" onClick={startInterview}>
                <Mic className="h-5 w-5 mr-2" />
                Start Interview
              </Button>
            </CardContent>
          </Card>
        ) : (
          <>
            <div className="mb-4">
              <div className="flex items-center">
                {isSpeaking ? (
                  <div className="flex items-center text-blue-600">
                    <Volume2 className="h-5 w-5 mr-2 animate-pulse" />
                    <span>AI is speaking...</span>
                  </div>
                ) : (
                  <div className="flex items-center">
                    <Mic className="h-5 w-5 mr-2 text-green-500" />
                    <span>Listening...</span>
                  </div>
                )}
              </div>
            </div>

            {!isSpeaking && (
              <div className="mb-6">
                <VolumeIndicator volume={volume} />
              </div>
            )}

            <Card className="mb-6">
              <CardContent className="pt-6 text-center">
                <div className="flex flex-col items-center space-y-4">
                  <p className="text-lg text-gray-600">
                    Your interview is in progress. Listen carefully to the questions and speak clearly when responding.
                  </p>
                  <div className="w-full max-w-md p-4 bg-blue-50 rounded-lg">
                    <p className="text-sm text-blue-600">
                      Tips:
                    </p>
                    <ul className="mt-2 text-sm text-gray-600 text-left list-disc list-inside space-y-1">
                      <li>Take a moment to think before responding</li>
                      <li>Provide specific examples when possible</li>
                      <li>Keep your answers clear and concise</li>
                      <li>Feel free to ask for clarification if needed</li>
                    </ul>
                  </div>
                </div>
              </CardContent>
            </Card>
          </>
        )}
      </main>
    </div>
  )
}
