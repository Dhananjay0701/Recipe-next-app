import { NextResponse } from 'next/server';

export async function GET() {
  return NextResponse.json({
    name: "Interview Prep API",
    endpoints: [
      "/api/interview-prep/transcribe - Transcribe audio using Deepgram",
      "/api/interview-prep/upload-resume - Upload and extract text from a resume PDF",
      "/api/interview-prep/chat - Get interview questions from the LLM"
    ],
    status: "active"
  });
}

export async function POST() {
  return NextResponse.json(
    { error: 'Method not supported. Please use specific endpoints.' },
    { status: 405 }
  );
}
