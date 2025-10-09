// Simple script to debug environment variables
require('dotenv').config({ path: '.env.local' });

console.log('🔍 Environment Variables Debug:');
console.log('');

console.log('BASEROW_API_URL:', process.env.BASEROW_API_URL);
console.log('BASEROW_MODERN_MANAGEMENT_TOKEN:', process.env.BASEROW_MODERN_MANAGEMENT_TOKEN);
console.log('BASEROW_MODERN_MANAGEMENT_DATABASE_ID:', process.env.BASEROW_MODERN_MANAGEMENT_DATABASE_ID);
console.log('');

console.log('All BASEROW-related env vars:');
Object.keys(process.env)
  .filter(key => key.includes('BASEROW'))
  .forEach(key => {
    console.log(`${key}: ${process.env[key]}`);
  });

console.log('');
console.log('File system check:');
const fs = require('fs');
const path = require('path');

try {
  const envPath = path.join(__dirname, '.env.local');
  console.log('Looking for .env.local at:', envPath);
  console.log('File exists:', fs.existsSync(envPath));
  
  if (fs.existsSync(envPath)) {
    const content = fs.readFileSync(envPath, 'utf8');
    console.log('File size:', content.length, 'bytes');
    console.log('First 200 chars:', content.substring(0, 200));
  }
} catch (error) {
  console.log('Error reading file:', error.message);
}
