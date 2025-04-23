import { auth } from "../../../../lib/auth"; // Adjust the path if needed
import { toNextJsHandler } from "better-auth/next-js";
import * as util from 'util';

// Log all request details for debugging
async function logRequest(request, method) {
  console.log(`Auth route ${method} called:`, request.url);
  console.log(`Headers:`, Object.fromEntries([...request.headers.entries()]));
  
  // Log the current adapter being used
  try {
    // Detailed inspection of the auth object
    console.log('Auth configuration:');
    console.log('- Has adapter:', !!auth.adapter);
    console.log('- Adapter type:', auth.adapter?.type);
    console.log('- Adapter config:', JSON.stringify(auth.adapter?.config || {}));
    
    // Check the methods are present
    const methods = [
      'createUser', 'getUserByEmail', 'getUserById', 
      'createSession', 'getSessionByToken'
    ];
    
    methods.forEach(method => {
      console.log(`- Has ${method} method:`, typeof auth.adapter?.[method] === 'function');
    });
    
    // Inspect advanced options
    console.log('- Force production mode:', auth.advanced?.forceProductionMode);
    console.log('- Skip adapter validation:', auth.advanced?.skipAdapterValidation);
  } catch (e) {
    console.log('Could not inspect adapter:', e.message);
  }
  
  // Try to log the request body if it's POST/PUT
  if (method === 'POST' || method === 'PUT') {
    try {
      // Clone the request to avoid consuming the body
      const clonedRequest = request.clone();
      const body = await clonedRequest.text();
      try {
        // Try to parse as JSON
        const jsonBody = JSON.parse(body);
        console.log(`Request body (sanitized):`, {
          ...jsonBody,
          // Redact sensitive fields
          password: jsonBody.password ? '[REDACTED]' : undefined,
          token: jsonBody.token ? '[REDACTED]' : undefined,
        });
      } catch (e) {
        // If not JSON, log as text
        console.log(`Request body (not JSON):`, body.substring(0, 100) + (body.length > 100 ? '...' : ''));
      }
    } catch (error) {
      console.log('Could not log request body:', error.message);
    }
  }
}

// Helper function to create standardized error responses
function createErrorResponse(error) {
  let errorMessage = 'Unknown error';
  let statusCode = 500;
  let errorDetails = {};

  // Check if it's a BetterAuth specific error or a standard Error
  if (error && typeof error === 'object') {
    if ('message' in error) errorMessage = error.message;
    if ('status' in error && typeof error.status === 'number') statusCode = error.status;
    if ('code' in error) errorDetails.code = error.code;
    if ('cause' in error) errorDetails.cause = error.cause;
    if ('stack' in error) errorDetails.stack = error.stack;
  } else if (typeof error === 'string') {
    errorMessage = error;
  }

  console.error(`Auth error (${statusCode}): ${errorMessage}`, errorDetails);
  
  return new Response(JSON.stringify({ 
    error: { 
      message: errorMessage,
      ...errorDetails
    } 
  }), {
    status: statusCode,
    headers: { 'Content-Type': 'application/json' }
  });
}

// Debug helper to inspect Better Auth internals
function inspectAuthHandler(handler) {
  console.log('Better Auth Handler Inspection:');
  
  try {
    // Check internal properties while being careful not to break anything
    const handlerKeys = Object.keys(handler);
    console.log('Handler has properties:', handlerKeys);
    
    // Look for adapter references
    if (handler.adapter) {
      console.log('Handler adapter direct access:', handler.adapter.type);
    }
    
    // Try to inspect without causing errors
    const handlerStr = util.inspect(handler, { depth: 0, showHidden: false });
    console.log('Handler summary:', handlerStr.substring(0, 200) + '...');
  } catch (e) {
    console.log('Handler inspection error:', e.message);
  }
  
  return handler;
}

// Custom handler for debugging
export async function GET(request) {
  await logRequest(request, 'GET');
  try {
    const handler = inspectAuthHandler(toNextJsHandler(auth.handler));
    console.log('Handler created successfully, executing GET request');
    return await handler.GET(request);
  } catch (error) {
    console.error('Auth route GET error:', error);
    return createErrorResponse(error);
  }
}

export async function POST(request) {
  await logRequest(request, 'POST');
  try {
    const handler = inspectAuthHandler(toNextJsHandler(auth.handler));
    console.log('Handler created successfully, executing POST request');
    return await handler.POST(request);
  } catch (error) {
    console.error('Auth route POST error:', error);
    return createErrorResponse(error);
  }
}

// Optional: If you need to handle OPTIONS for CORS preflight specifically for auth routes
export async function OPTIONS(request) {
  await logRequest(request, 'OPTIONS');
  // Add necessary CORS headers
  const headers = {
    'Access-Control-Allow-Credentials': 'true',
    'Access-Control-Allow-Origin': '*', // Be more specific in production
    'Access-Control-Allow-Methods': 'GET,POST,OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type, Authorization', // Add Authorization if needed
  };
  return new Response(null, { status: 204, headers });
}
