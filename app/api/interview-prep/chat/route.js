import { NextResponse } from 'next/server';
import OpenAI from 'openai';
import { GoogleGenerativeAI } from "@google/generative-ai";
import { S3Client, GetObjectCommand, ListObjectsV2Command } from '@aws-sdk/client-s3';

// Get API keys from environment variables
const OPENAI_API_KEY = process.env.OPENAI_API_KEY;
const GOOGLE_API_KEY = process.env.GOOGLE_API_KEY;

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

// Determine which LLM to use based on available API keys
const LLM_PROVIDER = OPENAI_API_KEY ? 'openai' : (GOOGLE_API_KEY ? 'google' : null);

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

// Helper function to find the most recent resume in R2
async function findMostRecentResume() {
  try {
    const command = new ListObjectsV2Command({
      Bucket: STATIC_BUCKET_NAME,
      Prefix: 'resumes/',
    });
    
    const { Contents } = await R2.send(command);
    
    if (!Contents || Contents.length === 0) {
      console.log('No resumes found in R2');
      return null;
    }
    
    // Sort by last modified date, newest first
    Contents.sort((a, b) => b.LastModified - a.LastModified);
    
    // Return the most recent resume path
    console.log(`Found most recent resume: ${Contents[0].Key}`);
    return Contents[0].Key;
  } catch (error) {
    console.error('Error finding most recent resume:', error);
    return null;
  }
}

// Helper function to fetch content from R2
async function fetchFromR2(path) {
  try {
    console.log(`Fetching text from R2: ${path}`);
    const command = new GetObjectCommand({
      Bucket: STATIC_BUCKET_NAME,
      Key: path,
    });
    
    const response = await R2.send(command);
    const chunks = [];
    
    for await (const chunk of response.Body) {
      chunks.push(chunk);
    }
    
    return Buffer.concat(chunks).toString('utf8');
  } catch (error) {
    console.error(`Error fetching ${path} from R2:`, error);
    throw error;
  }
}

// Helper function to fetch a PDF from R2 as a buffer
async function fetchPdfFromR2(path) {
  try {
    console.log(`Fetching PDF from R2: ${path}`);
    
    const command = new GetObjectCommand({
      Bucket: STATIC_BUCKET_NAME,
      Key: path,
    });
    
    const response = await R2.send(command);
    const chunks = [];
    
    for await (const chunk of response.Body) {
      chunks.push(chunk);
    }
    
    const buffer = Buffer.concat(chunks);
    console.log(`Fetched PDF from R2, size: ${buffer.length} bytes`);
    
    // Verify this is a PDF
    if (buffer.length < 4 || buffer.toString('ascii', 0, 4) !== '%PDF') {
      console.error('Retrieved file is not a valid PDF');
    }
    
    return buffer;
  } catch (error) {
    console.error(`Error fetching PDF ${path} from R2:`, error);
    throw error;
  }
}

export async function POST(request) {
  if (!LLM_PROVIDER) {
    return NextResponse.json(
      { error: 'No LLM API key is configured (OpenAI or Google)' },
      { status: 500 }
    );
  }

  try {
    const { transcript, resumeText, history, r2Path: providedR2Path, resumeBase64 } = await request.json();

    console.log(`Provided r2Path: ${providedR2Path || 'not provided'}`);
    
    // If r2Path is not provided, try to find the most recent resume
    let r2Path = providedR2Path;
    if (!r2Path) {
      console.log('No r2Path provided, attempting to find most recent resume');
      r2Path = await findMostRecentResume();
      console.log(`Using most recent resume: ${r2Path || 'none found'}`);
    }
    
    if (!transcript) {
      return NextResponse.json(
        { error: 'No transcript provided' },
        { status: 400 }
      );
    }
    
    // Build the prompt for the LLM by fetching from R2
    let prompt;
    try {
      prompt = await fetchFromR2('data_for_interview/law.txt');
    } catch (error) {
      console.error('Failed to fetch prompt from R2, using default prompt:', error);
      prompt = "You are an expert legal interviewer conducting a mock interview. Ask relevant questions based on the candidate's resume and previous answers.";
    }
    
    // Google Gemini will handle the PDF directly, OpenAI needs text
    if (LLM_PROVIDER === 'google' && (r2Path || resumeBase64)) {
      if (resumeText) {
        prompt += `\n\nCandidate's Resume:
        ${resumeText}`;
      } else {
        prompt += `\n\nNo resume text was provided, but a PDF will be attached.`;
      }
    }
    
    prompt += `\n\nConversation History:
        ${history}
        New user answer (transcript): ${transcript}
        Your Turn: Generate the next interview question based on the Context and Guidelines above.`;
    
    let message = '';
    
    // Call the appropriate LLM API
    if (LLM_PROVIDER === 'openai') {
      message = await callOpenAI(prompt);
    } else {
      // Try to use the PDF file directly with Gemini if available
      if (r2Path) {
        try {
          const pdfBuffer = await fetchPdfFromR2(r2Path);
          
          // Verify we got a valid PDF buffer
          if (!pdfBuffer || pdfBuffer.length === 0) {
            console.error('Empty PDF buffer retrieved from R2');
            message = await callGoogleAI(prompt);
          } else {
            console.log(`Retrieved PDF from R2: ${pdfBuffer.length} bytes`);
            message = await callGoogleAIWithPDF(prompt, pdfBuffer);
          }
        } catch (pdfError) {
          console.error('Error reading PDF from R2:', pdfError);
          message = await callGoogleAI(prompt);
        }
      } else if (resumeBase64) {
        try {
          const pdfBuffer = Buffer.from(resumeBase64, 'base64');
          console.log(`Created PDF buffer from base64: ${pdfBuffer.length} bytes`);
          message = await callGoogleAIWithPDF(prompt, pdfBuffer);
        } catch (pdfError) {
          console.error('Error processing Base64 PDF:', pdfError);
          message = await callGoogleAI(prompt);
        }
      } else {
        console.log('No PDF available, using text-only mode');
        message = await callGoogleAI(prompt);
      }
    }
    
    return NextResponse.json({ message });
  } catch (error) {
    console.error('Error generating chat response:', error);
    return NextResponse.json(
      { error: 'Failed to generate chat response' },
      { status: 500 }
    );
  }
}

// Function to call OpenAI's API
async function callOpenAI(prompt) {
  try {
    const openai = new OpenAI({ apiKey: OPENAI_API_KEY });
    
    const response = await openai.chat.completions.create({
      model: 'gpt-4o-mini',
      messages: [
        { role: 'system', content: 'You are an expert interview coach providing feedback and questions for a mock interview.' },
        { role: 'user', content: prompt }
      ],
      max_tokens: 1024,
      temperature: 0.7,
    });
    
    return response.choices[0].message.content.trim();
  } catch (error) {
    console.error('OpenAI API error:', error);
    return 'I encountered an issue generating a response. Let\'s try a general question: Tell me about a challenging project you worked on and how you overcame obstacles.';
  }
}

// Function to call Google's Gemini API with text only
async function callGoogleAI(prompt) {
  try {
    const genAI = new GoogleGenerativeAI(GOOGLE_API_KEY);
    const model = genAI.getGenerativeModel({ model: 'gemini-2.0-flash' });
    
    const result = await model.generateContent(prompt);
    const response = result.response;
    
    return response.text().trim();
  } catch (error) {
    console.error('Google Gemini API error:', error);
    return 'I encountered an issue generating a response. Let\'s try a general question: What would you say is your greatest professional achievement to date?';
  }
}

// Function to call Google's Gemini API with PDF
async function callGoogleAIWithPDF(prompt, pdfBuffer) {
  try {
    const genAI = new GoogleGenerativeAI(GOOGLE_API_KEY);
    const model = genAI.getGenerativeModel({ model: 'gemini-2.0-flash' });
    
    // Log buffer size to verify we have data
    console.log(`PDF buffer size before sending to Gemini: ${pdfBuffer.length} bytes`);
    
    // Check if buffer is too small to be a real PDF
    if (pdfBuffer.length < 1000) {
      console.warn('PDF buffer is suspiciously small, it may not be a complete PDF');
    }

    // Verify this is actually a PDF by checking the magic number
    if (pdfBuffer.length < 4 || pdfBuffer.toString('ascii', 0, 4) !== '%PDF') {
      console.error('Invalid PDF format - missing PDF header');
      return callGoogleAI(prompt); // Fall back to text-only
    }
    
    // Convert the PDF buffer to base64 string
    const base64EncodedPdf = pdfBuffer.toString('base64');
    
    // Create content parts following Gemini's multipart format
    const parts = [
      { text: prompt },
      {
        inlineData: {
          mimeType: 'application/pdf',
          data: base64EncodedPdf
        }
      }
    ];
    
    // Attempt to generate content with the PDF
    const result = await model.generateContent(parts);
    const response = result.response;
    
    return response.text().trim();
  } catch (error) {
    console.error('Google Gemini PDF API error:', error);
    // Fall back to text-only if PDF processing fails
    return callGoogleAI(prompt);
  }
} 