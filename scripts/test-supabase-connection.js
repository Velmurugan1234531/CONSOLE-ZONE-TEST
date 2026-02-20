
require('dotenv').config({ path: '.env.local' });
const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey) {
    console.error('❌ Missing Supabase credentials in .env.local');
    console.log('URL:', supabaseUrl);
    console.log('KEY:', supabaseKey ? 'Found' : 'Missing');
    process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function testConnection() {
    console.log('Testing connection to:', supabaseUrl);

    try {
        const { data, error } = await supabase.from('rentals').select('count', { count: 'exact', head: true });

        if (error) {
            console.error('❌ Connection failed:', error);
        } else {
            console.log('✅ Connection successful!');
            console.log('Rentals count:', data); // data is null for head:true usually, count is in count
        }

        // Try fetching one record
        const { data: rows, error: fetchError } = await supabase.from('rentals').select('*').limit(1);
        if (fetchError) {
            console.error('❌ Fetch failed:', fetchError);
        } else {
            console.log('✅ Fetched rows:', rows.length);
            if (rows.length > 0) console.log('Sample ID:', rows[0].id);
        }

    } catch (err) {
        console.error('❌ Unexpected error:', err);
    }
}

testConnection();
