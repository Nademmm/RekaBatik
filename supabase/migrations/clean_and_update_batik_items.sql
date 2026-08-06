-- ==========================================
-- CLEAN UP & UPDATE BATIK ITEMS
-- ==========================================

-- Delete all existing batik items to start fresh
DELETE FROM batik_items;

-- Insert all correct, unique batik items
INSERT INTO batik_items (name, category, price, description, origin, primary_color, secondary_color, bg_color, rating, sold, style_type)
VALUES 
('Parang Klasik', 'tradisional', 250000, 'Motif parang klasik dengan garis diagonal khas batik Jawa', 'Jawa Tengah', '#8B6F47', '#D4B88B', '#f3f3f3', 5, 234, 'parang'),
('Parang Baru', 'tradisional', 270000, 'Motif parang baru dengan detail yang lebih kompleks', 'Jawa Tengah', '#8B6F47', '#D4B88B', '#f3f3f3', 5, 189, 'parang-new'),
('Mega Mendung', 'tradisional', 300000, 'Motif mega mendung yang terinspirasi dari awan', 'Cirebon', '#8B6F47', '#D4B88B', '#f3f3f3', 4, 128, 'mega'),
('Sido Mukti', 'tradisional', 350000, 'Motif sido mukti yang melambangkan kebahagiaan dan kemakmuran', 'Jawa Tengah', '#8B6F47', '#D4B88B', '#f3f3f3', 5, 203, 'sido-mukti'),
('Bunga 1', 'tradisional', 320000, 'Motif bunga dengan desain yang indah dan elegan', 'Jawa', '#8B6F47', '#D4B88B', '#f3f3f3', 5, 97, 'bunga1'),
('Bunga 2', 'tradisional', 340000, 'Motif bunga kedua dengan desain yang unik', 'Jawa', '#8B6F47', '#D4B88B', '#f3f3f3', 5, 156, 'bunga2'),
('Ceplok', 'tradisional', 310000, 'Motif ceplok dengan pola geometris yang khas batik Yogyakarta', 'Yogyakarta', '#8B6F47', '#D4B88B', '#f3f3f3', 5, 187, 'ceplok'),
('Batik Bunga 3', 'floral', 270000, 'Motif bunga yang indah dan elegan.', 'Yogyakarta', '#8B4513', '#D2691E', '#FFF8DC', 5, 0, 'bunga3'),
('Batik Ties', 'modern', 290000, 'Motif ties yang stylish dan modern.', 'Solo, Jawa Tengah', '#4A4A4A', '#8C8C8C', '#F5F5F5', 5, 0, 'ties'),
('Batik Teratai', 'floral', 280000, 'Motif teratai yang lembut dan menawan.', 'Cirebon, Jawa Barat', '#2D6B1C', '#7CB342', '#F4FBF0', 5, 0, 'teratai'),
('Batik Urang', 'regional', 310000, 'Motif urang (udang) khas pesisir.', 'Pekalongan, Jawa Tengah', '#E65100', '#FF9800', '#FFF3E0', 5, 0, 'urang'),
('Batik Iwak', 'regional', 300000, 'Motif iwak (ikan) yang khas Nusantara.', 'Lamongan, Jawa Timur', '#1565C0', '#42A5F5', '#E3F2FD', 5, 0, 'iwak');
