import { NextRequest, NextResponse } from "next/server"

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    // Ensure params.id is available
    if (!params?.id) {
      return NextResponse.json(
        { error: "Document ID is required" },
        { status: 400 }
      )
    }

    const documentId = params.id

    const response = await fetch(`https://api.ragie.ai/documents/${documentId}`, {
      headers: {
        authorization: `Bearer ${process.env.RAGIE_API_KEY}`,
        accept: "application/json",
      },
    })

    if (!response.ok) {
      throw new Error(`Ragie API error: ${response.status}`)
    }

    const data = await response.json()
    return NextResponse.json(data)
  } catch (error) {
    console.error("Error checking document status:", error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Failed to check document status" },
      { status: 500 }
    )
  }
} 