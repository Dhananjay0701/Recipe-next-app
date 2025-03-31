import { S3Client, PutObjectCommand, GetObjectCommand } from '@aws-sdk/client-s3';

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

/**
 * Uploads a file to Cloudflare R2
 * @param {Buffer} buffer - The file buffer to upload
 * @param {string} filename - The name of the file 
 * @param {string} contentType - The content type of the file
 * @param {string} folder - Optional folder path within the bucket
 * @returns {Promise<string>} - The R2 path of the uploaded file
 */
export async function uploadToR2(buffer, filename, contentType, folder = 'static') {
  try {
    // Generate a unique key for the file
    const key = `${folder}/${filename}`;
    
    // Upload to R2
    const uploadCommand = new PutObjectCommand({
      Bucket: STATIC_BUCKET_NAME,
      Key: key,
      Body: buffer,
      ContentType: contentType,
    });
    
    await R2.send(uploadCommand);
    console.log(`Successfully uploaded file to R2: ${key}`);
    
    return key;
  } catch (error) {
    console.error('Error uploading file to R2:', error);
    throw error;
  }
}

/**
 * Generates a URL for an R2 object
 * @param {string} path - The R2 object path
 * @returns {string} - The full URL to access the object
 */
export function getR2Url(path) {
  // Use direct R2 URL with token if available
  if (process.env.R2_ENDPOINT && process.env.R2_TOKEN_VALUE) {
    // Remove any leading slashes from the path
    const cleanPath = path.replace(/^\//, '');
    return `${process.env.R2_ENDPOINT}/${cleanPath}?token=${process.env.R2_TOKEN_VALUE}`;
  }
  
  // Fallback to public URL approach - customize as needed
  return `/api/r2/${encodeURIComponent(path)}`;
} 