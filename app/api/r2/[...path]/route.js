import { S3Client, GetObjectCommand } from '@aws-sdk/client-s3';
import { Readable } from 'stream';

// Initialize R2 client
const R2 = new S3Client({
  region: 'auto',
  endpoint: process.env.R2_ENDPOINT,
  credentials: {
    accessKeyId: process.env.R2_ACCESS_KEY_ID,
    secretAccessKey: process.env.R2_SECRET_ACCESS_KEY,
  },
});

const BUCKET_NAME = process.env.R2_BUCKET_NAME;
const STATIC_BUCKET_NAME = process.env.R2_STATIC_BUCKET_NAME || BUCKET_NAME;

// Helper to convert stream to buffer
async function streamToBuffer(stream) {
  const chunks = [];
  for await (const chunk of stream) {
    chunks.push(typeof chunk === 'string' ? Buffer.from(chunk) : chunk);
  }
  return Buffer.concat(chunks);
}

/**
 * GET handler for R2 objects
 * Acts as a proxy to retrieve files from R2
 */
export async function GET(request, { params }) {
  try {
    // Get the file path from the URL params
    const path = params.path.join('/');
    
    // Determine the content type (basic implementation)
    let contentType = 'application/octet-stream';
    if (path.endsWith('.jpg') || path.endsWith('.jpeg')) contentType = 'image/jpeg';
    if (path.endsWith('.png')) contentType = 'image/png';
    if (path.endsWith('.webp')) contentType = 'image/webp';
    if (path.endsWith('.gif')) contentType = 'image/gif';
    
    // Get the object from R2
    const getCommand = new GetObjectCommand({
      Bucket: STATIC_BUCKET_NAME,
      Key: path,
    });
    
    const response = await R2.send(getCommand);
    
    // Convert the stream to a buffer
    const buffer = await streamToBuffer(response.Body);
    
    // Return the file with the appropriate content type
    return new Response(buffer, {
      headers: {
        'Content-Type': contentType,
        'Cache-Control': 'public, max-age=31536000',
      },
    });
  } catch (error) {
    console.error('Error retrieving file from R2:', error);
    return new Response(JSON.stringify({ error: 'File not found' }), {
      status: 404,
      headers: {
        'Content-Type': 'application/json',
      },
    });
  }
} 