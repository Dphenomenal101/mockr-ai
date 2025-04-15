import { NextRequest, NextResponse } from "next/server"

export async function GET(request: NextRequest) {
  try {
    const response = await fetch("https://api.ragie.ai/partitions", {
      method: "GET",
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
    console.error("Error listing partitions:", error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Failed to list partitions" },
      { status: 500 }
    )
  }
}

// Create a new partition
export async function POST(request: NextRequest) {
  try {
    const { name } = await request.json()
    
    if (!name || typeof name !== "string") {
      return NextResponse.json(
        { error: "Partition name is required and must be a string" },
        { status: 400 }
      )
    }

    // Validate partition name format (lowercase alphanumeric with _ and -)
    if (!/^[a-z0-9_-]+$/.test(name)) {
      return NextResponse.json(
        { error: "Partition name must be lowercase alphanumeric and may include _ and -" },
        { status: 400 }
      )
    }

    const response = await fetch(`https://api.ragie.ai/partitions/${name}`, {
      method: "PUT",
      headers: {
        authorization: `Bearer ${process.env.RAGIE_API_KEY}`,
        accept: "application/json",
        "Content-Type": "application/json",
      },
    })

    if (!response.ok) {
      throw new Error(`Ragie API error: ${response.status}`)
    }

    return NextResponse.json({ message: `Partition ${name} created successfully` })
  } catch (error) {
    console.error("Error creating partition:", error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Failed to create partition" },
      { status: 500 }
    )
  }
} 