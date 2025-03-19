// API configuration file
// ... existing code ...
const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:3000/api';
// ... existing code ...

console.log('API URL:', process.env.REACT_APP_API_URL);

export default API_URL; 