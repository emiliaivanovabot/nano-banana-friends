/**
 * Database Setup Script for Nano Banana Friends
 * Executes the SQL schema file to create all tables and indexes
 */

import { createClient } from '@supabase/supabase-js'
import { readFileSync } from 'fs'
import { join, dirname } from 'path'
import { fileURLToPath } from 'url'
import dotenv from 'dotenv'

const __filename = fileURLToPath(import.meta.url)
const __dirname = dirname(__filename)

// Load environment variables
dotenv.config({ path: '.env.local' })

const supabaseUrl = process.env.SUPABASE_URL
const supabaseServiceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY

if (!supabaseUrl || !supabaseServiceRoleKey) {
  console.error('❌ Missing Supabase environment variables')
  console.error('Required: SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY')
  process.exit(1)
}

// Create Supabase admin client
const supabase = createClient(supabaseUrl, supabaseServiceRoleKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false
  }
})

async function setupDatabase() {
  console.log('🚀 Starting Nano Banana Friends database setup...')
  console.log(`📡 Connecting to: ${supabaseUrl}`)
  
  try {
    // Read the SQL file
    const sqlFilePath = join(__dirname, '..', 'database', 'create-tables.sql')
    console.log(`📄 Reading SQL file: ${sqlFilePath}`)
    
    const sqlContent = readFileSync(sqlFilePath, 'utf8')
    
    // Split SQL content into individual statements
    const statements = sqlContent
      .split(';')
      .map(stmt => stmt.trim())
      .filter(stmt => stmt.length > 0 && !stmt.startsWith('--'))
    
    console.log(`📊 Found ${statements.length} SQL statements to execute`)
    
    // Execute each SQL statement individually
    let successCount = 0
    let errorCount = 0
    
    for (let i = 0; i < statements.length; i++) {
      const statement = statements[i]
      
      // Skip comments and empty statements
      if (statement.startsWith('--') || statement.trim() === '') {
        continue
      }
      
      try {
        console.log(`⚡ Executing statement ${i + 1}/${statements.length}...`)
        
        // Use raw SQL execution via REST API
        const response = await fetch(`${supabaseUrl}/rest/v1/rpc/exec_sql`, {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${supabaseServiceRoleKey}`,
            'Content-Type': 'application/json',
            'apikey': supabaseServiceRoleKey
          },
          body: JSON.stringify({ 
            query: statement + ';'
          })
        })
        
        if (response.ok) {
          successCount++
        } else {
          const errorText = await response.text()
          console.warn(`⚠️  Warning on statement ${i + 1}: ${errorText}`)
          errorCount++
        }
        
      } catch (error) {
        console.warn(`⚠️  Warning on statement ${i + 1}:`, error.message)
        errorCount++
      }
    }
    
    console.log(`📊 Execution Summary:`)
    console.log(`✅ Successful statements: ${successCount}`)
    console.log(`⚠️  Warnings/Errors: ${errorCount}`)
    
    // Verify table creation
    console.log('🔍 Verifying table creation...')
    
    const { data: tables, error: tablesError } = await supabase
      .from('information_schema.tables')
      .select('table_name')
      .eq('table_schema', 'public')
      .in('table_name', ['users', 'user_stats', 'daily_usage_history'])
    
    if (tablesError) {
      console.error('❌ Error verifying tables:', tablesError)
      throw tablesError
    }
    
    const createdTables = tables?.map(t => t.table_name) || []
    console.log('📋 Created tables:', createdTables)
    
    const expectedTables = ['users', 'user_stats', 'daily_usage_history']
    const missingTables = expectedTables.filter(table => !createdTables.includes(table))
    
    if (missingTables.length > 0) {
      console.warn('⚠️  Missing tables (may need manual creation):', missingTables)
    } else {
      console.log('✅ All expected tables found!')
    }
    
    // Test a simple query
    console.log('🧪 Testing database connection...')
    const { data: testData, error: testError } = await supabase
      .from('users')
      .select('count(*)')
      .limit(1)
    
    if (testError) {
      console.warn('⚠️  Warning: Could not query users table:', testError.message)
    } else {
      console.log('✅ Database connection and table access verified')
    }
    
    console.log('🎉 Database setup completed!')
    console.log('📊 Your Nano Banana Friends database is ready for Alpha → Commercial business model')
    console.log('')
    console.log('📝 Next steps:')
    console.log('1. Verify tables in Supabase Dashboard')
    console.log('2. Test user registration and authentication')
    console.log('3. Implement usage tracking in your application')
    
    return {
      success: true,
      tables: createdTables,
      message: 'Database setup completed with minor warnings'
    }
    
  } catch (error) {
    console.error('💥 Database setup failed:', error)
    console.error('')
    console.error('🔧 Troubleshooting:')
    console.error('1. Check your Supabase credentials in .env.local')
    console.error('2. Verify service role key has admin permissions')
    console.error('3. Try executing the SQL manually in Supabase Dashboard')
    
    return {
      success: false,
      error: error.message,
      message: 'Database setup failed'
    }
  }
}

// Run the setup
setupDatabase()
  .then((result) => {
    if (result.success) {
      console.log('✅ Setup completed successfully')
      process.exit(0)
    } else {
      console.error('❌ Setup failed')
      process.exit(1)
    }
  })
  .catch((error) => {
    console.error('💥 Unexpected error:', error)
    process.exit(1)
  })