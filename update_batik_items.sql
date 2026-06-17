-- ==========================================
-- UPDATE BATIK ITEMS IN DATABASE
-- ==========================================

-- First, delete any existing items (optional, but clean start)
-- DELETE FROM batik_items;

-- Insert all correct batik items
INSERT INTO batik_items (name, category, price, description, origin, primary_color, secondary_color, bg_color, rating, sold, style_type)
VALUES 
('Parang Klasik', 'tradisional', 250000, 'Motif parang klasik dengan garis diagonal khas batik Jawa', 'Jawa Tengah', '#8B6F47', '#D4B88B', '#f3f3f3', 5, 234, 'parang'),
('Parang Baru', 'tradisional', 270000, 'Motif parang baru dengan detail yang lebih kompleks', 'Jawa Tengah', '#8B6F47', '#D4B88B', '#f3f3f3', 5, 189, 'parang-new'),
('Mega Mendung', 'tradisional', 300000, 'Motif mega mendung yang terinspirasi dari awan', 'Cirebon', '#8B6F47', '#D4B88B', '#f3f3f3', 4, 128, 'mega'),
('Sido Mukti', 'tradisional', 350000, 'Motif sido mukti yang melambangkan kebahagiaan dan kemakmuran', 'Jawa Tengah', '#8B6F47', '#D4B88B', '#f3f3f3', 5, 203, 'sido-mukti'),
('Bunga 1', 'tradisional', 320000, 'Motif bunga dengan desain yang indah dan elegan', 'Jawa', '#8B6F47', '#D4B88B', '#f3f3f3', 5, 97, 'bunga1'),
('Bunga 2', 'tradisional', 340000, 'Motif bunga kedua dengan desain yang unik', 'Jawa', '#8B6F47', '#D4B88B', '#f3f3f3', 5, 156, 'bunga2'),
('Ceplok', 'tradisional', 310000, 'Motif ceplok dengan pola geometris yang khas batik Yogyakarta', 'Yogyakarta', '#8B6F47', '#D4B88B', '#f3f3f3', 5, 187, 'ceplok');
