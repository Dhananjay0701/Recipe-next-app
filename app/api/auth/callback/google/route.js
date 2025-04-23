import { auth } from "../../../../../lib/auth";
import { toNextJsHandler } from "better-auth/next-js";
import { NextResponse } from 'next/server';

// Custom handler for Google OAuth callback with debugging
export async function GET(request) {
  const url = new URL(request.url);
  console.log('Google callback received:', url.toString());
  console.log('Query params:', Object.fromEntries(url.searchParams.entries()));
  
  try {
    // Directly forward to the Better Auth handler and return its response
    // It should handle redirects and session creation internally
    return await toNextJsHandler(auth.handler).GET(request);
  } catch (error) {
    console.error('Google callback error:', error);
    // Redirect to sign-in page with error
    const redirectUrl = new URL('/sign-in?error=OAuthCallback', request.url);
    // Add original error message if available
    if (error instanceof Error) {
      redirectUrl.searchParams.set('message', error.message);
    }
    return NextResponse.redirect(redirectUrl);
  }
}

export async function POST(request) {
  console.log('Google callback POST received:', request.url);
  try {
    return await toNextJsHandler(auth.handler).POST(request);
  } catch (error) {
    console.error('Google callback POST error:', error);
    return NextResponse.redirect(new URL('/sign-in?error=OAuthCallback', request.url));
  }
} 