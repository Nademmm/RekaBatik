const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');
const path = require('path');

// Read .env file manually
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
      if (key === 'VITE_SUPABASE_URL') {
        supabaseUrl = val;
      } else if (key === 'VITE_SUPABASE_ANON_KEY') {
        supabaseAnonKey = val;
      }
    }
  }
} catch (e) {
  console.error("Gagal membaca file .env:", e.message);
  process.exit(1);
}

if (!supabaseUrl || !supabaseAnonKey) {
  console.error("VITE_SUPABASE_URL atau VITE_SUPABASE_ANON_KEY tidak ditemukan di file .env");
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseAnonKey);

const newBatikData = [
  {
    name: "Batik Parang",
    description: "Mahakarya batik Jawa dengan pola diagonal berulang menyerupai ombak samudra. Melambangkan kekuasaan, jalinan yang tidak pernah putus, serta keteguhan hati para ksatria dalam berjuang.",
    primary_color: "#5C3E21",
    secondary_color: "#C59B27",
    bg_color: "#FDFCFA"
  },
  {
    name: "Batik Mega Mendung",
    description: "Batik ikonik asal Cirebon yang menampilkan lekukan awan berlapis dengan gradasi warna biru yang menawan. Melambangkan kedalaman jiwa manusia, kesabaran, kedamaian, dan pembawa kesegaran.",
    primary_color: "#1E3A8A",
    secondary_color: "#3B82F6",
    bg_color: "#F8FAFC"
  },
  {
    name: "Batik Ceplok",
    description: "Pola ornamen geometris simetris yang tersusun rapi membentuk kuntum bunga atau bintang. Melambangkan keteraturan hidup, keharmonisan jagad raya, dan keseimbangan jiwa.",
    primary_color: "#4E3629",
    secondary_color: "#D4A373",
    bg_color: "#FAF6F0"
  },
  {
    name: "Batik Sidomukti",
    description: "Batik sogan kraton Surakarta yang sakral dengan detail ornamen flora fauna. Menjadi doa visual agar sang pemakai senantiasa mendapatkan kehidupan yang makmur, mulia, dan sejahtera.",
    primary_color: "#3A2218",
    secondary_color: "#D4B88B",
    bg_color: "#FAF8F5"
  },
  {
    name: "Batik Truntum",
    description: "Karya agung motif taburan bintang kecil yang gemerlap di kegelapan malam, melambangkan cinta kasih yang tulus, abadi, serta menuntun dalam kesetiaan.",
    primary_color: "#1E130C",
    secondary_color: "#A27B5C",
    bg_color: "#FAF8F5"
  },
  {
    name: "Batik Kawung",
    description: "Motif tertua berupa empat lingkaran menyerupai buah kawung (aren) yang berpusat di satu titik. Lambang keadilan, kesucian hati, ketulusan, serta kebijaksanaan.",
    primary_color: "#4A3B32",
    secondary_color: "#D7CCC8",
    bg_color: "#F5F2EB"
  },
  {
    name: "Batik Sekar Jagad",
    description: "Kombinasi indah mirip peta dunia yang menyatukan beragam motif batik dalam satu kain. Melambangkan keindahan yang universal, toleransi, serta keragaman budaya Nusantara.",
    primary_color: "#6D4C41",
    secondary_color: "#A1887F",
    bg_color: "#FAF6F0"
  },
  {
    name: "Batik Beras Utah",
    description: "Motif unik berupa butiran beras yang tumpah tersebar tak beraturan secara estetik. Melambangkan kelimpahan rezeki yang meluap, kemakmuran tanpa batas, dan berkah pangan.",
    primary_color: "#2C1B18",
    secondary_color: "#D7C49E",
    bg_color: "#FDFBF7"
  }
];

async function runUpdate() {
  console.log("Memulai update metadata batik di database Supabase...");

  for (const item of newBatikData) {
    console.log(`Meng-update ${item.name}...`);
    const { data, error } = await supabase
      .from('batik_items')
      .update({
        description: item.description,
        primary_color: item.primary_color,
        secondary_color: item.secondary_color,
        bg_color: item.bg_color
      })
      .eq('name', item.name);

    if (error) {
      console.error(`Gagal meng-update ${item.name}:`, error.message);
    } else {
      console.log(`Berhasil meng-update ${item.name}!`);
    }
  }

  console.log("Selesai mengupdate semua metadata batik!");
}

runUpdate().catch(console.error);
