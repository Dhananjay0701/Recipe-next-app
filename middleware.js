import { NextResponse } from 'next/server';
import { clerkMiddleware, createRouteMatcher } from '@clerk/nextjs/server';
import { NextRequest } from 'next/server';

// Define public routes (optional, but good practice if you intend to protect routes later)
// const isPublicRoute = createRouteMatcher(['/sign-in(.*)', '/sign-up(.*)', '/api/public-route(.*)']);

// Define API routes that need CORS
const isApiRoute = createRouteMatcher(['/api/(.*)']);

export default clerkMiddleware(async (auth, request) => {
  // Handle CORS preflight requests for API routes
  if (isApiRoute(request) && request.method === 'OPTIONS') {
    return NextResponse.json({}, {
      status: 200,
      headers: {
        'Access-Control-Allow-Credentials': 'true',
        'Access-Control-Allow-Origin': '*', // Be more specific in production if possible
        'Access-Control-Allow-Methods': 'GET,POST,PUT,DELETE,OPTIONS',
        'Access-Control-Allow-Headers': 'X-CSRF-Token, X-Requested-With, Accept, Accept-Version, Content-Length, Content-MD5, Content-Type, Date, X-Api-Version, Authorization', // Added Authorization
      },
    });
  }

  // Example: Protect specific routes if needed (uncomment and adjust)
  // const isProtectedRoute = createRouteMatcher(['/dashboard(.*)']);
  // if (isProtectedRoute(request) && !isPublicRoute(request)) {
  //   await auth.protect();
  // }

  // For all requests, let Clerk handle auth and then proceed
  const response = NextResponse.next();

  // Add CORS headers to actual API responses AFTER Clerk processing
  if (isApiRoute(request)) {
    response.headers.set('Access-Control-Allow-Credentials', 'true');
    response.headers.set('Access-Control-Allow-Origin', '*'); // Be more specific in production if possible
    response.headers.set('Access-Control-Allow-Methods', 'GET,POST,PUT,DELETE,OPTIONS');
    response.headers.set('Access-Control-Allow-Headers', 'X-CSRF-Token, X-Requested-With, Accept, Accept-Version, Content-Length, Content-MD5, Content-Type, Date, X-Api-Version, Authorization'); // Added Authorization
  }

  return response;

  // If you needed to combine with another middleware like next-intl:
  // return anotherMiddleware(request);
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