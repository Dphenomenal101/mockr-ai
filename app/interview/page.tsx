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

try {
  const vapiModule = require("@/lib/vapi-client")
  getVapiClient = vapiModule.getVapiClient
} catch (error) {
  console.error("Error importing Vapi client:", error)
  throw new Error("Failed to import Vapi client. This application requires Vapi to function.")
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

      // Start the call with explicit microphone configuration
      const call = await vapiRef.current.start({
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
              content: `You are conducting a job interview for a ${interviewData.role} position. Review the candidate's resume: ${interviewData.resumeText} And the job description: ${interviewData.jobDescription}. Begin immediately with a relevant technical or behavioral question - do not introduce yourself or ask "how can I help you today" but you should start by saying thanks for joining the interview and get started. Maintain a professional tone throughout the interview. Ask one question at a time and wait for the response before proceeding. And ask two to three questions max then give the candidate a chance to to ask questions after you're done asking your own questions because the time limit of the interview is under 8 minutes. Also, try to make at least one of your question based on the candidate's resume.`
            }
          ]
        },
        voice: {
          provider: "playht",
          voiceId: "jennifer"
        },
        analysisPlan: {
          summaryPrompt: "Write direct feedback to the candidate about their interview performance. Focus on their strengths and specific areas for improvement. Use a professional but encouraging tone, addressing the candidate in the second person (you/your).",
          structuredDataSchema: {
            type: "object",
            properties: {
              score: {
                type: "number",
                description: "Overall interview score from 0-100 based on technical knowledge, communication skills, and problem-solving ability"
              },
              summary: {
                type: "string",
                description: "Direct feedback to the candidate about their performance, written in second person (you/your)"
              },
              technicalKnowledge: {
                type: "number",
                description: "Score from 0-100 for technical knowledge demonstrated"
              },
              communicationSkills: {
                type: "number",
                description: "Score from 0-100 for communication effectiveness"
              },
              problemSolving: {
                type: "number",
                description: "Score from 0-100 for problem-solving ability"
              }
            },
            required: ["score", "summary"]
          },
          successEvaluationPrompt: "Evaluate the candidate's interview performance from their perspective, highlighting their strengths and areas for growth.",
          successEvaluationRubric: "PercentageScale"
        }
      });

      // Store the call ID in localStorage
      if (call?.id) {
        console.log("Storing call ID:", call.id);
        localStorage.setItem("mockr-call-id", call.id);
      } else {
        console.error("No call ID received from Vapi");
      }

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
    if (!vapiRef.current || !isStarted) {
      console.log("Early return - no vapi client or interview not started:", { 
        hasVapiClient: !!vapiRef.current, 
        isStarted 
      });
      return;
    }

    try {
      console.log("Starting interview end process...");
      
      // First stop the call
      console.log("Stopping Vapi call...");
      await vapiRef.current.stop();
      
      // Get the call ID from localStorage
      const callId = localStorage.getItem("mockr-call-id");
      console.log("Retrieved call ID:", callId);
      
      if (!callId) {
        throw new Error("No call ID found. The interview may not have started properly.");
      }

      // Fetch analysis from our secure API endpoint
      console.log("Fetching analysis from API...");
      const response = await fetch(`/api/vapi?callId=${callId}`, {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
        },
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || `Error fetching analysis: ${response.statusText}`);
      }

      const data = await response.json();
      console.log("Received analysis data:", data);

      if (!data?.analysis) {
        throw new Error("No analysis data available. The interview may have been too short.");
      }

      // Map the analysis data to our feedback format
      const feedback = {
        score: data.analysis.analysis.score || 0,
        summary: data.analysis.analysis.summary || 'No analysis data available. The interview may have been too short.',
        technicalScore: data.analysis.analysis.technicalKnowledge || 0,
        communicationScore: data.analysis.analysis.communicationSkills || 0,
        problemSolvingScore: data.analysis.analysis.problemSolving || 0
      };
      
      console.log("Processed feedback:", feedback);
      
      // Validate the feedback
      if (!feedback.summary) {
        console.log("Missing summary in feedback");
        throw new Error("Interview was too short or no responses were recorded. Please try again with longer, more detailed responses.");
      }
      
      console.log("Storing feedback in localStorage");
      localStorage.setItem("mockr-feedback", JSON.stringify(feedback));

      // Clean up resources
      console.log("Starting cleanup...");
      
      if (volumeIntervalRef.current) {
        console.log("Clearing volume meter interval");
        clearInterval(volumeIntervalRef.current);
        volumeIntervalRef.current = null;
      }

      // Stop all microphone tracks
      try {
        console.log("Stopping microphone tracks...");
        const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
        stream.getTracks().forEach(track => track.stop());
        console.log("Microphone tracks stopped");
      } catch (error) {
        console.error("Error stopping microphone:", error);
      }

      // Clean up audio context if it exists
      try {
        console.log("Closing audio context...");
        const audioContext = new AudioContext();
        await audioContext.close();
        console.log("Audio context closed");
      } catch (error) {
        console.error("Error closing audio context:", error);
      }

      // Clean up call ID from localStorage
      localStorage.removeItem("mockr-call-id");

      console.log("Cleanup complete, navigating to feedback page");
      setIsStarted(false);
      router.push("/feedback");
    } catch (error) {
      console.error("Error in endInterview:", error);
      console.log("Error details:", {
        name: error instanceof Error ? error.name : "Unknown error",
        message: error instanceof Error ? error.message : String(error),
        stack: error instanceof Error ? error.stack : "No stack trace",
        vapiClientState: vapiRef.current ? 'exists' : 'missing'
      });
      
      setIsStarted(false);
      
      // Store error state for feedback page
      const errorState = {
        message: error instanceof Error ? error.message : "Failed to generate interview feedback. Please try again.",
        timestamp: new Date().toISOString()
      };
      console.log("Storing error state:", errorState);
      localStorage.setItem("mockr-interview-error", JSON.stringify(errorState));
      
      // Still navigate to feedback page, which will show the error
      router.push("/feedback");
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
