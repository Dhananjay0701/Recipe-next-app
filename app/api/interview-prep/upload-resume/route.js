import { NextResponse } from 'next/server';
import { uploadToR2, getR2Url } from '../../../_utils/r2';
import { S3Client, ListObjectsV2Command, GetObjectCommand } from '@aws-sdk/client-s3';
import crypto from 'crypto';

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

export const dynamic = 'force-dynamic';
   // Remove the top-level import
   // For file uploads, you need to use this instead of the old bodyParser: false
export const runtime = 'nodejs';

// Function to calculate hash of file buffer
function calculateHash(buffer) {
  return crypto.createHash('sha256').update(buffer).digest('hex');
}

// Function to check if a file with the same hash already exists
async function findDuplicateResume(fileHash) {
  try {
    // List all objects in the resumes folder
    const listCommand = new ListObjectsV2Command({
      Bucket: STATIC_BUCKET_NAME,
      Prefix: 'resumes/',
    });
    
    const { Contents } = await R2.send(listCommand);
    
    if (!Contents || Contents.length === 0) {
      return null;
    }
    
    // Check each file to see if it matches our hash
    for (const item of Contents) {
      // Get the file content
      const getCommand = new GetObjectCommand({
        Bucket: STATIC_BUCKET_NAME,
        Key: item.Key,
      });
      
      const response = await R2.send(getCommand);
      const chunks = [];
      
      for await (const chunk of response.Body) {
        chunks.push(chunk);
      }
      
      const fileBuffer = Buffer.concat(chunks);
      const existingHash = calculateHash(fileBuffer);
      
      // If hashes match, we found a duplicate
      if (existingHash === fileHash) {
        return {
          r2Path: item.Key,
          r2Url: getR2Url(item.Key)
        };
      }
    }
    
    // No duplicate found
    return null;
  } catch (error) {
    console.error('Error checking for duplicate resumes:', error);
    return null; // Continue with upload on error
  }
}

export async function POST(request) {
  try {
    // Parse the multipart form data to get the resume file
    const formData = await request.formData();
    const resumeFile = formData.get('resume');
    
    if (!resumeFile) {
      return NextResponse.json(
        { error: 'No resume file provided' },
        { status: 400 }
      );
    }

    // Validate file type
    if (resumeFile.type !== 'application/pdf') {
      return NextResponse.json(
        { error: 'Only PDF files are supported' },
        { status: 400 }
      );
    }

    // Convert the file to buffer
    const buffer = Buffer.from(await resumeFile.arrayBuffer());
    console.log(`Original PDF size: ${buffer.length} bytes`);
    
    // Calculate hash of the file
    const fileHash = calculateHash(buffer);
    
    // Check if this file already exists
    const duplicate = await findDuplicateResume(fileHash);
    
    if (duplicate) {
      // Return existing file information
      console.log(`Duplicate resume found at ${duplicate.r2Path}, skipping upload`);
      
      // Get base64 representation for immediate use
      const base64Pdf = buffer.toString('base64');
      
      return NextResponse.json({
        message: 'Resume already exists',
        r2Path: duplicate.r2Path,
        r2Url: duplicate.r2Url,
        base64Pdf: base64Pdf.substring(0, 100) + '...', // Send a preview of the base64
        isDuplicate: true
      });
    }
    
    // No duplicate found, proceed with upload
    // Generate a unique filename
    const fileName = `resume-${Date.now()}.pdf`;
    
    // Upload to R2 in a 'resumes' folder
    const r2Path = await uploadToR2(buffer, fileName, 'application/pdf', 'resumes');
    console.log(`Resume uploaded to R2 at path: ${r2Path}`);
    
    // Get a URL for accessing the resume
    const r2Url = getR2Url(r2Path);
    
    // Get base64 representation for immediate use
    const base64Pdf = buffer.toString('base64');
    
    return NextResponse.json({
      message: 'Resume uploaded successfully',
      r2Path,
      r2Url,
      base64Pdf: base64Pdf.substring(0, 100) + '...' // Send a preview of the base64
    });
  } catch (error) {
    console.error('Error uploading resume:', error);
    return NextResponse.json(
      { error: 'Failed to upload resume' },
      { status: 500 }
    );
  }
} 