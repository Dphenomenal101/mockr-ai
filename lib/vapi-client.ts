// Import Vapi SDK
import Vapi from "@vapi-ai/web";

// Type definitions for Vapi
export type { VapiConfig } from "./vapi";

// Constants
export const INTERVIEW_DURATION_MINUTES = 8;
export const VAPI_TIMEOUT_MINUTES = 10;

// Initialize Vapi with the API key
export function getVapiClient(): Vapi {
  if (!process.env.NEXT_PUBLIC_VAPI_API_KEY) {
    throw new Error("VAPI_API_KEY is not defined");
  }

  // Create a new Vapi client with the SDK
  return new Vapi(process.env.NEXT_PUBLIC_VAPI_API_KEY);
}

// Helper function to format time remaining
export function formatTimeRemaining(seconds: number): string {
  const minutes = Math.floor(seconds / 60);
  const remainingSeconds = seconds % 60;
  return `${minutes}:${remainingSeconds.toString().padStart(2, '0')}`;
}

// Helper function to analyze feedback
export interface AnalysisFeedbackState {
  loading: boolean;
  error?: string;
  data?: {
    score: number;
    summary: string;
    followUpQuestions: string[];
    nextSteps: string[];
    details: {
      technicalScore: number;
      communicationScore: number;
      problemSolvingScore: number;
      strengths: string[];
      improvementAreas: string[];
      successEvaluation: any;
    };
  };
}

export async function analyzeFeedback(transcript: any, options: any): Promise<AnalysisFeedbackState> {
  try {
    // The analysis should be available in the transcript object
    // since it's generated automatically at the end of the call
    if (!transcript || !transcript.analysis) {
      throw new Error("No analysis available for this transcript");
    }

    // Format the response based on the analysis results
    const analysis = transcript.analysis;
    
    // Calculate overall score based on structured data if available
    let overallScore = 85; // Default score
    if (analysis.structuredData) {
      const scores = [
        analysis.structuredData.technicalKnowledge,
        analysis.structuredData.communicationSkills,
        analysis.structuredData.problemSolving
      ].filter(score => typeof score === 'number');
      
      if (scores.length > 0) {
        overallScore = Math.round(scores.reduce((a, b) => a + b) / scores.length);
      }
    }

    return {
      loading: false,
      data: {
        score: overallScore,
        summary: analysis.summary || "",
        followUpQuestions: analysis.structuredData?.followUpQuestions || [],
        nextSteps: analysis.structuredData?.nextSteps || [],
        details: {
          technicalScore: analysis.structuredData?.technicalKnowledge || 0,
          communicationScore: analysis.structuredData?.communicationSkills || 0,
          problemSolvingScore: analysis.structuredData?.problemSolving || 0,
          strengths: analysis.structuredData?.keyStrengths || [],
          improvementAreas: analysis.structuredData?.improvementAreas || [],
          successEvaluation: analysis.successEvaluation || null
        }
      }
    };
  } catch (error) {
    console.error("Error analyzing feedback:", error);
    return {
      loading: false,
      error: error instanceof Error ? error.message : "An error occurred while analyzing feedback"
    };
  }
}

interface VapiTranscript {
  text: string;
  speakerLabels: string[];
  timestamps: {
    start: number;
    end: number;
  }[];
}

interface VapiFeedback {
  score: number;
  summary: string;
  actionableSteps: string[];
  followUpQuestions: string[];
}

export class VapiClient {
  private vapi: Vapi;
  private currentCall: any = null;

  constructor(apiKey: string) {
    this.vapi = new Vapi(apiKey);
    this.setupEventListeners();
  }

  private setupEventListeners() {
    this.vapi.on('call-start', () => {
      console.log('Call started');
    });

    this.vapi.on('call-end', () => {
      console.log('Call ended');
    });

    this.vapi.on('error', (error: any) => {
      console.error('Vapi error:', error);
    });
  }

  async start(assistantId: string) {
    try {
      // Start the call with the assistant ID
      this.currentCall = await this.vapi.start(assistantId);

      return {
        id: this.currentCall.id,
        status: 'started'
      };
    } catch (error) {
      console.error('Error starting call:', error);
      throw error;
    }
  }

  async stop() {
    try {
      await this.vapi.stop();
      return {
        id: this.currentCall?.id,
        status: 'stopped'
      };
    } catch (error) {
      console.error('Error stopping call:', error);
      throw error;
    }
  }

  async pause() {
    try {
      await this.vapi.setMuted(true);
      return {
        id: this.currentCall?.id,
        status: 'paused'
      };
    } catch (error) {
      console.error('Error pausing call:', error);
      throw error;
    }
  }

  async resume() {
    try {
      await this.vapi.setMuted(false);
      return {
        id: this.currentCall?.id,
        status: 'resumed'
      };
    } catch (error) {
      console.error('Error resuming call:', error);
      throw error;
    }
  }

  async analyzeFeedback(transcript: VapiTranscript): Promise<VapiFeedback> {
    try {
      // Implement custom analysis logic here
      // This is a placeholder implementation
      const analysis = {
        score: calculateScore(transcript),
        summary: generateSummary(transcript),
        actionableSteps: generateActionableSteps(transcript),
        followUpQuestions: generateFollowUpQuestions(transcript)
      };

      return analysis;
    } catch (error) {
      console.error('Error analyzing feedback:', error);
      throw error;
    }
  }
}

function calculateScore(transcript: VapiTranscript): number {
  // Implement scoring logic based on transcript content
  // This is a placeholder implementation
  return 85;
}

function generateSummary(transcript: VapiTranscript): string {
  // Generate a summary based on the transcript
  // This is a placeholder implementation
  return "You demonstrated good communication skills and handled the interview questions well. There's room for improvement in providing more specific examples.";
}

function generateActionableSteps(transcript: VapiTranscript): string[] {
  // Generate actionable steps based on the analysis
  // This is a placeholder implementation
  return [
    "Practice providing more specific examples from your experience",
    "Work on maintaining a consistent pace when speaking",
    "Prepare more detailed responses for technical questions"
  ];
}

function generateFollowUpQuestions(transcript: VapiTranscript): string[] {
  // Generate follow-up questions based on the analysis
  // This is a placeholder implementation
  return [
    "Can you provide a specific example of a challenging project you worked on?",
    "How do you handle disagreements with team members?",
    "What are your career goals for the next 3-5 years?"
  ];
}
