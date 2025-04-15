"use client"

import { useEffect, useRef } from "react"

interface TranscriptItem {
  text: string
  speaker: string
  isFinal: boolean
}

interface TranscriptDisplayProps {
  transcript: TranscriptItem[]
}

export default function TranscriptDisplay({ transcript }: TranscriptDisplayProps) {
  const containerRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    // Scroll to bottom when transcript updates
    if (containerRef.current) {
      containerRef.current.scrollTop = containerRef.current.scrollHeight
    }
  }, [transcript])

  return (
    <div ref={containerRef} className="max-h-[400px] overflow-y-auto space-y-4 pr-2">
      {transcript.length === 0 ? (
        <p className="text-gray-500 text-center py-8">The interview transcript will appear here...</p>
      ) : (
        transcript.map((item, index) => (
          <div key={index} className={`flex ${item.speaker === "assistant" ? "justify-start" : "justify-end"}`}>
            <div
              className={`max-w-[80%] rounded-lg p-3 ${
                item.speaker === "assistant" ? "bg-blue-100 text-blue-900" : "bg-green-100 text-green-900"
              } ${!item.isFinal ? "opacity-70" : ""}`}
            >
              <div className="text-xs font-semibold mb-1">
                {item.speaker === "assistant" ? "Interviewer" : "You"}
                {!item.isFinal && " (typing...)"}
              </div>
              <p>{item.text}</p>
            </div>
          </div>
        ))
      )}
    </div>
  )
}
