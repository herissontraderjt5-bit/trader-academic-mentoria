const fs = require('fs');
const path = require('path');
const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '../.env' });

const supabase = createClient(process.env.VITE_SUPABASE_URL, process.env.VITE_SUPABASE_ANON_KEY);

async function debug() {
  console.log("---- DEBUG INFO ----");
  try {
    const configData = fs.readFileSync(path.join(__dirname, 'signalBotConfig.json'), 'utf8');
    console.log("signalBotConfig.json:");
    console.log(configData);
  } catch(e) {
    console.log("signalBotConfig.json error:", e.message);
  }

  const { data, error } = await supabase.from('telegram_signal_settings').select('*').eq('id', 'default').single();
  console.log("\ntelegramSettings (DB):");
  console.log("is_active:", data?.is_active);
  console.log("last_restart_command:", data?.last_restart_command);
  console.log("updated_at:", data?.updated_at);
}
debug();
