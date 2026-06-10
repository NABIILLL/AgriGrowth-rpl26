import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://ramuxsjdlaokmcsfplsc.supabase.co';
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || 'YOUR_SUPABASE_SERVICE_ROLE_KEY';

const supabase = createClient(supabaseUrl, supabaseKey);

async function check() {
  console.log("Fetching growth_sample_logs...");
  const { data: sampleLogs, error: sampleError } = await supabase
    .from('growth_sample_logs')
    .select('*')
    .limit(10);
    
  if (sampleError) {
    console.error("Error sample logs:", sampleError);
  } else {
    console.log("Sample Logs count:", sampleLogs?.length);
    console.log("Sample Logs:", JSON.stringify(sampleLogs, null, 2));
  }

  console.log("\nFetching growth_logs...");
  const { data: logs, error: logsError } = await supabase
    .from('growth_logs')
    .select('*')
    .limit(10);
    
  if (logsError) {
    console.error("Error growth logs:", logsError);
  } else {
    console.log("Growth Logs count:", logs?.length);
    console.log("Growth Logs:", JSON.stringify(logs, null, 2));
  }
}

check();
