-- =====================================================
-- REKABATIK — ADD PAYMENT PROOF URL TO ORDERS
-- =====================================================
-- Run this in your Supabase SQL Editor to allow uploading payment proofs for shopping cart orders.

ALTER TABLE orders ADD COLUMN IF NOT EXISTS payment_proof_url TEXT;
