-- ==========================================
-- REKABATIK MIGRATION: Upgrade Orders Table
-- Jalankan script INI SAJA di SQL Editor Supabase
-- (tidak perlu jalankan schema.sql penuh lagi)
-- ==========================================

-- Tambah kolom baru ke tabel orders (aman, tidak menghapus data lama)
ALTER TABLE orders
  ADD COLUMN IF NOT EXISTS payment_method TEXT DEFAULT 'transfer_bca' 
    CHECK (payment_method IN ('transfer_bca', 'transfer_mandiri', 'gopay', 'ovo', 'cod') OR payment_method IS NULL),
  ADD COLUMN IF NOT EXISTS payment_status TEXT DEFAULT 'pending' 
    CHECK (payment_status IN ('pending', 'awaiting_verification', 'paid', 'failed') OR payment_status IS NULL),
  ADD COLUMN IF NOT EXISTS shipping_address JSONB,
  ADD COLUMN IF NOT EXISTS quantity INT DEFAULT 1,
  ADD COLUMN IF NOT EXISTS notes TEXT;

-- Buat tabel cart_items jika belum ada
CREATE TABLE IF NOT EXISTS cart_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  batik_id BIGINT REFERENCES batik_items(id) ON DELETE CASCADE,
  custom_design_id BIGINT REFERENCES custom_designs(id) ON DELETE CASCADE,
  quantity INT DEFAULT 1 CHECK (quantity > 0),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enable RLS jika belum aktif
ALTER TABLE cart_items ENABLE ROW LEVEL SECURITY;

-- Drop dulu jika ada (idempotent)
DROP POLICY IF EXISTS "Users can view their own cart items" ON cart_items;
DROP POLICY IF EXISTS "Users can insert their own cart items" ON cart_items;
DROP POLICY IF EXISTS "Users can update their own cart items" ON cart_items;
DROP POLICY IF EXISTS "Users can delete their own cart items" ON cart_items;

-- Buat policies
CREATE POLICY "Users can view their own cart items"
ON cart_items FOR SELECT TO authenticated USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own cart items"
ON cart_items FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own cart items"
ON cart_items FOR UPDATE TO authenticated USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own cart items"
ON cart_items FOR DELETE TO authenticated USING (auth.uid() = user_id);
