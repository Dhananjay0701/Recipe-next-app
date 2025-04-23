import 'dotenv/config';
import { createClient } from '@supabase/supabase-js';

// Initialize Supabase admin client
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY,
  {
    auth: {
      autoRefreshToken: false,
      persistSession: false
    }
  }
);

// Test user data
const testUser = {
  email: 'test@example.com',
  password: 'Test123!',
  name: 'Test User'
};

async function testAuth() {
  try {
    console.log('Testing Supabase authentication...');
    
    // Step 1: Create a user in Supabase Auth
    console.log('Step 1: Creating a user in Supabase Auth...');
    const { data: authData, error: authError } = await supabase.auth.admin.createUser({
      email: testUser.email,
      password: testUser.password,
      email_confirm: true, // Auto-confirm the email
    });
    
    if (authError) {
      // Check if the error is because the user already exists
      if (authError.message.includes('already exists')) {
        console.log('User already exists in Supabase Auth, continuing test...');
      } else {
        throw authError;
      }
    } else {
      console.log('User created in Supabase Auth:', authData.user.id);
    }
    
    // Get the user by email to get user ID
    const { data: userData, error: userError } = await supabase.auth.admin.listUsers();
    
    if (userError) throw userError;
    
    const user = userData.users.find(u => u.email === testUser.email);
    if (!user) throw new Error('Could not find the created user');
    
    // Step 2: Add user info to user_information table
    console.log('Step 2: Adding user info to user_information table...');
    
    // Check if user already exists in the user_information table
    const { data: existingUser, error: checkError } = await supabase
      .from('user_information')
      .select('*')
      .eq('id', user.id)
      .single();
    
    if (checkError && checkError.code !== 'PGRST116') throw checkError;
    
    if (existingUser) {
      console.log('User already exists in user_information table:', existingUser.id);
    } else {
      // Insert user info
      const { data: insertData, error: insertError } = await supabase
        .from('user_information')
        .insert([
          {
            id: user.id,
            email: testUser.email,
            name: testUser.name,
            created_at: new Date(),
            updated_at: new Date()
          }
        ])
        .select();
      
      if (insertError) throw insertError;
      console.log('User added to user_information table:', insertData[0].id);
    }
    
    // Step 3: Test sign-in
    console.log('Step 3: Testing sign-in...');
    const { data: signInData, error: signInError } = await supabase.auth.signInWithPassword({
      email: testUser.email,
      password: testUser.password
    });
    
    if (signInError) throw signInError;
    console.log('Sign-in successful!');
    console.log('Auth token received:', signInData.session.access_token.slice(0, 10) + '...');
    
    // Step 4: Fetch user data
    console.log('Step 4: Fetching user data...');
    const { data: fetchedUser, error: fetchError } = await supabase
      .from('user_information')
      .select('*')
      .eq('id', signInData.user.id)
      .single();
    
    if (fetchError) throw fetchError;
    console.log('User data fetched successfully:', {
      id: fetchedUser.id,
      name: fetchedUser.name,
      email: fetchedUser.email
    });
    
    console.log('\n✅ Authentication test completed successfully!');
    console.log('Your Supabase authentication is properly set up.');
    
  } catch (error) {
    console.error('\n❌ Authentication test failed:', error.message);
    if (error.message.includes('permission denied')) {
      console.error('\nPermission denied error. Make sure:');
      console.error('1. You are using the SUPABASE_SERVICE_ROLE_KEY, not the anon key');
      console.error('2. Row Level Security policies are correctly set up');
      console.error('3. Run the setup-auth script first: npm run setup-auth');
    }
  }
}

// Run the test
testAuth(); 