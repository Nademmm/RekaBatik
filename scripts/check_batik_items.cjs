const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');
const path = require('path');

const envPath = path.resolve(__dirname, '../.env');
let supabaseUrl = '';
let supabaseAnonKey = '';

try {
  const envContent = fs.readFileSync(envPath, 'utf8');
  const lines = envContent.split('\n');
  for (const line of lines) {
    const parts = line.split('=');
    if (parts.length >= 2) {
      const key = parts[0].trim();
      const val = parts.slice(1).join('=').trim();
      if (key === 'VITE_SUPABASE_URL') supabaseUrl = val;
      if (key === 'VITE_SUPABASE_ANON_KEY') supabaseAnonKey = val;
    }
  }
} catch (e) {
  console.error("Gagal membaca .env:", e.message);
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseAnonKey);

async function checkData() {
  const { data, error } = await supabase.from('batik_items').select('*');
  if (error) {
    console.error("Error:", error.message);
  } else {
    console.log("Data batik_items saat ini di database:");
    data.forEach(item => {
      console.log(`- ID: ${item.id}, Name: "${item.name}", StyleType: "${item.style_type}", Colors: [${item.primary_color}, ${item.secondary_color}, ${item.bg_color}]`);
    });
  }
}

checkData().catch(console.error);
