-- Motodo QA purchase listing (SQL Editor / project owner).
-- DEMO DATA CATALOG IS UNCHANGED. This file does not UPDATE or DELETE is_demo listings.
--
-- This listing is intentionally is_demo=false so the real cart/checkout/order flow
-- can be tested locally. Do not treat it as production inventory.
--
-- Apply in the Supabase SQL Editor (same way as demo_motodo_marketplace.sql).
-- The Vite app does not run this file. Do not put service_role in frontend env.
--
-- Idempotent: deterministic UUID + collapse of other "(Testing Buy)" rows without orders.
-- Intended final state: exactly one active listing whose name contains "(Testing Buy)".

BEGIN;

DO $$
DECLARE
  v_qa_id uuid := 'b0000000-0000-4000-8000-000000000101';
  v_source_id uuid := 'b0000000-0000-4000-8000-000000000001';
  v_seller_id uuid;
  v_extra int;
BEGIN
  IF NOT EXISTS (SELECT 1 FROM public.listings WHERE id = v_source_id) THEN
    RAISE EXCEPTION 'QA seed: source listing % is missing. Apply supabase/seed/demo_motodo_marketplace.sql first.', v_source_id;
  END IF;

  SELECT seller_id INTO v_seller_id FROM public.listings WHERE id = v_source_id;

  IF NOT EXISTS (
    SELECT 1
    FROM public.seller_profiles
    WHERE id = v_seller_id AND seller_status = 'approved'
  ) THEN
    RAISE EXCEPTION 'QA seed: approved seller % for the source listing is missing.', v_seller_id;
  END IF;

  SELECT COUNT(*)::int INTO v_extra
  FROM public.listings l
  WHERE l.name LIKE '%(Testing Buy)%'
    AND l.id IS DISTINCT FROM v_qa_id
    AND EXISTS (SELECT 1 FROM public.orders o WHERE o.listing_id = l.id);

  IF v_extra > 0 THEN
    RAISE EXCEPTION 'QA seed: extra "(Testing Buy)" listings already have orders. Resolve those rows before re-running.';
  END IF;

  DELETE FROM public.listing_images
  WHERE listing_id IN (
    SELECT id
    FROM public.listings
    WHERE name LIKE '%(Testing Buy)%'
      AND id IS DISTINCT FROM v_qa_id
  );

  DELETE FROM public.listings
  WHERE name LIKE '%(Testing Buy)%'
    AND id IS DISTINCT FROM v_qa_id;
END $$;

-- SQL Editor sessions have auth.uid() = null. Disable only this trigger so we can
-- keep seller_id on the existing Demo Garage seller (not auth.uid()).
ALTER TABLE public.listings DISABLE TRIGGER protect_listing_columns;

INSERT INTO public.listings (
  id, seller_id, name, brand, model, category, price, condition, year, mileage,
  engine, transmission, fuel, color, city, location, showroom_address, description,
  quantity, status, is_demo
)
SELECT
  'b0000000-0000-4000-8000-000000000101'::uuid,
  seller_id,
  CASE
    WHEN name LIKE '%(Testing Buy)%' THEN name
    ELSE name || ' (Testing Buy)'
  END,
  brand,
  model,
  category,
  price,
  condition,
  year,
  mileage,
  engine,
  transmission,
  fuel,
  color,
  city,
  location,
  showroom_address,
  description,
  1,
  'active',
  false
FROM public.listings
WHERE id = 'b0000000-0000-4000-8000-000000000001'::uuid
ON CONFLICT (id) DO UPDATE
SET
  seller_id = EXCLUDED.seller_id,
  name = EXCLUDED.name,
  brand = EXCLUDED.brand,
  model = EXCLUDED.model,
  category = EXCLUDED.category,
  price = EXCLUDED.price,
  condition = EXCLUDED.condition,
  year = EXCLUDED.year,
  mileage = EXCLUDED.mileage,
  engine = EXCLUDED.engine,
  transmission = EXCLUDED.transmission,
  fuel = EXCLUDED.fuel,
  color = EXCLUDED.color,
  city = EXCLUDED.city,
  location = EXCLUDED.location,
  showroom_address = EXCLUDED.showroom_address,
  description = EXCLUDED.description,
  quantity = 1,
  status = 'active',
  is_demo = false;

ALTER TABLE public.listings ENABLE TRIGGER protect_listing_columns;

DELETE FROM public.listing_images
WHERE listing_id = 'b0000000-0000-4000-8000-000000000101'::uuid;

INSERT INTO public.listing_images (listing_id, storage_path, public_url, sort_order)
SELECT
  'b0000000-0000-4000-8000-000000000101'::uuid,
  'listings/b0000000-0000-4000-8000-000000000101/' || regexp_replace(storage_path, '^.*/', ''),
  public_url,
  sort_order
FROM public.listing_images
WHERE listing_id = 'b0000000-0000-4000-8000-000000000001'::uuid
ORDER BY sort_order, created_at;

DO $$
DECLARE
  v_qa public.listings%ROWTYPE;
  v_images int;
  v_demo int;
  v_buy_count int;
BEGIN
  SELECT * INTO v_qa
  FROM public.listings
  WHERE id = 'b0000000-0000-4000-8000-000000000101'::uuid;

  IF v_qa.id IS NULL THEN
    RAISE EXCEPTION 'QA seed: listing was not created.';
  END IF;
  IF v_qa.name NOT LIKE '%(Testing Buy)%' THEN
    RAISE EXCEPTION 'QA seed: name must contain (Testing Buy). Got %', v_qa.name;
  END IF;
  IF v_qa.is_demo IS DISTINCT FROM false THEN
    RAISE EXCEPTION 'QA seed: is_demo must be false.';
  END IF;
  IF v_qa.status IS DISTINCT FROM 'active' THEN
    RAISE EXCEPTION 'QA seed: status must be active.';
  END IF;
  IF v_qa.quantity IS DISTINCT FROM 1 THEN
    RAISE EXCEPTION 'QA seed: quantity must be 1.';
  END IF;

  SELECT COUNT(*)::int INTO v_images
  FROM public.listing_images
  WHERE listing_id = v_qa.id AND public_url IS NOT NULL AND length(trim(public_url)) > 0;

  IF v_images < 1 THEN
    RAISE EXCEPTION 'QA seed: at least one listing image with a public_url is required.';
  END IF;

  SELECT COUNT(*)::int INTO v_buy_count
  FROM public.listings
  WHERE name LIKE '%(Testing Buy)%';

  IF v_buy_count <> 1 THEN
    RAISE EXCEPTION 'QA seed: expected exactly 1 "(Testing Buy)" listing, found %.', v_buy_count;
  END IF;

  SELECT COUNT(*)::int INTO v_demo FROM public.listings WHERE is_demo;
  RAISE NOTICE 'QA listing % ready (is_demo=false, status=%, qty=%, images=%). Demo listings unchanged: % (expect 18 after demo seed).',
    v_qa.id, v_qa.status, v_qa.quantity, v_images, v_demo;
END $$;

COMMIT;

-- Optional checks (run after apply):
-- SELECT id, name, seller_id, is_demo, status, quantity
-- FROM public.listings
-- WHERE name LIKE '%(Testing Buy)%';
-- SELECT COUNT(*) FROM public.listings WHERE is_demo; -- expect 18
-- SELECT COUNT(*) FROM public.listing_images WHERE listing_id = 'b0000000-0000-4000-8000-000000000101';
