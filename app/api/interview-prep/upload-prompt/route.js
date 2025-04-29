import { NextResponse } from 'next/server';
import { S3Client, PutObjectCommand } from '@aws-sdk/client-s3';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

// Initialize R2 client
const R2 = new S3Client({
  region: 'auto',
  endpoint: process.env.R2_ENDPOINT,
  credentials: {
    accessKeyId: process.env.R2_ACCESS_KEY_ID,
    secretAccessKey: process.env.R2_SECRET_ACCESS_KEY,
  },
});

const STATIC_BUCKET_NAME = process.env.R2_STATIC_BUCKET_NAME;

export async function POST(request) {
  try {
    const formData = await request.formData();
    const promptFile = formData.get('promptFile');

    if (!promptFile) {
      return NextResponse.json(
        { error: 'No prompt file provided' },
        { status: 400 }
      );
    }

    if (promptFile.type !== 'text/plain') {
      return NextResponse.json(
        { error: 'Only text files are allowed' },
        { status: 400 }
      );
    }

    // Read the file as text
    const promptText = await promptFile.text();
    
    // Set a file path in the R2 bucket - use the same path format as expected in chat API
    const filePath = `data_for_interview/prompt.txt`;
    
    // Upload to R2
    await R2.send(
      new PutObjectCommand({
        Bucket: STATIC_BUCKET_NAME,
        Key: filePath,
        Body: promptText,
        ContentType: 'text/plain',
      })
    );

    return NextResponse.json({ 
      success: true, 
      filePath 
    });
    
  } catch (error) {
    console.error('Error uploading prompt file:', error);
    return NextResponse.json(
      { error: 'Failed to upload prompt file' },
      { status: 500 }
    );
  }
} 