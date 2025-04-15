import { NextRequest, NextResponse } from "next/server"

export async function POST(req: NextRequest) {
  try {
    const formData = await req.formData()
    
    const response = await fetch("https://api.ragie.ai/documents", {
      method: "POST",
      headers: {
        authorization: `Bearer ${process.env.RAGIE_API_KEY}`,
        accept: "application/json",
      },
      body: formData,
    })

    if (!response.ok) {
      throw new Error(`Ragie API error: ${response.status}`)
    }

    const data = await response.json()
    return NextResponse.json(data)
  } catch (error) {
    console.error("Error uploading to Ragie:", error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Failed to upload file" },
      { status: 500 }
    )
  }
} 