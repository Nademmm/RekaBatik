-- =====================================================
-- REKABATIK - MIGRATION: Admin & Chat Feature
-- Jalankan file ini di Supabase SQL Editor
-- =====================================================

-- 1. Tambah kolom owner_id & status ke tabel stores
ALTER TABLE stores ADD COLUMN IF NOT EXISTS owner_id UUID REFERENCES auth.users(id);
ALTER TABLE stores ADD COLUMN IF NOT EXISTS status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected'));

-- Jadikan toko yang sudah ada sebelumnya menjadi 'approved'
UPDATE stores SET status = 'approved' WHERE status = 'pending' AND owner_id IS NULL;

-- 2. Tambah kolom info pembayaran ke tabel orders (jika belum ada)
ALTER TABLE orders ADD COLUMN IF NOT EXISTS payment_status TEXT DEFAULT 'pending'
  CHECK (payment_status IN ('pending', 'awaiting_verification', 'paid', 'failed'));

ALTER TABLE orders ADD COLUMN IF NOT EXISTS payment_method TEXT;
ALTER TABLE orders ADD COLUMN IF NOT EXISTS shipping_address JSONB;
ALTER TABLE orders ADD COLUMN IF NOT EXISTS notes TEXT;
ALTER TABLE orders ADD COLUMN IF NOT EXISTS quantity INTEGER DEFAULT 1;

-- 3. Update orders status check constraint (add 'negotiating' status)
ALTER TABLE orders DROP CONSTRAINT IF EXISTS orders_status_check;
ALTER TABLE orders ADD CONSTRAINT orders_status_check
  CHECK (status IN ('negotiating', 'processing', 'shipping', 'delivered', 'cancelled'));

-- 4. Create messages table
CREATE TABLE IF NOT EXISTS messages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  order_id TEXT REFERENCES orders(id) ON DELETE CASCADE,
  sender_id UUID REFERENCES auth.users(id),
  sender_role TEXT NOT NULL CHECK (sender_role IN ('user', 'artisan')),
  message TEXT NOT NULL,
  price_offer NUMERIC,
  negotiation_status TEXT CHECK (negotiation_status IN ('pending', 'accepted', 'rejected')),
  status TEXT DEFAULT 'sent' CHECK (status IN ('sent', 'delivered', 'read')),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 5. Enable RLS for messages
ALTER TABLE messages ENABLE ROW LEVEL SECURITY;

-- Kebijakan: Pengguna bisa membaca pesan pada order mereka sendiri
DROP POLICY IF EXISTS "Users can view messages for their orders" ON messages;
CREATE POLICY "Users can view messages for their orders"
ON messages FOR SELECT
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM orders o
    WHERE o.id = messages.order_id
    AND (
      o.user_id = auth.uid()
      OR EXISTS (SELECT 1 FROM stores s WHERE s.owner_id = auth.uid() AND s.name = o.artisan)
    )
  )
);

-- Kebijakan: Pengguna bisa mengirim pesan pada order mereka
DROP POLICY IF EXISTS "Users can insert messages for their orders" ON messages;
CREATE POLICY "Users can insert messages for their orders"
ON messages FOR INSERT
TO authenticated
WITH CHECK (
  sender_id = auth.uid()
  AND EXISTS (
    SELECT 1 FROM orders o
    WHERE o.id = messages.order_id
    AND (
      o.user_id = auth.uid()
      OR EXISTS (SELECT 1 FROM stores s WHERE s.owner_id = auth.uid() AND s.name = o.artisan)
    )
  )
);

-- Kebijakan: Sender bisa update status pesannya (misal: mark read)
DROP POLICY IF EXISTS "Sender can update their messages" ON messages;
CREATE POLICY "Sender can update their messages"
ON messages FOR UPDATE
TO authenticated
USING (sender_id = auth.uid() OR
  EXISTS (
    SELECT 1 FROM orders o
    JOIN stores s ON s.name = o.artisan
    WHERE o.id = messages.order_id AND s.owner_id = auth.uid()
  )
);

-- 6. Enable Realtime for messages table
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_publication_tables 
    WHERE pubname = 'supabase_realtime' AND tablename = 'messages'
  ) THEN
    ALTER PUBLICATION supabase_realtime ADD TABLE messages;
  END IF;
END
$$;

-- 7. Artisan update policy untuk orders (bisa update status & estimated_date)
DROP POLICY IF EXISTS "Artisans can update their store orders" ON orders;
CREATE POLICY "Artisans can update their store orders"
ON orders FOR UPDATE
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM stores s
    WHERE s.owner_id = auth.uid()
    AND s.name = orders.artisan
  )
);

-- 8. Artisan view policy untuk orders (bisa melihat pesanan ke tokonya)
DROP POLICY IF EXISTS "Artisans can view their store orders" ON orders;
CREATE POLICY "Artisans can view their store orders"
ON orders FOR SELECT
TO authenticated
USING (
  auth.uid() = user_id
  OR EXISTS (
    SELECT 1 FROM stores s
    WHERE s.owner_id = auth.uid()
    AND s.name = orders.artisan
  )
);

-- 9. User update policy (untuk update payment_status saat bayar)
DROP POLICY IF EXISTS "Users can update their own orders" ON orders;
CREATE POLICY "Users can update their own orders"
ON orders FOR UPDATE
TO authenticated
USING (auth.uid() = user_id);

-- 10. Enable RLS for stores and add policies
ALTER TABLE stores ENABLE ROW LEVEL SECURITY;

-- Kebijakan: Pengguna yang sudah login bisa membuat toko mereka sendiri
DROP POLICY IF EXISTS "Users can insert their own stores" ON stores;
CREATE POLICY "Users can insert their own stores"
ON stores FOR INSERT
TO authenticated
WITH CHECK (owner_id = auth.uid());

-- Kebijakan: Semua orang (termasuk anon) bisa melihat daftar toko
DROP POLICY IF EXISTS "Anyone can view stores" ON stores;
CREATE POLICY "Anyone can view stores"
ON stores FOR SELECT
USING (true);

-- Kebijakan: Super admin bisa update status toko
DROP POLICY IF EXISTS "Super admin can update stores" ON stores;
CREATE POLICY "Super admin can update stores"
ON stores FOR UPDATE
TO authenticated
USING ( (auth.jwt() -> 'user_metadata' ->> 'role') = 'super_admin' );

-- Kebijakan: Pengrajin bisa update tokonya sendiri
DROP POLICY IF EXISTS "Artisans can update their own stores" ON stores;
CREATE POLICY "Artisans can update their own stores"
ON stores FOR UPDATE
TO authenticated
USING ( owner_id = auth.uid() );

-- =====================================================
-- Selesai! Jalankan SQL ini di Supabase SQL Editor.
-- =====================================================
