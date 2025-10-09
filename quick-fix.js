// Quick fix script to modify the client creation to use existing database
const fs = require('fs');
const path = require('path');

const routeFile = 'src/app/api/admin/clients/create/route.ts';

console.log('🔧 Applying quick fix to use existing database...');

try {
  // Read the current file
  let content = fs.readFileSync(routeFile, 'utf8');
  
  // Replace database creation with existing database usage
  const oldCode = `    // Step 1: Create Baserow database
    console.log('Step 1: Creating Baserow database...')
    database = await createBaserowDatabase(clientName, baserowToken)
    console.log('Database created:', database.id)`;
  
  const newCode = `    // Step 1: Use existing database (quick fix)
    console.log('Step 1: Using existing database...')
    database = { id: '176' } // Your existing database ID
    console.log('Using existing database:', database.id)`;
  
  if (content.includes(oldCode)) {
    content = content.replace(oldCode, newCode);
    fs.writeFileSync(routeFile, content);
    console.log('✅ Quick fix applied successfully!');
    console.log('');
    console.log('The system will now use your existing database (ID: 176)');
    console.log('Each client will get unique table names to avoid conflicts.');
    console.log('');
    console.log('Next steps:');
    console.log('1. Restart your development server (npm run dev)');
    console.log('2. Try creating a client through the admin dashboard');
    console.log('3. The system will create tables in your existing database');
  } else {
    console.log('❌ Could not find the code to replace. The file may have been modified.');
  }
} catch (error) {
  console.log(`❌ Error applying quick fix: ${error.message}`);
}
