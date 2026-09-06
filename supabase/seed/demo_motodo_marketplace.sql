-- =============================================================================
-- Motodo.id DEMO marketplace seed
-- DEMO DATA ONLY — not production inventory, not real sellers.
--
-- Run in the Supabase SQL Editor as the project owner (postgres), AFTER:
--   supabase/migrations/20260906120000_add_is_demo.sql
--
-- This script:
--   - does not disable RLS
--   - does not change policies
--   - does not touch rows where is_demo = false
--   - is idempotent (safe to run more than once)
--   - does not create orders, reviews, chat, or notifications on first insert
--
-- Auth users are required because profiles.id → auth.users(id).
-- Demo users are given random unusable passwords and are not meant for login.
--
-- Temporarily disables column-protection triggers in this transaction only so
-- approved demo sellers and active listings can be inserted with the same
-- valid states a real approved seller would have. Triggers are re-enabled
-- before COMMIT. ROLLBACK restores them if the script fails.
-- =============================================================================

BEGIN;

ALTER TABLE public.seller_profiles DISABLE TRIGGER protect_seller_profile_columns;
ALTER TABLE public.listings DISABLE TRIGGER protect_listing_columns;
ALTER TABLE public.seller_profiles DISABLE TRIGGER notify_on_seller_profile_change;

-- ---------------------------------------------------------------------------
-- 1) Demo Auth users (deterministic UUIDs)
-- ---------------------------------------------------------------------------
INSERT INTO auth.users (
  instance_id,
  id,
  aud,
  role,
  email,
  encrypted_password,
  email_confirmed_at,
  raw_app_meta_data,
  raw_user_meta_data,
  created_at,
  updated_at,
  confirmation_token,
  email_change,
  email_change_token_new,
  recovery_token
)
VALUES
  (
    '00000000-0000-0000-0000-000000000000',
    'a0000000-0000-4000-8000-000000000001',
    'authenticated',
    'authenticated',
    'demo.garage@demo.motodo.id',
    crypt(encode(gen_random_bytes(16), 'hex'), gen_salt('bf')),
    now(),
    '{"provider":"email","providers":["email"]}'::jsonb,
    '{"full_name":"Motodo Demo Garage","account_type":"seller"}'::jsonb,
    now(), now(), '', '', '', ''
  ),
  (
    '00000000-0000-0000-0000-000000000000',
    'a0000000-0000-4000-8000-000000000002',
    'authenticated',
    'authenticated',
    'demo.jakarta.custom@demo.motodo.id',
    crypt(encode(gen_random_bytes(16), 'hex'), gen_salt('bf')),
    now(),
    '{"provider":"email","providers":["email"]}'::jsonb,
    '{"full_name":"Jakarta Custom Works","account_type":"seller"}'::jsonb,
    now(), now(), '', '', '', ''
  ),
  (
    '00000000-0000-0000-0000-000000000000',
    'a0000000-0000-4000-8000-000000000003',
    'authenticated',
    'authenticated',
    'demo.nusantara@demo.motodo.id',
    crypt(encode(gen_random_bytes(16), 'hex'), gen_salt('bf')),
    now(),
    '{"provider":"email","providers":["email"]}'::jsonb,
    '{"full_name":"Nusantara Premium Motor","account_type":"seller"}'::jsonb,
    now(), now(), '', '', '', ''
  ),
  (
    '00000000-0000-0000-0000-000000000000',
    'a0000000-0000-4000-8000-000000000004',
    'authenticated',
    'authenticated',
    'demo.heritage@demo.motodo.id',
    crypt(encode(gen_random_bytes(16), 'hex'), gen_salt('bf')),
    now(),
    '{"provider":"email","providers":["email"]}'::jsonb,
    '{"full_name":"Heritage Motorcycle House","account_type":"seller"}'::jsonb,
    now(), now(), '', '', '', ''
  ),
  (
    '00000000-0000-0000-0000-000000000000',
    'a0000000-0000-4000-8000-000000000005',
    'authenticated',
    'authenticated',
    'demo.urban.rider@demo.motodo.id',
    crypt(encode(gen_random_bytes(16), 'hex'), gen_salt('bf')),
    now(),
    '{"provider":"email","providers":["email"]}'::jsonb,
    '{"full_name":"Urban Rider Garage","account_type":"seller"}'::jsonb,
    now(), now(), '', '', '', ''
  )
ON CONFLICT (id) DO NOTHING;

INSERT INTO auth.identities (
  id,
  user_id,
  identity_data,
  provider,
  provider_id,
  last_sign_in_at,
  created_at,
  updated_at
)
VALUES
  (
    'a0000000-0000-4000-8000-000000000001',
    'a0000000-0000-4000-8000-000000000001',
    jsonb_build_object('sub', 'a0000000-0000-4000-8000-000000000001', 'email', 'demo.garage@demo.motodo.id'),
    'email',
    'a0000000-0000-4000-8000-000000000001',
    now(), now(), now()
  ),
  (
    'a0000000-0000-4000-8000-000000000002',
    'a0000000-0000-4000-8000-000000000002',
    jsonb_build_object('sub', 'a0000000-0000-4000-8000-000000000002', 'email', 'demo.jakarta.custom@demo.motodo.id'),
    'email',
    'a0000000-0000-4000-8000-000000000002',
    now(), now(), now()
  ),
  (
    'a0000000-0000-4000-8000-000000000003',
    'a0000000-0000-4000-8000-000000000003',
    jsonb_build_object('sub', 'a0000000-0000-4000-8000-000000000003', 'email', 'demo.nusantara@demo.motodo.id'),
    'email',
    'a0000000-0000-4000-8000-000000000003',
    now(), now(), now()
  ),
  (
    'a0000000-0000-4000-8000-000000000004',
    'a0000000-0000-4000-8000-000000000004',
    jsonb_build_object('sub', 'a0000000-0000-4000-8000-000000000004', 'email', 'demo.heritage@demo.motodo.id'),
    'email',
    'a0000000-0000-4000-8000-000000000004',
    now(), now(), now()
  ),
  (
    'a0000000-0000-4000-8000-000000000005',
    'a0000000-0000-4000-8000-000000000005',
    jsonb_build_object('sub', 'a0000000-0000-4000-8000-000000000005', 'email', 'demo.urban.rider@demo.motodo.id'),
    'email',
    'a0000000-0000-4000-8000-000000000005',
    now(), now(), now()
  )
ON CONFLICT (provider_id, provider) DO NOTHING;

-- Profile rows are created by handle_new_user(). Mark demo + seller intent.
UPDATE public.profiles
SET
  is_demo = true,
  account_type = 'seller',
  full_name = CASE id
    WHEN 'a0000000-0000-4000-8000-000000000001' THEN 'Motodo Demo Garage'
    WHEN 'a0000000-0000-4000-8000-000000000002' THEN 'Jakarta Custom Works'
    WHEN 'a0000000-0000-4000-8000-000000000003' THEN 'Nusantara Premium Motor'
    WHEN 'a0000000-0000-4000-8000-000000000004' THEN 'Heritage Motorcycle House'
    WHEN 'a0000000-0000-4000-8000-000000000005' THEN 'Urban Rider Garage'
    ELSE full_name
  END
WHERE id IN (
  'a0000000-0000-4000-8000-000000000001',
  'a0000000-0000-4000-8000-000000000002',
  'a0000000-0000-4000-8000-000000000003',
  'a0000000-0000-4000-8000-000000000004',
  'a0000000-0000-4000-8000-000000000005'
);

-- ---------------------------------------------------------------------------
-- 2) Demo seller profiles (approved — same valid state as a real approved seller)
-- ---------------------------------------------------------------------------
INSERT INTO public.seller_profiles (
  id, business_name, business_type, showroom_name, showroom_address, city, province,
  description, seller_status, rejection_reason, is_demo
)
VALUES
  (
    'a0000000-0000-4000-8000-000000000001',
    'Motodo Demo Garage',
    'Custom Garage',
    'Motodo Demo Garage',
    'Jl. Kemang Raya No. 12',
    'Jakarta',
    'DKI Jakarta',
    'Showroom demo Motodo untuk motor custom dan klasik. Data ini hanya untuk pengujian UI.',
    'approved',
    NULL,
    true
  ),
  (
    'a0000000-0000-4000-8000-000000000002',
    'Jakarta Custom Works',
    'Motorcycle Workshop',
    'Jakarta Custom Works',
    'Jl. Radio Dalam Raya No. 8',
    'Jakarta',
    'DKI Jakarta',
    'Bengkel custom Jakarta dengan fokus chopper, bobber, dan cafe racer.',
    'approved',
    NULL,
    true
  ),
  (
    'a0000000-0000-4000-8000-000000000003',
    'Nusantara Premium Motor',
    'Motorcycle Dealer',
    'Nusantara Premium Motor',
    'Jl. HR Muhammad No. 45',
    'Surabaya',
    'Jawa Timur',
    'Dealer motor premium Eropa dan Jepang untuk pembeli di Jawa Timur.',
    'approved',
    NULL,
    true
  ),
  (
    'a0000000-0000-4000-8000-000000000004',
    'Heritage Motorcycle House',
    'Motorcycle Dealership',
    'Heritage Motorcycle House',
    'Jl. Dago No. 21',
    'Bandung',
    'Jawa Barat',
    'Koleksi motor klasik dan heritage, siap pakai untuk harian maupun touring.',
    'approved',
    NULL,
    true
  ),
  (
    'a0000000-0000-4000-8000-000000000005',
    'Urban Rider Garage',
    'Custom Garage',
    'Urban Rider Garage',
    'Jl. Sunset Road No. 88',
    'Bali',
    'Bali',
    'Garage Bali untuk motor scrambler, cafe, dan street tracker.',
    'approved',
    NULL,
    true
  )
ON CONFLICT (id) DO UPDATE SET
  business_name = EXCLUDED.business_name,
  business_type = EXCLUDED.business_type,
  showroom_name = EXCLUDED.showroom_name,
  showroom_address = EXCLUDED.showroom_address,
  city = EXCLUDED.city,
  province = EXCLUDED.province,
  description = EXCLUDED.description,
  seller_status = EXCLUDED.seller_status,
  rejection_reason = NULL,
  is_demo = true
WHERE public.seller_profiles.is_demo = true;

-- ---------------------------------------------------------------------------
-- 3) Demo listings (status = active, quantity = 1)
-- Categories match frontend MOTORCYCLE_CATEGORIES.
-- ---------------------------------------------------------------------------
INSERT INTO public.listings (
  id, seller_id, name, brand, model, category, price, condition, year, mileage,
  engine, transmission, fuel, color, city, location, showroom_address, description,
  quantity, status, is_demo
)
VALUES
  (
    'b0000000-0000-4000-8000-000000000001',
    'a0000000-0000-4000-8000-000000000001',
    'Harley-Davidson Sportster 883 Custom',
    'Harley-Davidson',
    'Sportster 883',
    'Harley-Davidson',
    185000000,
    'Very Good',
    2021,
    8500,
    '883 cc',
    'Manual',
    'Petrol',
    'Black',
    'Jakarta',
    'Jakarta Selatan',
    'Jl. Kemang Raya No. 12',
    'Custom Sportster dengan konsep classic modern, kondisi terawat, siap digunakan untuk harian maupun touring.',
    1,
    'active',
    true
  ),
  (
    'b0000000-0000-4000-8000-000000000002',
    'a0000000-0000-4000-8000-000000000004',
    'Triumph Bonneville T120',
    'Triumph',
    'Bonneville T120',
    'Triumph',
    210000000,
    'Excellent',
    2022,
    4200,
    '1200 cc',
    'Manual',
    'Petrol',
    'Green',
    'Bandung',
    'Bandung',
    'Jl. Dago No. 21',
    'Bonneville T120 heritage, mesin halus, cat original, buku servis lengkap.',
    1,
    'active',
    true
  ),
  (
    'b0000000-0000-4000-8000-000000000003',
    'a0000000-0000-4000-8000-000000000004',
    'Royal Enfield Classic 350',
    'Royal Enfield',
    'Classic 350',
    'Others',
    62000000,
    'Good',
    2020,
    14200,
    '349 cc',
    'Manual',
    'Petrol',
    'Maroon',
    'Bandung',
    'Bandung',
    'Jl. Dago No. 21',
    'Classic 350 gaya post-war, cocok untuk harian kota dengan karakter mesin klasik.',
    1,
    'active',
    true
  ),
  (
    'b0000000-0000-4000-8000-000000000004',
    'a0000000-0000-4000-8000-000000000002',
    'Kawasaki W175 Custom',
    'Kawasaki',
    'W175',
    'Chopper',
    48000000,
    'Very Good',
    2019,
    9800,
    '177 cc',
    'Manual',
    'Petrol',
    'Brown',
    'Jakarta',
    'Jakarta',
    'Jl. Radio Dalam Raya No. 8',
    'W175 custom chopper ringan, setang dan knalpot aftermarket, siap pameran atau harian.',
    1,
    'active',
    true
  ),
  (
    'b0000000-0000-4000-8000-000000000005',
    'a0000000-0000-4000-8000-000000000002',
    'Honda Rebel 500',
    'Honda',
    'Rebel 500',
    'Bobber',
    118000000,
    'Excellent',
    2023,
    3100,
    '471 cc',
    'Manual',
    'Petrol',
    'Matte Black',
    'Jakarta',
    'Jakarta',
    'Jl. Radio Dalam Raya No. 8',
    'Rebel 500 bobber style, posisi duduk rendah, irit, mudah dikendarai pemula sampai touring singkat.',
    1,
    'active',
    true
  ),
  (
    'b0000000-0000-4000-8000-000000000006',
    'a0000000-0000-4000-8000-000000000005',
    'Yamaha XSR 155',
    'Yamaha',
    'XSR 155',
    'Brat Cafe',
    39000000,
    'Very Good',
    2022,
    7600,
    '155 cc',
    'Manual',
    'Petrol',
    'Blue',
    'Bali',
    'Bali',
    'Jl. Sunset Road No. 88',
    'XSR 155 cafe/brat, handling lincah untuk dalam kota dan pantai, perawatan rutin Yamaha.',
    1,
    'active',
    true
  ),
  (
    'b0000000-0000-4000-8000-000000000007',
    'a0000000-0000-4000-8000-000000000003',
    'Ducati Scrambler Icon',
    'Ducati',
    'Scrambler Icon',
    'Others',
    245000000,
    'Excellent',
    2021,
    5400,
    '803 cc',
    'Manual',
    'Petrol',
    'Yellow',
    'Surabaya',
    'Surabaya',
    'Jl. HR Muhammad No. 45',
    'Scrambler Icon, karakter Ducati yang ramah, kondisi showroom, ban masih tebal.',
    1,
    'active',
    true
  ),
  (
    'b0000000-0000-4000-8000-000000000008',
    'a0000000-0000-4000-8000-000000000003',
    'BMW R nineT',
    'BMW',
    'R nineT',
    'Others',
    420000000,
    'Excellent',
    2020,
    8900,
    '1170 cc',
    'Manual',
    'Petrol',
    'Silver',
    'Surabaya',
    'Surabaya',
    'Jl. HR Muhammad No. 45',
    'R nineT boxer classic, finishing premium, siap touring jarak jauh.',
    1,
    'active',
    true
  ),
  (
    'b0000000-0000-4000-8000-000000000009',
    'a0000000-0000-4000-8000-000000000001',
    'Harley-Davidson Iron 883',
    'Harley-Davidson',
    'Iron 883',
    'Harley-Davidson',
    175000000,
    'Very Good',
    2019,
    12100,
    '883 cc',
    'Manual',
    'Petrol',
    'Denim Black',
    'Jakarta',
    'Jakarta Selatan',
    'Jl. Kemang Raya No. 12',
    'Iron 883 dark custom, knalpot aftermarket, kondisi mesin kering dan rapi.',
    1,
    'active',
    true
  ),
  (
    'b0000000-0000-4000-8000-000000000010',
    'a0000000-0000-4000-8000-000000000004',
    'Triumph Street Twin',
    'Triumph',
    'Street Twin',
    'Triumph',
    165000000,
    'Very Good',
    2021,
    6700,
    '900 cc',
    'Manual',
    'Petrol',
    'Red',
    'Bandung',
    'Bandung',
    'Jl. Dago No. 21',
    'Street Twin modern classic, torsi rendah yang nyaman untuk dalam kota Bandung.',
    1,
    'active',
    true
  ),
  (
    'b0000000-0000-4000-8000-000000000011',
    'a0000000-0000-4000-8000-000000000005',
    'Royal Enfield Interceptor 650',
    'Royal Enfield',
    'Interceptor 650',
    'Others',
    98000000,
    'Excellent',
    2023,
    2800,
    '648 cc',
    'Manual',
    'Petrol',
    'Orange',
    'Bali',
    'Bali',
    'Jl. Sunset Road No. 88',
    'Interceptor 650 twin, cocok touring Bali, suara knalpot stock yang berkarakter.',
    1,
    'active',
    true
  ),
  (
    'b0000000-0000-4000-8000-000000000012',
    'a0000000-0000-4000-8000-000000000003',
    'Kawasaki Z900RS',
    'Kawasaki',
    'Z900RS',
    'Others',
    268000000,
    'Excellent',
    2022,
    4100,
    '948 cc',
    'Manual',
    'Petrol',
    'Yellow',
    'Surabaya',
    'Surabaya',
    'Jl. HR Muhammad No. 45',
    'Z900RS retro-naked, performa harian yang kuat dengan gaya Z1 classic.',
    1,
    'active',
    true
  ),
  (
    'b0000000-0000-4000-8000-000000000013',
    'a0000000-0000-4000-8000-000000000003',
    'Honda CB650R',
    'Honda',
    'CB650R',
    'Others',
    198000000,
    'Very Good',
    2021,
    9200,
    '649 cc',
    'Manual',
    'Petrol',
    'Grey',
    'Surabaya',
    'Surabaya',
    'Jl. HR Muhammad No. 45',
    'CB650R neo sports cafe, four-cylinder halus, servis Honda resmi.',
    1,
    'active',
    true
  ),
  (
    'b0000000-0000-4000-8000-000000000014',
    'a0000000-0000-4000-8000-000000000002',
    'Yamaha MT-09',
    'Yamaha',
    'MT-09',
    'Others',
    225000000,
    'Very Good',
    2022,
    5800,
    '890 cc',
    'Manual',
    'Petrol',
    'Blue',
    'Jakarta',
    'Jakarta',
    'Jl. Radio Dalam Raya No. 8',
    'MT-09 hyper naked, torsi tiga silinder, kondisi terawat untuk harian agresif.',
    1,
    'active',
    true
  ),
  (
    'b0000000-0000-4000-8000-000000000015',
    'a0000000-0000-4000-8000-000000000003',
    'BMW R 18',
    'BMW',
    'R 18',
    'Others',
    495000000,
    'Excellent',
    2022,
    3600,
    '1802 cc',
    'Manual',
    'Petrol',
    'Black',
    'Surabaya',
    'Surabaya',
    'Jl. HR Muhammad No. 45',
    'R 18 cruiser boxer big-twin, presentasi premium, kilometer rendah.',
    1,
    'active',
    true
  ),
  (
    'b0000000-0000-4000-8000-000000000016',
    'a0000000-0000-4000-8000-000000000001',
    'Harley-Davidson Forty-Eight',
    'Harley-Davidson',
    'Forty-Eight',
    'Harley-Davidson',
    205000000,
    'Very Good',
    2020,
    10200,
    '1202 cc',
    'Manual',
    'Petrol',
    'Orange',
    'Jakarta',
    'Jakarta Selatan',
    'Jl. Kemang Raya No. 12',
    'Forty-Eight fat tank, pelek 16 inci, gaya street yang ikonik.',
    1,
    'active',
    true
  ),
  (
    'b0000000-0000-4000-8000-000000000017',
    'a0000000-0000-4000-8000-000000000002',
    'Triumph Bonneville Bobber',
    'Triumph',
    'Bonneville Bobber',
    'Bobber',
    235000000,
    'Excellent',
    2021,
    4700,
    '1200 cc',
    'Manual',
    'Petrol',
    'Black',
    'Jakarta',
    'Jakarta',
    'Jl. Radio Dalam Raya No. 8',
    'Bonneville Bobber, single seat, posisi riding rendah, tampilan pabrik yang bersih.',
    1,
    'active',
    true
  ),
  (
    'b0000000-0000-4000-8000-000000000018',
    'a0000000-0000-4000-8000-000000000005',
    'Royal Enfield Continental GT 650',
    'Royal Enfield',
    'Continental GT 650',
    'Brat Cafe',
    105000000,
    'Very Good',
    2022,
    6100,
    '648 cc',
    'Manual',
    'Petrol',
    'Red',
    'Bali',
    'Bali',
    'Jl. Sunset Road No. 88',
    'Continental GT 650 cafe racer, clip-on, cocok untuk jalan pesisir Bali.',
    1,
    'active',
    true
  )
ON CONFLICT (id) DO UPDATE SET
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
  quantity = EXCLUDED.quantity,
  status = EXCLUDED.status,
  is_demo = true
WHERE public.listings.is_demo = true;

-- ---------------------------------------------------------------------------
-- 4) listing_images — public_url points at existing Motodo static assets.
-- storage_path follows protect_listing_image_path: listings/{listing_id}/{file}
-- Inventory is listings.quantity (listing_stock is a view).
-- ---------------------------------------------------------------------------
DELETE FROM public.listing_images
WHERE listing_id IN (SELECT id FROM public.listings WHERE is_demo = true);

INSERT INTO public.listing_images (listing_id, storage_path, public_url, sort_order)
SELECT listing_id, 'listings/' || listing_id::text || '/' || filename, public_url, sort_order
FROM (
  VALUES
    ('b0000000-0000-4000-8000-000000000001'::uuid, '01.jpg', 'https://motodo.id/listings/sportster.jpg', 0),
    ('b0000000-0000-4000-8000-000000000001'::uuid, '02.jpg', 'https://motodo.id/listings/hero.jpg', 1),
    ('b0000000-0000-4000-8000-000000000002'::uuid, '01.jpg', 'https://motodo.id/listings/triumph.jpg', 0),
    ('b0000000-0000-4000-8000-000000000002'::uuid, '02.jpg', 'https://motodo.id/listings/brat.jpg', 1),
    ('b0000000-0000-4000-8000-000000000003'::uuid, '01.jpg', 'https://motodo.id/listings/bobber.jpg', 0),
    ('b0000000-0000-4000-8000-000000000003'::uuid, '02.jpg', 'https://motodo.id/listings/chopper.jpg', 1),
    ('b0000000-0000-4000-8000-000000000004'::uuid, '01.jpg', 'https://motodo.id/listings/chopper.jpg', 0),
    ('b0000000-0000-4000-8000-000000000004'::uuid, '02.jpg', 'https://motodo.id/listings/bobber.jpg', 1),
    ('b0000000-0000-4000-8000-000000000005'::uuid, '01.jpg', 'https://motodo.id/listings/bobber.jpg', 0),
    ('b0000000-0000-4000-8000-000000000005'::uuid, '02.jpg', 'https://motodo.id/listings/sportster.jpg', 1),
    ('b0000000-0000-4000-8000-000000000006'::uuid, '01.jpg', 'https://motodo.id/listings/brat.jpg', 0),
    ('b0000000-0000-4000-8000-000000000006'::uuid, '02.jpg', 'https://motodo.id/listings/triumph.jpg', 1),
    ('b0000000-0000-4000-8000-000000000007'::uuid, '01.jpg', 'https://motodo.id/listings/hero.jpg', 0),
    ('b0000000-0000-4000-8000-000000000007'::uuid, '02.jpg', 'https://motodo.id/listings/sportster.jpg', 1),
    ('b0000000-0000-4000-8000-000000000008'::uuid, '01.jpg', 'https://motodo.id/listings/triumph.jpg', 0),
    ('b0000000-0000-4000-8000-000000000008'::uuid, '02.jpg', 'https://motodo.id/listings/hero.jpg', 1),
    ('b0000000-0000-4000-8000-000000000009'::uuid, '01.jpg', 'https://motodo.id/listings/sportster.jpg', 0),
    ('b0000000-0000-4000-8000-000000000009'::uuid, '02.jpg', 'https://motodo.id/listings/bobber.jpg', 1),
    ('b0000000-0000-4000-8000-000000000010'::uuid, '01.jpg', 'https://motodo.id/listings/triumph.jpg', 0),
    ('b0000000-0000-4000-8000-000000000010'::uuid, '02.jpg', 'https://motodo.id/listings/brat.jpg', 1),
    ('b0000000-0000-4000-8000-000000000011'::uuid, '01.jpg', 'https://motodo.id/listings/chopper.jpg', 0),
    ('b0000000-0000-4000-8000-000000000011'::uuid, '02.jpg', 'https://motodo.id/listings/brat.jpg', 1),
    ('b0000000-0000-4000-8000-000000000012'::uuid, '01.jpg', 'https://motodo.id/listings/hero.jpg', 0),
    ('b0000000-0000-4000-8000-000000000012'::uuid, '02.jpg', 'https://motodo.id/listings/chopper.jpg', 1),
    ('b0000000-0000-4000-8000-000000000013'::uuid, '01.jpg', 'https://motodo.id/listings/brat.jpg', 0),
    ('b0000000-0000-4000-8000-000000000013'::uuid, '02.jpg', 'https://motodo.id/listings/hero.jpg', 1),
    ('b0000000-0000-4000-8000-000000000014'::uuid, '01.jpg', 'https://motodo.id/listings/chopper.jpg', 0),
    ('b0000000-0000-4000-8000-000000000014'::uuid, '02.jpg', 'https://motodo.id/listings/sportster.jpg', 1),
    ('b0000000-0000-4000-8000-000000000015'::uuid, '01.jpg', 'https://motodo.id/listings/bobber.jpg', 0),
    ('b0000000-0000-4000-8000-000000000015'::uuid, '02.jpg', 'https://motodo.id/listings/triumph.jpg', 1),
    ('b0000000-0000-4000-8000-000000000016'::uuid, '01.jpg', 'https://motodo.id/listings/sportster.jpg', 0),
    ('b0000000-0000-4000-8000-000000000016'::uuid, '02.jpg', 'https://motodo.id/listings/hero.jpg', 1),
    ('b0000000-0000-4000-8000-000000000017'::uuid, '01.jpg', 'https://motodo.id/listings/bobber.jpg', 0),
    ('b0000000-0000-4000-8000-000000000017'::uuid, '02.jpg', 'https://motodo.id/listings/chopper.jpg', 1),
    ('b0000000-0000-4000-8000-000000000018'::uuid, '01.jpg', 'https://motodo.id/listings/brat.jpg', 0),
    ('b0000000-0000-4000-8000-000000000018'::uuid, '02.jpg', 'https://motodo.id/listings/triumph.jpg', 1)
) AS img(listing_id, filename, public_url, sort_order);

ALTER TABLE public.seller_profiles ENABLE TRIGGER notify_on_seller_profile_change;
ALTER TABLE public.listings ENABLE TRIGGER protect_listing_columns;
ALTER TABLE public.seller_profiles ENABLE TRIGGER protect_seller_profile_columns;

COMMIT;

-- =============================================================================
-- Safe deletion (DEMO ONLY). Run separately when you want to remove demo data.
-- Does not delete orders/reviews/chat (none were seeded).
--
-- BEGIN;
-- DELETE FROM public.listing_images
-- WHERE listing_id IN (SELECT id FROM public.listings WHERE is_demo = true);
-- DELETE FROM public.listings WHERE is_demo = true;
-- DELETE FROM public.seller_profiles WHERE is_demo = true;
-- DELETE FROM public.profiles WHERE is_demo = true;
-- DELETE FROM auth.identities WHERE user_id IN (
--   'a0000000-0000-4000-8000-000000000001',
--   'a0000000-0000-4000-8000-000000000002',
--   'a0000000-0000-4000-8000-000000000003',
--   'a0000000-0000-4000-8000-000000000004',
--   'a0000000-0000-4000-8000-000000000005'
-- );
-- DELETE FROM auth.users WHERE id IN (
--   'a0000000-0000-4000-8000-000000000001',
--   'a0000000-0000-4000-8000-000000000002',
--   'a0000000-0000-4000-8000-000000000003',
--   'a0000000-0000-4000-8000-000000000004',
--   'a0000000-0000-4000-8000-000000000005'
-- );
-- COMMIT;
-- =============================================================================
