import React from 'react';
import { Button } from "@/components/ui/button";
import { useRouter } from "next/navigation";

interface FeedbackErrorProps {
  message: string;
  onRetry?: () => void;
}

export const FeedbackError = ({ message, onRetry }: FeedbackErrorProps) => {
  const router = useRouter();

  return (
    <div className="flex flex-col items-center justify-center p-8 space-y-4">
      <div className="rounded-full h-12 w-12 bg-red-100 flex items-center justify-center">
        <svg
          className="h-6 w-6 text-red-600"
          xmlns="http://www.w3.org/2000/svg"
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
          />
        </svg>
      </div>
      <h2 className="text-xl font-semibold text-gray-700">
        Unable to Generate Feedback
      </h2>
      <p className="text-gray-500 text-center max-w-md">
        {message || "There was an error generating your interview feedback. This might happen if the interview exceeds the 10-minute limit."}
      </p>
      <div className="flex flex-col space-y-3 w-full max-w-xs">
        {onRetry && (
          <Button
            onClick={onRetry}
            variant="default"
            className="w-full"
          >
            Try Again
          </Button>
        )}
        <Button
          onClick={() => router.push("/")}
          variant="outline"
          className="w-full"
        >
          Re-start Interview
        </Button>
      </div>
    </div>
  );
}; 