import { NextResponse } from 'next/server';
import jwt from 'jsonwebtoken';

// Helper function to generate Vapi token
const generateVapiToken = () => {
  const payload = {
    orgId: process.env.VAPI_ORG_ID,
    token: {
      tag: "private"
    }
  };

  return jwt.sign(payload, process.env.VAPI_PRIVATE_KEY || '', {
    expiresIn: "1h" // Setting to 1 hour for security
  });
};

// GET endpoint to fetch call analysis
export async function GET(request: Request) {
  try {
    // Get callId from URL
    const url = new URL(request.url);
    const callId = url.searchParams.get('callId');

    if (!callId) {
      return NextResponse.json({ error: 'Call ID is required' }, { status: 400 });
    }

    // Generate fresh token
    const token = generateVapiToken();

    // Fetch analysis from Vapi API
    const response = await fetch(`https://api.vapi.ai/call/${callId}`, {
      method: "GET",
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
      },
    });

    if (!response.ok) {
      throw new Error(`Vapi API error: ${response.statusText}`);
    }

    const data = await response.json();

    

    if (!data?.analysis) {
      return NextResponse.json(
        { error: 'No analysis data available' },
        { status: 404 }
      );
    }

    return NextResponse.json(data);
  } catch (error) {
    console.error('API Error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch analysis' },
      { status: 500 }
    );
  }
} 