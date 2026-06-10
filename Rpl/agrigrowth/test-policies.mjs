import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://ramuxsjdlaokmcsfplsc.supabase.co';
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || 'YOUR_SUPABASE_SERVICE_ROLE_KEY';

const supabase = createClient(supabaseUrl, supabaseKey);

async function check() {
  const { data, error } = await supabase.rpc('get_policies');
  if (error) {
    // If RPC doesn't exist, we can select from pg_policies via standard sql if we have a way,
    // or we can select from pg_policies using a generic query.
    // Let's run a raw query using supabase.from() if possible? No, we can't do raw sql unless we use RPC.
    // Let's try to query pg_policies using RPC or check other things.
    console.log("RPC get_policies failed, let's try direct select from a system view or try to insert anonymously.");
  }
  
  // Let's test insert/update/delete using ANON client to see what fails!
  const anonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InJhbXV4c2pkbGFva21jc2ZwbHNjIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzczNzMwNzQsImV4cCI6MjA5Mjk0OTA3NH0.15kyfgRcIOj6VBk8TdNL2OWjYlM4pkJrBssbnPo09G4';
  const supabaseAnon = createClient(supabaseUrl, anonKey);
  
  const testTrackerId = 'dc0be513-d826-494b-81eb-8736bf34eaa3'; // Sawah A from logs
  const testSampleId = '93ae1aeb-e484-4b3c-b41d-b36e2a3972b8';
  
  console.log("Testing SELECT on growth_sample_logs with ANON key...");
  const { data: selData, error: selError } = await supabaseAnon.from('growth_sample_logs').select('*').limit(1);
  console.log("Anon SELECT error:", selError, "Data length:", selData?.length);

  console.log("Testing UPDATE on growth_sample_logs with ANON key...");
  const { data: updData, error: updError } = await supabaseAnon.from('growth_sample_logs').update({ plant_height: 1.5 }).eq('id', '3b52bb5a-cd88-4977-9102-492a22ebd2c5').select();
  console.log("Anon UPDATE error:", updError, "Updated data:", updData);
}

check();
