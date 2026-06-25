export const INDONESIAN_LOCATIONS = [
  {
    province: "DKI Jakarta",
    cities: [
      { name: "Jakarta Pusat", postalCode: "10110" },
      { name: "Jakarta Utara", postalCode: "14410" },
      { name: "Jakarta Selatan", postalCode: "12110" },
      { name: "Jakarta Timur", postalCode: "13210" },
      { name: "Jakarta Barat", postalCode: "11510" },
      { name: "Kepulauan Seribu", postalCode: "14510" },
    ]
  },
  {
    province: "Jawa Barat",
    cities: [
      { name: "Bandung", postalCode: "40111" },
      { name: "Bekasi", postalCode: "17111" },
      { name: "Depok", postalCode: "16411" },
      { name: "Bogor", postalCode: "16111" },
      { name: "Cirebon", postalCode: "45111" },
      { name: "Sukabumi", postalCode: "43111" },
      { name: "Tasikmalaya", postalCode: "46111" },
      { name: "Cimahi", postalCode: "40511" },
    ]
  },
  {
    province: "Jawa Tengah",
    cities: [
      { name: "Semarang", postalCode: "50111" },
      { name: "Surakarta (Solo)", postalCode: "57111" },
      { name: "Yogyakarta (DI Yogyakarta)", postalCode: "55111" },
      { name: "Magelang", postalCode: "56111" },
      { name: "Purwokerto", postalCode: "53111" },
      { name: "Pekalongan", postalCode: "51111" },
    ]
  },
  {
    province: "DI Yogyakarta",
    cities: [
      { name: "Yogyakarta", postalCode: "55111" },
      { name: "Sleman", postalCode: "55511" },
      { name: "Bantul", postalCode: "55711" },
      { name: "Gunung Kidul", postalCode: "55811" },
      { name: "Kulon Progo", postalCode: "55611" },
    ]
  },
  {
    province: "Jawa Timur",
    cities: [
      { name: "Surabaya", postalCode: "60111" },
      { name: "Malang", postalCode: "65111" },
      { name: "Sidoarjo", postalCode: "61211" },
      { name: "Gresik", postalCode: "61111" },
      { name: "Jember", postalCode: "68111" },
      { name: "Kediri", postalCode: "64111" },
    ]
  },
  {
    province: "Banten",
    cities: [
      { name: "Tangerang", postalCode: "15111" },
      { name: "Serang", postalCode: "42111" },
      { name: "Cilegon", postalCode: "42411" },
      { name: "Tangerang Selatan", postalCode: "15311" },
    ]
  },
  {
    province: "Bali",
    cities: [
      { name: "Denpasar", postalCode: "80111" },
      { name: "Badung", postalCode: "80361" },
      { name: "Gianyar", postalCode: "80511" },
      { name: "Tabanan", postalCode: "82111" },
    ]
  },
  {
    province: "Sumatera Utara",
    cities: [
      { name: "Medan", postalCode: "20111" },
      { name: "Binjai", postalCode: "20711" },
      { name: "Pematang Siantar", postalCode: "21111" },
    ]
  },
  {
    province: "Sumatera Barat",
    cities: [
      { name: "Padang", postalCode: "25111" },
      { name: "Bukittinggi", postalCode: "26111" },
    ]
  },
  {
    province: "Riau",
    cities: [
      { name: "Pekanbaru", postalCode: "28111" },
      { name: "Dumai", postalCode: "28811" },
    ]
  },
  {
    province: "Kepulauan Riau",
    cities: [
      { name: "Tanjung Pinang", postalCode: "29111" },
      { name: "Batam", postalCode: "29411" },
    ]
  },
  {
    province: "Aceh",
    cities: [
      { name: "Banda Aceh", postalCode: "23111" },
      { name: "Langsa", postalCode: "24411" },
    ]
  },
  {
    province: "Sulawesi Selatan",
    cities: [
      { name: "Makassar", postalCode: "90111" },
      { name: "Gowa", postalCode: "92111" },
    ]
  },
  {
    province: "Kalimantan Timur",
    cities: [
      { name: "Samarinda", postalCode: "75111" },
      { name: "Balikpapan", postalCode: "76111" },
    ]
  },
  {
    province: "Nusa Tenggara Barat (NTB)",
    cities: [
      { name: "Mataram", postalCode: "83111" },
      { name: "Bima", postalCode: "84111" },
    ]
  },
  {
    province: "Nusa Tenggara Timur (NTT)",
    cities: [
      { name: "Kupang", postalCode: "85111" },
    ]
  },
];

export const PROVINCES = INDONESIAN_LOCATIONS.map(loc => loc.province);
