import { NextRequest, NextResponse } from "next/server"

export async function POST(req: NextRequest) {
  try {
    const body = await req.json()

    const response = await fetch("https://api.ragie.ai/retrievals", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${process.env.RAGIE_API_KEY}`,
      },
      body: JSON.stringify(body),
    })

    if (!response.ok) {
      throw new Error(`Ragie API error: ${response.status}`)
    }

    const data = await response.json()
    return NextResponse.json(data)
  } catch (error) {
    console.error("Error retrieving from Ragie:", error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Failed to retrieve content" },
      { status: 500 }
    )
  }
} 