/**
 * Script to create model-specific folders on Boertlay FTP server
 * Creates folder structure for all 5 models
 */

import dotenv from 'dotenv';
dotenv.config({ path: '.env.local' });
import ftp from 'basic-ftp';

// Extract models from environment
const loginUsers = JSON.parse(process.env.VITE_LOGIN_USERS || '[]');
const models = loginUsers.map(user => user.modelId);

const createModelFolders = async () => {
  console.log('🚀 Creating model-specific folders on Boertlay...\n');
  
  const client = new ftp.Client();
  client.ftp.verbose = false;
  
  try {
    console.log('🔌 Connecting to Boertlay FTP...');
    await client.access({
      host: process.env.BOERTLAY_FTP_HOST,
      user: process.env.BOERTLAY_FTP_USER,
      password: process.env.BOERTLAY_FTP_PASSWORD,
      port: 21,
      secure: false
    });
    console.log('✅ Connected successfully!');
    
    // Base path for generated images
    const basePath = '/httpdocs/user_pics/generated/';
    
    console.log(`\n📁 Creating folders for ${models.length} models:`);
    
    for (const model of models) {
      const modelPath = `${basePath}${model}/`;
      const currentYearPath = `${modelPath}2025/`;
      const currentMonthPath = `${currentYearPath}11/`;
      
      console.log(`\n📂 Creating: ${model}`);
      
      try {
        // Create model folder
        await client.ensureDir(modelPath);
        console.log(`  ✅ ${modelPath}`);
        
        // Create current year folder
        await client.ensureDir(currentYearPath);
        console.log(`  ✅ ${currentYearPath}`);
        
        // Create current month folder
        await client.ensureDir(currentMonthPath);
        console.log(`  ✅ ${currentMonthPath}`);
        
      } catch (error) {
        console.log(`  ❌ Error creating ${model}: ${error.message}`);
      }
    }
    
    console.log('\n🔍 Verifying created folders...');
    
    // List all created model folders
    const generatedList = await client.list(basePath);
    console.log(`\n📋 Folders in ${basePath}:`);
    
    for (const item of generatedList) {
      if (item.type === 2) { // Directory
        const isNewModel = models.includes(item.name);
        const status = isNewModel ? '✅ NEW' : '📁 EXISTING';
        console.log(`  ${status} ${item.name}/`);
      }
    }
    
    console.log('\n🎉 Model folder creation completed!');
    console.log('\n📋 Summary:');
    console.log(`✅ Base path: ${basePath}`);
    console.log(`✅ Models processed: ${models.length}`);
    console.log(`✅ Structure: {model}/2025/11/ for each model`);
    
    client.close();
    return true;
    
  } catch (error) {
    console.error('\n❌ Folder creation failed!');
    console.error('🔍 Error Details:', error.message);
    client.close();
    return false;
  }
};

// Run the script
if (import.meta.url === `file://${process.argv[1]}`) {
  createModelFolders().then(success => {
    process.exit(success ? 0 : 1);
  });
}

export { createModelFolders };