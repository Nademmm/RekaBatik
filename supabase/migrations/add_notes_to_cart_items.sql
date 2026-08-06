-- Tambah kolom notes ke cart_items untuk menyimpan data desain yang dikembalikan dari penolakan negosiasi
ALTER TABLE cart_items ADD COLUMN IF NOT EXISTS notes TEXT;
