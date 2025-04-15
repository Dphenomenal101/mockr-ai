import React from 'react';

export const FeedbackLoading = () => {
  return (
    <div className="flex flex-col items-center justify-center p-8 space-y-4">
      <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
      <h2 className="text-xl font-semibold text-gray-700">
        Generating your interview feedback...
      </h2>
      <p className="text-gray-500 text-center">
        We're analyzing your responses and preparing personalized recommendations.
      </p>
    </div>
  );
}; 