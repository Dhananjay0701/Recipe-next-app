import { createClient } from '@deepgram/sdk';
import { NextResponse } from 'next/server';

// Get API key from environment variables
const DEEPGRAM_API_KEY = process.env.DEEPGRAM_API_KEY;

export const dynamic = 'force-dynamic';
   // For file uploads, you need to use this instead of the old bodyParser: false
export const runtime = 'nodejs';

export async function POST(request) {
  if (!DEEPGRAM_API_KEY) {
    return NextResponse.json(
      { error: 'Deepgram API key is not configured' },
      { status: 500 }
    );
  }

  try {
    // Parse the multipart form data to get the audio file
    console.log('Received request for transcription...');
    const formData = await request.formData();
    const audioFile = formData.get('audio');
    
    if (!audioFile) {
      console.error('No audio file found in form data.');
      return NextResponse.json(
        { error: 'No audio file provided' },
        { status: 400 }
      );
    }
    console.log(`Audio file received: Name - ${audioFile.name}, Size - ${audioFile.size}, Type - ${audioFile.type}`);

    // Convert the file to buffer
    const buffer = Buffer.from(await audioFile.arrayBuffer());
    console.log(`Audio buffer created, length: ${buffer.length}`);
    
    // Create Deepgram client
    const deepgram = createClient(DEEPGRAM_API_KEY);
    console.log('Deepgram client created. Attempting transcription using SDK v3...');
    
    // Correct v3+ usage: just await the result
    const { result: dgResult, error } = await deepgram.listen.prerecorded.transcribeFile(
      buffer,
      {
        model: 'nova-2',
        language: 'en-US',
        mimetype: audioFile.type || 'audio/webm'
      }
    );

    if (error) {
      console.error('Deepgram error:', error);
      return NextResponse.json({ error: 'Deepgram error' }, { status: 500 });
    }
    console.log('Deepgram v3 response received:', dgResult.results.channels[0].alternatives[0]);
    if (!dgResult || !dgResult.results?.channels[0]?.alternatives[0]) {
      console.error('Unexpected Deepgram response structure:', JSON.stringify(dgResult, null, 2));
      return NextResponse.json({ error: 'Unexpected response structure from Deepgram' }, { status: 500 });
    }

    console.log('Deepgram v3 response received:', JSON.stringify(dgResult, null, 2));
    const transcript = dgResult.results.channels[0].alternatives[0].transcript || '';
    console.log(`Transcription result: "${transcript}"`);
    return NextResponse.json({ transcript });
  } catch (error) {
    // Catch errors from parsing form data, buffer conversion, or unexpected issues
    console.error('Error during transcription processing:', error);

    return NextResponse.json(
      { error: 'Failed to process transcription request', details: error.message },
      { status: 500 }
    );
  }
} 