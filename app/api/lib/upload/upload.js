import multer from 'multer';

import path from 'path';
import fs from 'fs';

// Check if the upload directory exists, create it if it doesn't
const uploadDir = path.join(process.cwd(), 'frontend', 'public', 'static');
if (!fs.existsSync(uploadDir)) {
  try {
    fs.mkdirSync(uploadDir, { recursive: true });
    console.log(`Created upload directory: ${uploadDir}`);
  } catch (err) {
    console.error(`Failed to create upload directory: ${err}`);
  }
}

// Set up storage for uploaded images
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, uploadDir);
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, uniqueSuffix + path.extname(file.originalname));
  }
});

export const upload = multer({ 
  storage: storage,
  fileFilter: (req, file, cb) => {
    const fileTypes = /jpeg|jpg|png|gif|webp|bmp|svg/i;
    const extname = fileTypes.test(path.extname(file.originalname).toLowerCase());
    const mimetype = fileTypes.test(file.mimetype);
    
    if (mimetype && extname) {
      return cb(null, true);
    } else {
      cb(new Error(`File type not allowed. Accepted types: ${fileTypes}`));
    }
  },
  limits: { fileSize: 10 * 1024 * 1024 } // 10MB limit
});

// Helper function to handle multer errors
export function handleUploadError(err) {
  if (err instanceof multer.MulterError) {
    return Response.json({ 
      message: 'File upload error', 
      error: err.message 
    }, { status: 400 });
  } else if (err) {
    return Response.json({ 
      message: 'Server error during upload', 
      error: err.message 
    }, { status: 500 });
  }
  return null;
}

// Middleware to handle file uploads in Next.js API routes
export function runMiddleware(req, res, fn) {
  return new Promise((resolve, reject) => {
    fn(req, res, (result) => {
      if (result instanceof Error) {
        return reject(result);
      }
      return resolve(result);
    });
  });
} 