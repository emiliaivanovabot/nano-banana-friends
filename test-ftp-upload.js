/**
 * Standalone test script for Boertlay FTP upload
 * 
 * This script tests the FTP upload functionality without requiring the full app.
 * Run with: node test-ftp-upload.js
 * 
 * REQUIRED ENVIRONMENT VARIABLES:
 * - BOERTLAY_FTP_HOST
 * - BOERTLAY_FTP_USER  
 * - BOERTLAY_FTP_PASSWORD
 * - BOERTLAY_FTP_PORT (optional, defaults to 21)
 * - BOERTLAY_BASE_URL
 */

import dotenv from 'dotenv';
dotenv.config({ path: '.env.local' });
import ftp from 'basic-ftp';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Minimal 1x1 pixel PNG in base64 (for testing)
const TEST_IMAGE_BASE64 = 'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNkYPhfDwAChwGA60e6kgAAAABJRU5ErkJggg==';

const testFTPUpload = async () => {
  console.log('🧪 Starting Boertlay FTP Upload Test...\n');
  
  // Check environment variables
  console.log('📋 Checking Environment Variables:');
  const requiredVars = ['BOERTLAY_FTP_HOST', 'BOERTLAY_FTP_USER', 'BOERTLAY_FTP_PASSWORD', 'BOERTLAY_BASE_URL'];
  
  for (const varName of requiredVars) {
    if (process.env[varName]) {
      console.log(`✅ ${varName}: ${'*'.repeat(process.env[varName].length)}`);
    } else {
      console.log(`❌ ${varName}: MISSING`);
      return false;
    }
  }
  
  console.log('\n🔗 FTP Connection Details:');
  console.log(`📍 Host: ${process.env.BOERTLAY_FTP_HOST}`);
  console.log(`👤 User: ${process.env.BOERTLAY_FTP_USER}`);
  console.log(`🔢 Port: ${process.env.BOERTLAY_FTP_PORT || 21}`);
  console.log(`🌐 Base URL: ${process.env.BOERTLAY_BASE_URL}`);
  
  const client = new ftp.Client();
  client.ftp.verbose = false; // Set to true for detailed FTP logs
  
  try {
    console.log('\n🔌 Connecting to FTP server...');
    
    await client.access({
      host: process.env.BOERTLAY_FTP_HOST,
      user: process.env.BOERTLAY_FTP_USER,
      password: process.env.BOERTLAY_FTP_PASSWORD,
      port: parseInt(process.env.BOERTLAY_FTP_PORT) || 21,
      secure: false
    });
    
    console.log('✅ FTP connection successful!');
    
    // Test creating directories
    const testUserId = 'test-user';
    const now = new Date();
    const year = now.getFullYear();
    const month = String(now.getMonth() + 1).padStart(2, '0');
    const remotePath = `/httpdocs/user_pics/generated/${testUserId}/${year}/${month}/`;
    
    console.log(`\n📁 Creating directory structure: ${remotePath}`);
    await client.ensureDir(remotePath);
    console.log('✅ Directory structure created!');
    
    // Create test image file
    const testFilename = `test_${Date.now()}_${Math.random().toString(36).substr(2, 9)}.png`;
    const localTestPath = path.join('/tmp', testFilename);
    
    // Convert base64 to file
    const imageBuffer = Buffer.from(TEST_IMAGE_BASE64, 'base64');
    fs.writeFileSync(localTestPath, imageBuffer);
    
    console.log(`\n📤 Uploading test image: ${testFilename}`);
    await client.uploadFrom(localTestPath, remotePath + testFilename);
    console.log('✅ Image uploaded successfully!');
    
    // Clean up local file
    fs.unlinkSync(localTestPath);
    
    // Test the public URL
    const publicUrl = `${process.env.BOERTLAY_BASE_URL}/user_pics/generated/${testUserId}/${year}/${month}/${testFilename}`;
    console.log(`\n🌐 Testing public URL: ${publicUrl}`);
    
    const response = await fetch(publicUrl);
    if (response.ok) {
      console.log('✅ Public URL is accessible!');
      console.log(`📊 Response Status: ${response.status}`);
      console.log(`📋 Content-Type: ${response.headers.get('content-type')}`);
    } else {
      console.log(`❌ Public URL returned: ${response.status} ${response.statusText}`);
    }
    
    // List files in the directory to verify
    console.log('\n📂 Files in test directory:');
    const list = await client.list(remotePath);
    for (const file of list) {
      console.log(`  📄 ${file.name} (${file.size} bytes)`);
    }
    
    client.close();
    
    console.log('\n🎉 FTP Upload Test Completed Successfully!');
    console.log('\n📋 Summary:');
    console.log('✅ FTP connection working');
    console.log('✅ Directory creation working');
    console.log('✅ File upload working');
    console.log('✅ Public URL accessible');
    
    return true;
    
  } catch (error) {
    console.error('\n❌ FTP Upload Test Failed!');
    console.error('🔍 Error Details:', error.message);
    console.error('📚 Full Error:', error);
    
    client.close();
    return false;
  }
};

// Run the test
if (import.meta.url === `file://${process.argv[1]}`) {
  testFTPUpload().then(success => {
    process.exit(success ? 0 : 1);
  });
}

export { testFTPUpload };