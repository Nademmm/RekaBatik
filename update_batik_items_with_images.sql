-- ==========================================
-- UPDATE BATIK ITEMS WITH IMAGES & REMOVE CATEGORY
-- ==========================================

-- Pastikan kolom image_url ada
ALTER TABLE batik_items ADD COLUMN IF NOT EXISTS image_url TEXT;

-- Hapus kolom category (jika ada)
ALTER TABLE batik_items DROP COLUMN IF EXISTS category;

-- Hapus data yang mereference batik_items terlebih dahulu
DELETE FROM cart_items;
DELETE FROM favorite_batik;

-- Delete all existing batik items to start fresh
DELETE FROM batik_items;

-- Insert all batik items with image references (no category)
INSERT INTO batik_items (name, price, description, origin, primary_color, secondary_color, bg_color, rating, sold, style_type, image_url)
VALUES 
('Batik Parang', 350000, 'Motif parang klasik dengan garis diagonal khas batik Jawa yang melambangkan keberanian dan keteguhan hati.', 'Jawa Tengah', '#8B6F47', '#D4B88B', '#FAF8F5', 5, 234, 'parang', '/src/assets/catalog-images/parang.webp'),
('Batik Mega Mendung', 380000, 'Motif mega mendung khas Cirebon yang terinspirasi dari awan di langit, melambangkan kedamaian dan kesejukan.', 'Cirebon', '#8B6F47', '#D4B88B', '#FAF8F5', 5, 189, 'mega', '/src/assets/catalog-images/mega_mendung.webp'),
('Batik Ceplok', 320000, 'Motif ceplok dengan pola geometris yang khas batik Yogyakarta, penuh makna filosofi.', 'Yogyakarta', '#8B6F47', '#D4B88B', '#FAF8F5', 5, 156, 'ceplok', '/src/assets/catalog-images/ceplok.webp'),
('Batik Sidomukti', 390000, 'Motif sido mukti yang melambangkan kebahagiaan, kemakmuran, dan keselamatan bagi pemakainya.', 'Jawa Tengah', '#8B6F47', '#D4B88B', '#FAF8F5', 5, 203, 'sido-mukti', '/src/assets/catalog-images/sidomukti.webp'),
('Batik Truntum', 360000, 'Motif truntum yang melambangkan cinta abadi dan kesetiaan, cocok untuk acara pernikahan.', 'Jawa Tengah', '#8B6F47', '#D4B88B', '#FAF8F5', 5, 178, 'parang', '/src/assets/catalog-images/truntum.webp'),
('Batik Kawung', 370000, 'Motif kawung yang terinspirasi dari buah kolang-kaling, melambangkan kesempurnaan dan kebijaksanaan.', 'Yogyakarta', '#8B6F47', '#D4B88B', '#FAF8F5', 5, 165, 'ceplok', '/src/assets/catalog-images/kawung.webp'),
('Batik Sekar Jagad', 420000, 'Motif sekar jagad yang melambangkan keindahan dan keragaman dunia, penuh detail yang memukau.', 'Jawa Tengah', '#8B6F47', '#D4B88B', '#FAF8F5', 5, 145, 'parang', '/src/assets/catalog-images/sekar_jagad.webp'),
('Batik Beras Utah', 340000, 'Motif beras utah yang khas dan unik, melambangkan kemakmuran dan kesejahteraan.', 'Jawa Barat', '#8B6F47', '#D4B88B', '#FAF8F5', 5, 132, 'ceplok', '/src/assets/catalog-images/beras_utah.webp');
