import { NextResponse } from 'next/server';
import { clerkMiddleware, createRouteMatcher } from '@clerk/nextjs/server';
import { NextRequest } from 'next/server';

// Define routes that should be ignored by Clerk's default processing
// Especially important for routes handling raw data streams like file uploads
const ignoredRoutes = [
  '/api/interview-prep/transcribe',
  '/api/interview-prep/upload-resume',
];

// Define API routes that need CORS
const isApiRoute = createRouteMatcher(['/api/(.*)']);

// Define allowed origins - both the .xyz and .vercel.app domains
const allowedOrigins = ['https://broiscooked.xyz', 'https://broiscooked.vercel.app', 'http://localhost:3000', 'https://www.broiscooked.xyz'];

export default clerkMiddleware(async (auth, request) => {
  // Get the origin from the request headers
  const origin = request.headers.get('origin');
  // Check if the origin is allowed or use a default for testing
  const responseOrigin = origin && allowedOrigins.includes(origin) ? origin : allowedOrigins[0];

  // Handle CORS preflight requests for API routes FIRST
  if (isApiRoute(request) && request.method === 'OPTIONS') {
    return NextResponse.json({}, {
      status: 200,
      headers: {
        'Access-Control-Allow-Credentials': 'true',
        'Access-Control-Allow-Origin': responseOrigin,
        'Access-Control-Allow-Methods': 'GET,POST,PUT,DELETE,OPTIONS',
        'Access-Control-Allow-Headers': 'X-CSRF-Token, X-Requested-With, Accept, Accept-Version, Content-Length, Content-MD5, Content-Type, Date, X-Api-Version, Authorization, Cache-Control, Pragma',
      },
    });
  }

  // Allow Clerk to handle auth for non-ignored routes
  // For ignored routes, Clerk logic is skipped, but we still need to proceed

  // If you needed to protect routes later, you would add checks here based on auth()
  // e.g., if (!auth().userId && isProtectedRoute(request)) return auth().redirectToSignIn();

  // Get the response from the next middleware or handler
  const response = NextResponse.next();

  // Add CORS headers to actual API responses AFTER Clerk processing (or skipping)
  if (isApiRoute(request)) {
    response.headers.set('Access-Control-Allow-Credentials', 'true');
    response.headers.set('Access-Control-Allow-Origin', responseOrigin);
    response.headers.set('Access-Control-Allow-Methods', 'GET,POST,PUT,DELETE,OPTIONS');
    response.headers.set('Access-Control-Allow-Headers', 'X-CSRF-Token, X-Requested-With, Accept, Accept-Version, Content-Length, Content-MD5, Content-Type, Date, X-Api-Version, Authorization, Cache-Control, Pragma');
  }

  return response;
}, {
  debug: false,
  ignoredRoutes: ignoredRoutes // Pass the ignored routes to Clerk
});

// Configure middleware to run on specific paths
export const config = {
  matcher: [
    // Skip Next.js internals and all static files, unless found in search params
    '/((?!_next|[^?]*\.(?:html?|css|js(?!on)|jpe?g|webp|png|gif|svg|ttf|woff2?|ico|csv|docx?|xlsx?|zip|webmanifest)).*)',
    // Always run for API routes
    '/(api|trpc)(.*)',
  ],
};