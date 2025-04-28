# Mock Interview Practice Feature

This feature provides a speech-to-text mock interview experience with AI-powered feedback.

## Features

- Voice-based interaction (no typing)
- Resume upload and analysis
- AI-driven interview questions and feedback
- Realistic interview practice experience

## Technical Details

### Frontend

- React with Next.js
- HTML5 Audio API for voice recording
- CSS Modules for styling

### Backend

- Next.js API Routes
- Deepgram for speech-to-text transcription
- OpenAI GPT or Google Gemini for interview responses

## Setup

1. Install dependencies:
   ```
   npm install
   ```

2. Set up environment variables by creating a `.env.local` file with:
   ```
   DEEPGRAM_API_KEY=your_deepgram_api_key_here
   OPENAI_API_KEY=your_openai_api_key_here
   # OR
   GOOGLE_API_KEY=your_google_ai_api_key_here
   ```

3. Run the development server:
   ```
   npm run dev
   ```

## How It Works

1. User uploads their resume (PDF only, max 5MB)
2. User clicks the microphone button to start answering questions
3. The AI transcribes the audio and formulates the next interview question
4. The conversation continues until the user ends the session

## Error Handling

- If microphone permission is denied, a clear error message is shown
- If resume upload fails, the user can retry
- If transcription fails, the system retries once before showing an error
- If API calls fail, fallback questions are used to keep the interview flowing 

# Interview Prep Module

This module provides an AI-powered interview preparation experience for users. It allows users to upload their resume and practice interview questions with an AI interviewer.

## Features

- Resume upload and analysis
- Mock interview with AI interviewer
- Response feedback and suggestions

## R2 Storage Implementation

The interview prep module uses Cloudflare R2 for storing resumes and prompt files. This allows for serverless deployment without depending on local file storage.

### How it works:

1. **Resume Upload**: When a user uploads their resume, it's stored in the R2 bucket in the `resumes` folder and a URL is generated for accessing it.

2. **Interview Prompts**: Interview prompt files are stored in the R2 bucket in the `data_for_interview` folder. These are fetched during the interview session.

### Setting up R2 Storage:

1. Make sure you have the following environment variables configured:
   - `R2_ENDPOINT`: Your Cloudflare R2 endpoint URL
   - `R2_ACCESS_KEY_ID`: Your R2 access key
   - `R2_SECRET_ACCESS_KEY`: Your R2 secret key
   - `R2_BUCKET_NAME`: The name of your R2 bucket
   - `R2_TOKEN_VALUE` (optional): For public URL access with token authentication

2. Upload the interview prompt files:
   ```
   npm run upload-prompts
   ```

## Implementation Details

- Uses either OpenAI or Google's Gemini LLM for generating interview questions
- PDF resume processing for context-aware questions
- Conversational history tracking for coherent interview flow

## API Endpoints

- `POST /api/interview-prep/upload-resume`: Upload and process a resume (PDF only)
- `POST /api/interview-prep/chat`: Get the next interview question based on conversation history 