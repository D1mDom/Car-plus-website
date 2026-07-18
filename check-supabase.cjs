const { createClient } = require('@supabase/supabase-js');
const dotenv = require('dotenv');
const path = require('path');

dotenv.config({ path: path.resolve(__dirname, '.env') });

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseKey = process.env.VITE_SUPABASE_PUBLISHABLE_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.log('Error: Missing Supabase credentials in .env');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function checkConnection() {
  try {
    // A simple query to check connection, assuming there might be tables or we can just check if it throws
    console.log('Connecting to Supabase...');
    const { data, error } = await supabase.from('').select('*').limit(1); // Invalid table, but checks if API is up
    
    if (error && error.code) {
        console.log('Supabase API is reachable (returned an error for empty table, which is expected):', error.code);
    } else {
        console.log('Supabase connected effectively.');
    }
  } catch (e) {
    console.log('Failed to connect:', e.message);
  }
}

checkConnection();
