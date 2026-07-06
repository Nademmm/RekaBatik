-- =====================================================
-- MIGRATION: Tambah kolom is_profile_complete ke tabel stores
-- Jalankan di Supabase SQL Editor
-- =====================================================

ALTER TABLE stores 
ADD COLUMN IF NOT EXISTS is_profile_complete BOOLEAN DEFAULT FALSE;

-- Update toko yang sudah punya semua data wajib menjadi complete
UPDATE stores SET is_profile_complete = TRUE
WHERE 
  status = 'approved'
  AND name IS NOT NULL AND name != ''
  AND owner IS NOT NULL AND owner != ''
  AND specialty IS NOT NULL AND specialty != ''
  AND address IS NOT NULL AND address != ''
  AND phone IS NOT NULL AND phone != ''
  AND hours IS NOT NULL AND hours != ''
  AND price_range IS NOT NULL AND price_range != ''
  AND description IS NOT NULL AND length(description) >= 20
  AND image IS NOT NULL AND image != ''
  AND hero_image IS NOT NULL AND hero_image != ''
  AND tags IS NOT NULL AND array_length(tags, 1) >= 1
  AND motifs IS NOT NULL AND array_length(motifs, 1) >= 1
  AND gallery IS NOT NULL AND array_length(gallery, 1) >= 1;
