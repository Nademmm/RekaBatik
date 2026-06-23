-- =====================================================
-- REKABATIK - MIGRATION: Fix payment_status constraint
-- =====================================================

-- This script drops the old CHECK constraint on payment_status and creates a new one
-- that includes 'awaiting_verification'.

DO $$
DECLARE
  constraint_name text;
BEGIN
  -- Cari nama constraint untuk payment_status di tabel orders
  SELECT conname INTO constraint_name
  FROM pg_constraint
  WHERE conrelid = 'orders'::regclass
  AND contype = 'c'
  AND pg_get_constraintdef(oid) LIKE '%payment_status%';

  -- Jika constraint ditemukan, drop constraint tersebut
  IF constraint_name IS NOT NULL THEN
    EXECUTE 'ALTER TABLE orders DROP CONSTRAINT ' || constraint_name;
  END IF;
END $$;

-- Tambahkan constraint baru yang mengizinkan 'awaiting_verification'
ALTER TABLE orders ADD CONSTRAINT orders_payment_status_check 
  CHECK (payment_status IN ('pending', 'awaiting_verification', 'paid', 'failed') OR payment_status IS NULL);
