-- ==============================================================================
-- REKABATIK - SEED SCRIPT: AKUN DEMO EVALUASI DEWAN JURI
-- File: supabase/migrations/seed_demo_accounts.sql
-- ==============================================================================
-- Jalankan skrip ini di SQL Editor Supabase untuk membuat 3 akun pengujian
-- lengkap dengan password 'RekaBatik2026!', relasi toko, order demo, & chat.
-- ==============================================================================

CREATE EXTENSION IF NOT EXISTS pgcrypto;

-- 1. SEED AKUN SUPABASE AUTH (auth.users & auth.identities)
DO $$
DECLARE
  v_admin_id UUID   := 'd0000000-0000-0000-0000-000000000001'::uuid;
  v_artisan_id UUID := 'd0000000-0000-0000-0000-000000000002'::uuid;
  v_user_id UUID    := 'd0000000-0000-0000-0000-000000000003'::uuid;
  v_password TEXT   := 'RekaBatik2026!';
  v_hash TEXT       := crypt('RekaBatik2026!', gen_salt('bf'));
BEGIN

  -- 1A. Akun Super Admin: admin.demo@rekabatik.com
  INSERT INTO auth.users (
    id, instance_id, aud, role, email, encrypted_password,
    email_confirmed_at, raw_app_meta_data, raw_user_meta_data,
    created_at, updated_at
  ) VALUES (
    v_admin_id,
    '00000000-0000-0000-0000-000000000000',
    'authenticated',
    'authenticated',
    'admin.demo@rekabatik.com',
    v_hash,
    NOW(),
    '{"provider": "email", "providers": ["email"]}'::jsonb,
    '{"role": "super_admin", "name": "Super Admin RekaBatik", "avatar_url": ""}'::jsonb,
    NOW(),
    NOW()
  )
  ON CONFLICT (id) DO UPDATE SET
    encrypted_password = v_hash,
    raw_user_meta_data = '{"role": "super_admin", "name": "Super Admin RekaBatik", "avatar_url": ""}'::jsonb,
    email_confirmed_at = NOW();

  INSERT INTO auth.identities (
    id, user_id, identity_data, provider, provider_id, last_sign_in_at, created_at, updated_at
  ) VALUES (
    v_admin_id,
    v_admin_id,
    jsonb_build_object('sub', v_admin_id::text, 'email', 'admin.demo@rekabatik.com'),
    'email',
    v_admin_id::text,
    NOW(),
    NOW(),
    NOW()
  )
  ON CONFLICT (provider, provider_id) DO NOTHING;

  -- 1B. Akun Artisan / Pengrajin: artisan.demo@rekabatik.com
  INSERT INTO auth.users (
    id, instance_id, aud, role, email, encrypted_password,
    email_confirmed_at, raw_app_meta_data, raw_user_meta_data,
    created_at, updated_at
  ) VALUES (
    v_artisan_id,
    '00000000-0000-0000-0000-000000000000',
    'authenticated',
    'authenticated',
    'artisan.demo@rekabatik.com',
    v_hash,
    NOW(),
    '{"provider": "email", "providers": ["email"]}'::jsonb,
    '{"role": "artisan", "name": "Pak Joko Santoso", "phone": "+6281234567890"}'::jsonb,
    NOW(),
    NOW()
  )
  ON CONFLICT (id) DO UPDATE SET
    encrypted_password = v_hash,
    raw_user_meta_data = '{"role": "artisan", "name": "Pak Joko Santoso", "phone": "+6281234567890"}'::jsonb,
    email_confirmed_at = NOW();

  INSERT INTO auth.identities (
    id, user_id, identity_data, provider, provider_id, last_sign_in_at, created_at, updated_at
  ) VALUES (
    v_artisan_id,
    v_artisan_id,
    jsonb_build_object('sub', v_artisan_id::text, 'email', 'artisan.demo@rekabatik.com'),
    'email',
    v_artisan_id::text,
    NOW(),
    NOW(),
    NOW()
  )
  ON CONFLICT (provider, provider_id) DO NOTHING;

  -- 1C. Akun Customer / Pengguna Umum: user.demo@rekabatik.com
  INSERT INTO auth.users (
    id, instance_id, aud, role, email, encrypted_password,
    email_confirmed_at, raw_app_meta_data, raw_user_meta_data,
    created_at, updated_at
  ) VALUES (
    v_user_id,
    '00000000-0000-0000-0000-000000000000',
    'authenticated',
    'authenticated',
    'user.demo@rekabatik.com',
    v_hash,
    NOW(),
    '{"provider": "email", "providers": ["email"]}'::jsonb,
    '{"role": "customer", "name": "Budi Santoso", "phone": "+6289876543210"}'::jsonb,
    NOW(),
    NOW()
  )
  ON CONFLICT (id) DO UPDATE SET
    encrypted_password = v_hash,
    raw_user_meta_data = '{"role": "customer", "name": "Budi Santoso", "phone": "+6289876543210"}'::jsonb,
    email_confirmed_at = NOW();

  INSERT INTO auth.identities (
    id, user_id, identity_data, provider, provider_id, last_sign_in_at, created_at, updated_at
  ) VALUES (
    v_user_id,
    v_user_id,
    jsonb_build_object('sub', v_user_id::text, 'email', 'user.demo@rekabatik.com'),
    'email',
    v_user_id::text,
    NOW(),
    NOW(),
    NOW()
  )
  ON CONFLICT (provider, provider_id) DO NOTHING;

  -- 2. SEED TOKO ARTISAN PENGUJI (stores)
  -- 2A. Toko Milik Akun Artisan (Approved & Aktif untuk Dashboard Pengrajin /admin)
  DELETE FROM public.stores WHERE owner_id = v_artisan_id;
  INSERT INTO public.stores (
    name, owner, established, specialty, address, phone, hours,
    rating, review_count, price_range, tags, image, featured, description, motifs,
    owner_id, status
  ) VALUES (
    'Sanggar Batik Jetis Barokah',
    'Pak Joko Santoso',
    '1985',
    'Batik Tulis & Kustom Warna Alami',
    'Jl. Jetis Kulon No. 42, Sidoarjo, Jawa Timur',
    '+6281234567890',
    '08:00 - 17:00 WIB',
    5,
    28,
    'Rp 250.000 - Rp 1.500.000',
    ARRAY['Batik Tulis', 'Kustom Desain', 'Pewarna Alami', 'Sutera & Katun Primissima'],
    'https://images.unsplash.com/photo-1606787366850-de6330128bfc?auto=format&fit=crop&q=80&w=1000',
    true,
    'Sanggar pengrajin batik tulis generasi ketiga di Kampung Batik Jetis Sidoarjo. Berpengalaman mewujudkan desain wastra kustom personal dan korporat dengan standar mutu canting tradisional terbaik.',
    ARRAY['Mega Mendung', 'Kawung', 'Parang Rusak', 'Sekar Jagad'],
    v_artisan_id,
    'approved'
  );

  -- 2B. Toko Pending untuk Uji Coba Kurasi Super Admin (/super-admin)
  DELETE FROM public.stores WHERE name = 'Batik Tulis Sekar Wangi Jetis';
  INSERT INTO public.stores (
    name, owner, established, specialty, address, phone, hours,
    rating, review_count, price_range, tags, image, featured, description, motifs,
    owner_id, status
  ) VALUES (
    'Batik Tulis Sekar Wangi Jetis',
    'Ibu Siti Aminah',
    '2018',
    'Batik Tulis Kontemporer & Modern',
    'Jl. Kebon Agung No. 12, Sidoarjo',
    '+6282199887766',
    '09:00 - 18:00 WIB',
    5,
    12,
    'Rp 300.000 - Rp 850.000',
    ARRAY['Batik Tulis', 'Motif Flora', 'Katun Prima'],
    'https://images.unsplash.com/photo-1579783902614-a3fb3927b675?auto=format&fit=crop&q=80&w=1000',
    false,
    'UMKM pengrajin batik muda yang berfokus pada eksplorasi motif flora nusantara dengan palet warna pastel kontemporer.',
    ARRAY['Sekar Jagad', 'Truntum'],
    NULL,
    'pending'
  );

  -- 3. SEED PESANAN & PERCAKAPAN NEGOSIASI (orders & messages)
  -- Buat 1 pesanan tahap negosiasi antara Budi Santoso (Customer) & Sanggar Barokah (Artisan)
  DELETE FROM public.orders WHERE id = 'ORD-DEMO-2026-001';
  INSERT INTO public.orders (
    id, user_id, item, description, date, status, total,
    type, primary_color, secondary_color, bg_color, artisan,
    payment_status, quantity, notes, shipping_address
  ) VALUES (
    'ORD-DEMO-2026-001',
    v_user_id,
    'Kain Batik Kustom Parang Kontemporer',
    'Bahan Katun Primissima 2.5m x 1.15m dengan motif Parang kombinasi palet Navy-Gold.',
    NOW() - INTERVAL '2 hours',
    'negotiating',
    450000,
    'Batik Tulis Kustom',
    '#1B365D',
    '#D4AF37',
    '#F4EBD9',
    'Sanggar Batik Jetis Barokah',
    'pending',
    1,
    'Tolong dibuatkan dengan warna dasar krem muda ya pak.',
    '{"name": "Budi Santoso", "phone": "+6289876543210", "street": "Jl. Basuki Rahmat No. 10", "city": "Surabaya", "postal": "60271"}'::jsonb
  );

  -- Percakapan chat negosiasi harga di dalam pesanan tersebut
  DELETE FROM public.messages WHERE order_id = 'ORD-DEMO-2026-001';
  INSERT INTO public.messages (
    order_id, sender_id, sender_role, message, price_offer, negotiation_status, status, created_at
  ) VALUES
  (
    'ORD-DEMO-2026-001',
    v_user_id,
    'user',
    'Halo Pak Joko, saya tertarik memesan batik kustom dengan motif ini. Apakah bisa selesai dalam 10 hari?',
    NULL,
    NULL,
    'read',
    NOW() - INTERVAL '1 hour 50 minutes'
  ),
  (
    'ORD-DEMO-2026-001',
    v_artisan_id,
    'artisan',
    'Halo Mas Budi! Tentu bisa, kami siap proses dengan teknik batik cap-tulis kombinasi agar presisi dan cepat.',
    450000,
    'pending',
    'sent',
    NOW() - INTERVAL '1 hour 30 minutes'
  );

  -- 4. SEED DATA PENGAJUAN PREMIUM SUBSCRIPTION UNTUK SUPER ADMIN (/super-admin)
  -- Masukkan 1 pengajuan pending agar juri bisa langsung mencoba tombol Setujui/Tolak
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'premium_subscriptions') THEN
    DELETE FROM public.premium_subscriptions WHERE user_email = 'customer.premium@example.com';
    INSERT INTO public.premium_subscriptions (
      user_id, user_email, user_name, plan_id, price, sender_name, bank_from,
      notes, status, created_at, expires_at
    ) VALUES (
      v_user_id,
      'customer.premium@example.com',
      'Rizky Pratama',
      'monthly',
      49000,
      'Rizky Pratama',
      'Bank BCA (Transfer VA)',
      'Langganan Premium Paket Bulanan untuk akses studio kanvas tanpa batas.',
      'pending',
      NOW() - INTERVAL '3 hours',
      NOW() + INTERVAL '30 days'
    );
  END IF;

END
$$;

-- ==============================================================================
-- SELESAI: 3 Akun Demo (Super Admin, Artisan, Customer) telah aktif di backend!
-- ==============================================================================
