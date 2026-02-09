import { NextResponse } from 'next/server'
import { getSupabaseAdmin } from '@/lib/database/client'

export async function POST() {
  try {
    const supabase = getSupabaseAdmin()
    
    console.log('🚀 Running users table migration...')
    
    // Create users table
    const createTableSQL = `
      -- Create users table for authentication
      CREATE TABLE IF NOT EXISTS users (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        email VARCHAR(255) UNIQUE NOT NULL,
        name VARCHAR(255),
        password_hash TEXT NOT NULL,
        email_verified BOOLEAN DEFAULT false,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
        updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
      );
    `
    
    const { error: createError } = await supabase.rpc('exec_sql', { 
      sql: createTableSQL 
    })
    
    if (createError) {
      console.error('❌ Failed to create users table:', createError)
      return NextResponse.json({ 
        error: 'Failed to create users table',
        details: createError 
      }, { status: 500 })
    }
    
    // Create index
    const createIndexSQL = `
      CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);
    `
    
    const { error: indexError } = await supabase.rpc('exec_sql', { 
      sql: createIndexSQL 
    })
    
    if (indexError) {
      console.log('⚠️ Index creation warning (may already exist):', indexError)
    }
    
    // Create updated_at trigger function
    const createTriggerFunctionSQL = `
      CREATE OR REPLACE FUNCTION update_updated_at_column()
      RETURNS TRIGGER AS $$
      BEGIN
          NEW.updated_at = NOW();
          RETURN NEW;
      END;
      $$ language 'plpgsql';
    `
    
    const { error: functionError } = await supabase.rpc('exec_sql', { 
      sql: createTriggerFunctionSQL 
    })
    
    if (functionError) {
      console.log('⚠️ Trigger function warning:', functionError)
    }
    
    // Create trigger
    const createTriggerSQL = `
      DROP TRIGGER IF EXISTS update_users_updated_at ON users;
      CREATE TRIGGER update_users_updated_at 
          BEFORE UPDATE ON users 
          FOR EACH ROW 
          EXECUTE FUNCTION update_updated_at_column();
    `
    
    const { error: triggerError } = await supabase.rpc('exec_sql', { 
      sql: createTriggerSQL 
    })
    
    if (triggerError) {
      console.log('⚠️ Trigger creation warning:', triggerError)
    }
    
    console.log('✅ Users table migration completed successfully!')
    
    // Test the table
    const { data: testData, error: testError } = await supabase
      .from('users')
      .select('*')
      .limit(1)
    
    if (testError) {
      console.error('❌ Test query failed:', testError)
      return NextResponse.json({ 
        error: 'Migration completed but test failed',
        details: testError 
      }, { status: 500 })
    }
    
    return NextResponse.json({ 
      success: true,
      message: 'Users table migration completed successfully',
      testResult: testData
    })
    
  } catch (error) {
    console.error('❌ Migration error:', error)
    return NextResponse.json({ 
      error: 'Migration failed',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 })
  }
}