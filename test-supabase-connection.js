import { createClient } from '@supabase/supabase-js'
import dotenv from 'dotenv'

dotenv.config()

const supabaseUrl = process.env.VITE_SUPABASE_URL
const supabaseKey = process.env.VITE_SUPABASE_ANON_KEY

if (!supabaseUrl || !supabaseKey) {
  console.error('❌ Missing Supabase environment variables!')
  console.log('Make sure you have VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY in your .env file')
  process.exit(1)
}

const supabase = createClient(supabaseUrl, supabaseKey)

async function testConnection() {
  try {
    console.log('🔄 Testing Supabase connection...')
    console.log('URL:', supabaseUrl)
    
    // Test connection by fetching auth users (if accessible)
    const { data: authData, error: authError } = await supabase.auth.admin.listUsers()
    
    if (authError) {
      console.log('⚠️  Auth users not accessible with anon key (this is normal)')
      console.log('Auth Error:', authError.message)
    } else {
      console.log('✅ Auth users found:', authData.users?.length || 0)
    }

    // Try to fetch from profiles table
    const { data: profiles, error: profilesError } = await supabase
      .from('profiles')
      .select('*')
      .limit(5)

    if (profilesError) {
      console.log('⚠️  Profiles table error:', profilesError.message)
      if (profilesError.message.includes('relation "public.profiles" does not exist')) {
        console.log('💡 Profiles table doesn\'t exist yet. You may need to create it or add users first.')
      }
    } else {
      console.log('✅ Profiles found:', profiles?.length || 0)
      if (profiles && profiles.length > 0) {
        console.log('First profile:', JSON.stringify(profiles[0], null, 2))
      }
    }

    // Test a simple query to check if connection works
    const { data, error } = await supabase
      .from('profiles')
      .select('count', { count: 'exact', head: true })

    if (error) {
      console.log('❌ Connection test failed:', error.message)
    } else {
      console.log('✅ Connection successful!')
      console.log('Total profiles count:', data)
    }

  } catch (error) {
    console.error('❌ Unexpected error:', error.message)
  }
}

async function createProfilesTable() {
  console.log('\n🔧 Creating profiles table (if it doesn\'t exist)...')
  
  const { data, error } = await supabase.rpc('create_profiles_table')
  
  if (error) {
    console.log('Note: Could not create profiles table via RPC:', error.message)
    console.log('💡 You may need to create it manually in your Supabase dashboard')
  } else {
    console.log('✅ Profiles table created or already exists')
  }
}

// Run the tests
console.log('🚀 Starting Supabase connection test...\n')
testConnection()
  .then(() => createProfilesTable())
  .then(() => {
    console.log('\n📝 Next steps:')
    console.log('1. Check your Supabase dashboard: https://supabase.com/dashboard/project/isiddstwiwphhopnqsbi')
    console.log('2. Use SQLTools in VS Code to connect and view tables')
    console.log('3. Create users through your app to see them appear in the database')
  })
  .catch(console.error)