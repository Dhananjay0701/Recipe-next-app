// This is a script to run the uploadPromptFiles function from the upload-prompt.js file

import uploadPromptFiles from '../app/api/interview-prep/upload-prompt.js';

console.log('Starting the prompt upload process...');

// Execute the function
uploadPromptFiles()
  .then(() => {
    console.log('Upload process completed!');
    process.exit(0);
  })
  .catch((error) => {
    console.error('Error during upload process:', error);
    process.exit(1);
  }); 