import { auth } from "../../../../../lib/auth";
import { NextResponse } from 'next/server';
import { toNextJsHandler } from "better-auth/next-js";

export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url);
    const callbackUrl = searchParams.get('callbackUrl') || '/';
    
    console.log('Google signin route called with callbackUrl:', callbackUrl);
    
    // Create a modified request that Better Auth can understand
    const authUrl = new URL(request.url);
    
    // Ensure we have the callbackUrl parameter set
    if (!authUrl.searchParams.has('callbackUrl')) {
      authUrl.searchParams.set('callbackUrl', callbackUrl);
    }
    
    // Create a new request with the complete URL
    const modifiedRequest = new Request(authUrl, {
      headers: request.headers,
      method: request.method,
    });
    
    // Forward to better-auth's handler
    return await toNextJsHandler(auth.handler).GET(modifiedRequest);
  } catch (error) {
    console.error('Error initiating Google auth:', error);
    
    // Redirect to error page or sign-in page with error
    return NextResponse.redirect(new URL('/sign-in?error=OAuthSignin', request.url));
  }
} 