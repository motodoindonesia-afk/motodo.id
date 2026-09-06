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
--   - seeds DEMO buyers, completed DEMO orders, and DEMO reviews so listing
--     rating summaries can be calculated from real review rows
--   - does not create chat or notifications
--   - completed DEMO orders are inserted directly (status = completed) so
--     listing.quantity is not reduced by complete_order()
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
ALTER TABLE public.orders DISABLE TRIGGER notify_on_order_change;

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
    'Bengkel dan showroom demo Motodo di Kemang untuk motor custom, klasik, dan Harley. Unit bisa dilihat langsung di showroom; data ini hanya untuk pengujian UI, bukan stok dealer resmi.',
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
    'Workshop custom Jakarta dengan fokus Harley, bobber, chopper, dan street tracker. Tim bengkel terbiasa setang, knalpot, dan finishing body. Data demo untuk pengujian marketplace.',
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
    'Showroom motor premium di Surabaya: Ducati, BMW, Kawasaki, dan Honda modern classic. Fokus unit terawat dengan dokumen lengkap. Data demo, bukan klaim dealer resmi pabrikan.',
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
    'Koleksi motor klasik dan heritage di Dago, Bandung. Cocok untuk kolektor maupun pengendara harian yang mencari karakter mesin klasik. Data demo untuk pengujian UI Motodo.',
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
    'Garage di Sunset Road, Bali, untuk motor cafe, scrambler, dan daily rider. Unit dicek untuk kondisi jalan pesisir dan touring singkat. Data demo marketplace Motodo.',
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
    'Harley-Davidson Sportster 883 Custom tahun 2021, odometer 8.500 km, mesin 883 cc. Konsep classic modern dengan exhaust aftermarket, jok solo, dan finishing body hitam yang rapi. Mesin hidup halus, kelistrikan normal, rem cakram masih gigit. Ban masih tebal; STNK dan BPKB lengkap menurut catatan demo seller. Cocok untuk harian Jakarta maupun touring singkat. Inspeksi di showroom Kemang disarankan sebelum transaksi.',
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
    'Triumph Bonneville T120 tahun 2022, 4.200 km, mesin 1.200 cc twin. Cat hijau masih utuh, handlebar dan footpeg standar pabrik dengan sedikit upgrade knalpot. Mesin halus di putaran rendah, kopling ringan, perawatan sesuai buku servis. Ban dan kampas rem masih nyaman untuk touring Bandung–Lembang. Dokumen lengkap berdasarkan informasi demo seller. Cocok untuk pengendara yang mencari heritage modern, bukan motor balap.',
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
    'Royal Enfield Classic 350 tahun 2020, 14.200 km, mesin 349 cc. Gaya post-war dengan setang tinggi dan knalpot karakter klasik. Mesin sudah biasa untuk harian kota; getaran terasa di putaran menengah seperti khas Enfield. Kelistrikan dan starter berfungsi. Ban masih layak, rem tromol belakang perlu dicek saat inspeksi. STNK/BPKB ada menurut catatan demo seller. Cocok untuk pengendara yang menyukai ritme santai, bukan touring cepat.',
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
    'Kawasaki W175 Custom tahun 2019, 9.800 km, mesin 177 cc. Build chopper ringan: setang, knalpot, dan jok setelahmarket, rangka tetap W175. Mesin irit untuk dalam kota, kopling ringan, cocok pemula yang ingin tampilan custom. Kelistrikan simple dan mudah dirawat. Ban dan rantai sudah pernah diganti menurut demo seller. Surat-surat lengkap. Inspeksi di Radio Dalam sebelum deal.',
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
    'Honda Rebel 500 tahun 2023, 3.100 km, mesin 471 cc parallel twin. Konsep bobber pabrik: posisi duduk rendah, tanki ramping, warna matte black. Mesin halus, irit, dan mudah dikendarai dari lampu merah sampai tol dalam kota. ABS dan kelistrikan standar Honda. Ban masih tebal. Pajak dan dokumen menurut catatan demo seller masih rapi. Cocok daily rider atau yang baru pindah dari motor kecil. Bisa dilihat di workshop Jakarta Custom Works.',
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
    'Yamaha XSR 155 tahun 2022, 7.600 km, mesin 155 cc VVA. Setup cafe/brat untuk dalam kota dan pantai Bali: stang, jok, dan spakbor sudah disesuaikan. Handling lincah, kopling ringan, perawatan berkala Yamaha. Lampu LED dan kelistrikan normal. Ban masih cukup untuk musim kemarau. Alasan jual: demo seller ganti ke twin 650. Inspeksi di Sunset Road disarankan.',
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
    'Ducati Scrambler Icon tahun 2021, 5.400 km, mesin 803 cc L-twin. Karakter Ducati yang relatif ramah untuk harian, knalpot stock, condong ke gaya scrambler pabrik. Mesin kering, idle stabil, kampas rem masih nyaman. Ban masih tebal. Servis berkala tercatat di buku menurut demo seller. Bukan klaim dealer resmi Ducati — unit marketplace. Cocok touring Jawa Timur. Lihat langsung di showroom Surabaya.',
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
    'BMW R nineT tahun 2020, 8.900 km, mesin boxer 1.170 cc. Finishing aluminium dan cat silver masih rapi, konsep classic roadster pabrik. Mesin boxer terasa kokoh di touring, handling netral. Kelistrikan dan ABS berfungsi. Ban dan kampas rem masih layak jarak jauh. Buku servis ada berdasarkan informasi demo seller. Cocok pengendara yang sudah terbiasa motor besar. Inspeksi di Nusantara Premium Motor, Surabaya.',
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
    'Harley-Davidson Iron 883 tahun 2019, 12.100 km, mesin 883 cc. Dark custom: knalpot aftermarket, setang, dan finishing denim black. Mesin kering, suara knalpot lebih dalam dari stock. Kopling terasa khas Sportster; rem cakram depan masih gigit. Ban sudah pernah diganti. STNK/BPKB lengkap menurut demo seller. Cocok pengendara yang mencari karakter Harley harian, bukan motor baru. Cek di Kemang.',
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
    'Triumph Street Twin tahun 2021, 6.700 km, mesin 900 cc. Modern classic dengan torsi rendah yang nyaman di macet Bandung. Cat merah rapi, sedikit upgrade spion dan handgrip. Mesin halus, radiator bersih, kelistrikan normal. Ban masih oke untuk dalam kota. Alasan jual: demo seller naik ke T120. Dokumen lengkap. Bisa test ride dengan janji di Dago.',
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
    'Royal Enfield Interceptor 650 tahun 2023, 2.800 km, mesin 648 cc twin. Kilometer rendah, warna orange, knalpot stock yang berkarakter. Cocok touring Bali: torsi menengah, posisi duduk tegak. Mesin masih terasa baru, oli rutin. Kelistrikan dan starter normal. Ban hampir baru. Pajak dan surat menurut demo seller rapi. Bukan motor balap; lebih ke cruising pesisir. Lihat di Urban Rider Garage.',
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
    'Kawasaki Z900RS tahun 2022, 4.100 km, mesin 948 cc. Retro-naked gaya Z1 dengan performa harian yang kuat. Cat kuning ikonik masih utuh, stang dan footpeg standar. Mesin empat silinder halus di putaran menengah, kopling tidak berat. ABS dan kelistrikan normal. Ban masih tebal. Servis Kawasaki tercatat menurut demo seller. Cocok pengendara yang ingin gaya klasik tanpa melepas performa modern. Showroom Surabaya.',
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
    'Honda CB650R tahun 2021, 9.200 km, mesin 649 cc four-cylinder. Neo sports cafe, handling netral, mesin halus khas Honda. Cat grey rapi, sedikit baret halus di sliders sesuai usia. Servis berkala Honda menurut demo seller. Ban dan rantai masih nyaman. Cocok harian Surabaya dan weekend ke Malang. Bukan motor track. Inspeksi di Nusantara Premium Motor.',
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
    'Yamaha MT-09 tahun 2022, 5.800 km, mesin 890 cc triple. Hyper naked dengan torsi tiga silinder; bukan motor pemula. Setup stock, sedikit upgrade tuas rem. Mesin kering, radiator bersih, kelistrikan normal. Ban masih grip untuk harian agresif di Jakarta. Kampas rem masih tebal. Dokumen lengkap berdasarkan informasi demo seller. Test ride hanya dengan perjanjian di Radio Dalam.',
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
    'BMW R 18 tahun 2022, 3.600 km, mesin boxer 1.802 cc. Cruiser big-twin, kilometer rendah, cat hitam mengkilap. Presentasi premium: mesin besar, posisi riding cruiser, bukan untuk macet sempit. Kelistrikan dan ABS berfungsi. Ban masih tebal. Perawatan sesuai interval BMW menurut catatan demo seller — bukan klaim dealer resmi. Cocok kolektor atau touring santai. Lihat di Surabaya.',
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
    'Harley-Davidson Forty-Eight tahun 2020, 10.200 km, mesin 1.202 cc. Fat tank, pelek 16 inci, warna orange, gaya street ikonik. Exhaust aftermarket, jok stock. Mesin terasa lebih berisi dari 883, kopling khas Sportster. Rem depan masih bagus. Ban sudah pernah diganti. STNK/BPKB ada menurut demo seller. Cocok pengendara yang sudah familiar dengan Harley. Inspeksi di Motodo Demo Garage, Kemang.',
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
    'Triumph Bonneville Bobber tahun 2021, 4.700 km, mesin 1.200 cc. Single seat, posisi riding rendah, tampilan pabrik yang bersih. Sedikit chrome dan cat hitam masih rapi. Mesin twin halus, torsi rendah nyaman di dalam kota. Kelistrikan dan lampu LED normal. Ban masih bagus. Alasan jual: demo seller ganti ke setup dual seat. Dokumen lengkap. Bisa dilihat di Jakarta Custom Works.',
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
    'Royal Enfield Continental GT 650 tahun 2022, 6.100 km, mesin 648 cc. Cafe racer clip-on, warna merah, cocok jalan pesisir Bali. Posisi riding lebih agresif dari Interceptor; leher dan pergelangan perlu terbiasa. Mesin twin terawat, knalpot stock. Kelistrikan normal. Ban masih layak. Pajak menurut demo seller aman. Bukan motor touring jauh; lebih ke gaya dan harian santai. Cek di Urban Rider Garage.',
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
    ('b0000000-0000-4000-8000-000000000001'::uuid, '03.jpg', 'https://motodo.id/listings/chopper.jpg', 2),
    ('b0000000-0000-4000-8000-000000000002'::uuid, '01.jpg', 'https://motodo.id/listings/triumph.jpg', 0),
    ('b0000000-0000-4000-8000-000000000002'::uuid, '02.jpg', 'https://motodo.id/listings/brat.jpg', 1),
    ('b0000000-0000-4000-8000-000000000002'::uuid, '03.jpg', 'https://motodo.id/listings/hero.jpg', 2),
    ('b0000000-0000-4000-8000-000000000003'::uuid, '01.jpg', 'https://motodo.id/listings/bobber.jpg', 0),
    ('b0000000-0000-4000-8000-000000000003'::uuid, '02.jpg', 'https://motodo.id/listings/chopper.jpg', 1),
    ('b0000000-0000-4000-8000-000000000003'::uuid, '03.jpg', 'https://motodo.id/listings/brat.jpg', 2),
    ('b0000000-0000-4000-8000-000000000004'::uuid, '01.jpg', 'https://motodo.id/listings/chopper.jpg', 0),
    ('b0000000-0000-4000-8000-000000000004'::uuid, '02.jpg', 'https://motodo.id/listings/bobber.jpg', 1),
    ('b0000000-0000-4000-8000-000000000004'::uuid, '03.jpg', 'https://motodo.id/listings/sportster.jpg', 2),
    ('b0000000-0000-4000-8000-000000000005'::uuid, '01.jpg', 'https://motodo.id/listings/bobber.jpg', 0),
    ('b0000000-0000-4000-8000-000000000005'::uuid, '02.jpg', 'https://motodo.id/listings/sportster.jpg', 1),
    ('b0000000-0000-4000-8000-000000000005'::uuid, '03.jpg', 'https://motodo.id/listings/hero.jpg', 2),
    ('b0000000-0000-4000-8000-000000000006'::uuid, '01.jpg', 'https://motodo.id/listings/brat.jpg', 0),
    ('b0000000-0000-4000-8000-000000000006'::uuid, '02.jpg', 'https://motodo.id/listings/triumph.jpg', 1),
    ('b0000000-0000-4000-8000-000000000006'::uuid, '03.jpg', 'https://motodo.id/listings/bobber.jpg', 2),
    ('b0000000-0000-4000-8000-000000000007'::uuid, '01.jpg', 'https://motodo.id/listings/hero.jpg', 0),
    ('b0000000-0000-4000-8000-000000000007'::uuid, '02.jpg', 'https://motodo.id/listings/sportster.jpg', 1),
    ('b0000000-0000-4000-8000-000000000007'::uuid, '03.jpg', 'https://motodo.id/listings/triumph.jpg', 2),
    ('b0000000-0000-4000-8000-000000000008'::uuid, '01.jpg', 'https://motodo.id/listings/triumph.jpg', 0),
    ('b0000000-0000-4000-8000-000000000008'::uuid, '02.jpg', 'https://motodo.id/listings/hero.jpg', 1),
    ('b0000000-0000-4000-8000-000000000008'::uuid, '03.jpg', 'https://motodo.id/listings/brat.jpg', 2),
    ('b0000000-0000-4000-8000-000000000009'::uuid, '01.jpg', 'https://motodo.id/listings/sportster.jpg', 0),
    ('b0000000-0000-4000-8000-000000000009'::uuid, '02.jpg', 'https://motodo.id/listings/bobber.jpg', 1),
    ('b0000000-0000-4000-8000-000000000009'::uuid, '03.jpg', 'https://motodo.id/listings/hero.jpg', 2),
    ('b0000000-0000-4000-8000-000000000010'::uuid, '01.jpg', 'https://motodo.id/listings/triumph.jpg', 0),
    ('b0000000-0000-4000-8000-000000000010'::uuid, '02.jpg', 'https://motodo.id/listings/brat.jpg', 1),
    ('b0000000-0000-4000-8000-000000000010'::uuid, '03.jpg', 'https://motodo.id/listings/chopper.jpg', 2),
    ('b0000000-0000-4000-8000-000000000011'::uuid, '01.jpg', 'https://motodo.id/listings/chopper.jpg', 0),
    ('b0000000-0000-4000-8000-000000000011'::uuid, '02.jpg', 'https://motodo.id/listings/brat.jpg', 1),
    ('b0000000-0000-4000-8000-000000000011'::uuid, '03.jpg', 'https://motodo.id/listings/triumph.jpg', 2),
    ('b0000000-0000-4000-8000-000000000012'::uuid, '01.jpg', 'https://motodo.id/listings/hero.jpg', 0),
    ('b0000000-0000-4000-8000-000000000012'::uuid, '02.jpg', 'https://motodo.id/listings/chopper.jpg', 1),
    ('b0000000-0000-4000-8000-000000000012'::uuid, '03.jpg', 'https://motodo.id/listings/sportster.jpg', 2),
    ('b0000000-0000-4000-8000-000000000013'::uuid, '01.jpg', 'https://motodo.id/listings/brat.jpg', 0),
    ('b0000000-0000-4000-8000-000000000013'::uuid, '02.jpg', 'https://motodo.id/listings/hero.jpg', 1),
    ('b0000000-0000-4000-8000-000000000013'::uuid, '03.jpg', 'https://motodo.id/listings/bobber.jpg', 2),
    ('b0000000-0000-4000-8000-000000000014'::uuid, '01.jpg', 'https://motodo.id/listings/chopper.jpg', 0),
    ('b0000000-0000-4000-8000-000000000014'::uuid, '02.jpg', 'https://motodo.id/listings/sportster.jpg', 1),
    ('b0000000-0000-4000-8000-000000000014'::uuid, '03.jpg', 'https://motodo.id/listings/brat.jpg', 2),
    ('b0000000-0000-4000-8000-000000000015'::uuid, '01.jpg', 'https://motodo.id/listings/bobber.jpg', 0),
    ('b0000000-0000-4000-8000-000000000015'::uuid, '02.jpg', 'https://motodo.id/listings/triumph.jpg', 1),
    ('b0000000-0000-4000-8000-000000000015'::uuid, '03.jpg', 'https://motodo.id/listings/hero.jpg', 2),
    ('b0000000-0000-4000-8000-000000000016'::uuid, '01.jpg', 'https://motodo.id/listings/sportster.jpg', 0),
    ('b0000000-0000-4000-8000-000000000016'::uuid, '02.jpg', 'https://motodo.id/listings/hero.jpg', 1),
    ('b0000000-0000-4000-8000-000000000016'::uuid, '03.jpg', 'https://motodo.id/listings/bobber.jpg', 2),
    ('b0000000-0000-4000-8000-000000000017'::uuid, '01.jpg', 'https://motodo.id/listings/bobber.jpg', 0),
    ('b0000000-0000-4000-8000-000000000017'::uuid, '02.jpg', 'https://motodo.id/listings/chopper.jpg', 1),
    ('b0000000-0000-4000-8000-000000000017'::uuid, '03.jpg', 'https://motodo.id/listings/triumph.jpg', 2),
    ('b0000000-0000-4000-8000-000000000018'::uuid, '01.jpg', 'https://motodo.id/listings/brat.jpg', 0),
    ('b0000000-0000-4000-8000-000000000018'::uuid, '02.jpg', 'https://motodo.id/listings/triumph.jpg', 1),
    ('b0000000-0000-4000-8000-000000000018'::uuid, '03.jpg', 'https://motodo.id/listings/hero.jpg', 2)
) AS img(listing_id, filename, public_url, sort_order);

-- ---------------------------------------------------------------------------
-- 5) DEMO buyers (is_demo). Unusable random passwords. Not for login.
-- ---------------------------------------------------------------------------
INSERT INTO auth.users (
  instance_id, id, aud, role, email, encrypted_password, email_confirmed_at,
  raw_app_meta_data, raw_user_meta_data, created_at, updated_at,
  confirmation_token, email_change, email_change_token_new, recovery_token
)
VALUES
(
  '00000000-0000-0000-0000-000000000000',
  'a0000000-0000-4000-8000-000000000101',
  'authenticated',
  'authenticated',
  'rizky.pratama@demo.motodo.id',
  crypt(encode(gen_random_bytes(16), 'hex'), gen_salt('bf')),
  now(),
  '{"provider":"email","providers":["email"]}'::jsonb,
  '{"full_name":"Rizky Pratama","account_type":"buyer"}'::jsonb,
  now(), now(), '', '', '', ''
),
(
  '00000000-0000-0000-0000-000000000000',
  'a0000000-0000-4000-8000-000000000102',
  'authenticated',
  'authenticated',
  'andi.setiawan@demo.motodo.id',
  crypt(encode(gen_random_bytes(16), 'hex'), gen_salt('bf')),
  now(),
  '{"provider":"email","providers":["email"]}'::jsonb,
  '{"full_name":"Andi Setiawan","account_type":"buyer"}'::jsonb,
  now(), now(), '', '', '', ''
),
(
  '00000000-0000-0000-0000-000000000000',
  'a0000000-0000-4000-8000-000000000103',
  'authenticated',
  'authenticated',
  'dewi.lestari@demo.motodo.id',
  crypt(encode(gen_random_bytes(16), 'hex'), gen_salt('bf')),
  now(),
  '{"provider":"email","providers":["email"]}'::jsonb,
  '{"full_name":"Dewi Lestari","account_type":"buyer"}'::jsonb,
  now(), now(), '', '', '', ''
),
(
  '00000000-0000-0000-0000-000000000000',
  'a0000000-0000-4000-8000-000000000104',
  'authenticated',
  'authenticated',
  'fajar.nugroho@demo.motodo.id',
  crypt(encode(gen_random_bytes(16), 'hex'), gen_salt('bf')),
  now(),
  '{"provider":"email","providers":["email"]}'::jsonb,
  '{"full_name":"Fajar Nugroho","account_type":"buyer"}'::jsonb,
  now(), now(), '', '', '', ''
),
(
  '00000000-0000-0000-0000-000000000000',
  'a0000000-0000-4000-8000-000000000105',
  'authenticated',
  'authenticated',
  'reza.mahendra@demo.motodo.id',
  crypt(encode(gen_random_bytes(16), 'hex'), gen_salt('bf')),
  now(),
  '{"provider":"email","providers":["email"]}'::jsonb,
  '{"full_name":"Reza Mahendra","account_type":"buyer"}'::jsonb,
  now(), now(), '', '', '', ''
),
(
  '00000000-0000-0000-0000-000000000000',
  'a0000000-0000-4000-8000-000000000106',
  'authenticated',
  'authenticated',
  'arif.ramadhan@demo.motodo.id',
  crypt(encode(gen_random_bytes(16), 'hex'), gen_salt('bf')),
  now(),
  '{"provider":"email","providers":["email"]}'::jsonb,
  '{"full_name":"Arif Ramadhan","account_type":"buyer"}'::jsonb,
  now(), now(), '', '', '', ''
),
(
  '00000000-0000-0000-0000-000000000000',
  'a0000000-0000-4000-8000-000000000107',
  'authenticated',
  'authenticated',
  'dimas.saputra@demo.motodo.id',
  crypt(encode(gen_random_bytes(16), 'hex'), gen_salt('bf')),
  now(),
  '{"provider":"email","providers":["email"]}'::jsonb,
  '{"full_name":"Dimas Saputra","account_type":"buyer"}'::jsonb,
  now(), now(), '', '', '', ''
),
(
  '00000000-0000-0000-0000-000000000000',
  'a0000000-0000-4000-8000-000000000108',
  'authenticated',
  'authenticated',
  'yoga.pranata@demo.motodo.id',
  crypt(encode(gen_random_bytes(16), 'hex'), gen_salt('bf')),
  now(),
  '{"provider":"email","providers":["email"]}'::jsonb,
  '{"full_name":"Yoga Pranata","account_type":"buyer"}'::jsonb,
  now(), now(), '', '', '', ''
),
(
  '00000000-0000-0000-0000-000000000000',
  'a0000000-0000-4000-8000-000000000109',
  'authenticated',
  'authenticated',
  'sinta.wulandari@demo.motodo.id',
  crypt(encode(gen_random_bytes(16), 'hex'), gen_salt('bf')),
  now(),
  '{"provider":"email","providers":["email"]}'::jsonb,
  '{"full_name":"Sinta Wulandari","account_type":"buyer"}'::jsonb,
  now(), now(), '', '', '', ''
),
(
  '00000000-0000-0000-0000-000000000000',
  'a0000000-0000-4000-8000-000000000110',
  'authenticated',
  'authenticated',
  'budi.hartono@demo.motodo.id',
  crypt(encode(gen_random_bytes(16), 'hex'), gen_salt('bf')),
  now(),
  '{"provider":"email","providers":["email"]}'::jsonb,
  '{"full_name":"Budi Hartono","account_type":"buyer"}'::jsonb,
  now(), now(), '', '', '', ''
),
(
  '00000000-0000-0000-0000-000000000000',
  'a0000000-0000-4000-8000-000000000111',
  'authenticated',
  'authenticated',
  'maya.kusuma@demo.motodo.id',
  crypt(encode(gen_random_bytes(16), 'hex'), gen_salt('bf')),
  now(),
  '{"provider":"email","providers":["email"]}'::jsonb,
  '{"full_name":"Maya Kusuma","account_type":"buyer"}'::jsonb,
  now(), now(), '', '', '', ''
),
(
  '00000000-0000-0000-0000-000000000000',
  'a0000000-0000-4000-8000-000000000112',
  'authenticated',
  'authenticated',
  'eko.wijaya@demo.motodo.id',
  crypt(encode(gen_random_bytes(16), 'hex'), gen_salt('bf')),
  now(),
  '{"provider":"email","providers":["email"]}'::jsonb,
  '{"full_name":"Eko Wijaya","account_type":"buyer"}'::jsonb,
  now(), now(), '', '', '', ''
)
ON CONFLICT (id) DO NOTHING;

INSERT INTO auth.identities (id, user_id, identity_data, provider, provider_id, last_sign_in_at, created_at, updated_at)
VALUES
  (
    'a0000000-0000-4000-8000-000000000101', 'a0000000-0000-4000-8000-000000000101',
    jsonb_build_object('sub', 'a0000000-0000-4000-8000-000000000101', 'email', 'rizky.pratama@demo.motodo.id'),
    'email', 'a0000000-0000-4000-8000-000000000101', now(), now(), now()
  ),
  (
    'a0000000-0000-4000-8000-000000000102', 'a0000000-0000-4000-8000-000000000102',
    jsonb_build_object('sub', 'a0000000-0000-4000-8000-000000000102', 'email', 'andi.setiawan@demo.motodo.id'),
    'email', 'a0000000-0000-4000-8000-000000000102', now(), now(), now()
  ),
  (
    'a0000000-0000-4000-8000-000000000103', 'a0000000-0000-4000-8000-000000000103',
    jsonb_build_object('sub', 'a0000000-0000-4000-8000-000000000103', 'email', 'dewi.lestari@demo.motodo.id'),
    'email', 'a0000000-0000-4000-8000-000000000103', now(), now(), now()
  ),
  (
    'a0000000-0000-4000-8000-000000000104', 'a0000000-0000-4000-8000-000000000104',
    jsonb_build_object('sub', 'a0000000-0000-4000-8000-000000000104', 'email', 'fajar.nugroho@demo.motodo.id'),
    'email', 'a0000000-0000-4000-8000-000000000104', now(), now(), now()
  ),
  (
    'a0000000-0000-4000-8000-000000000105', 'a0000000-0000-4000-8000-000000000105',
    jsonb_build_object('sub', 'a0000000-0000-4000-8000-000000000105', 'email', 'reza.mahendra@demo.motodo.id'),
    'email', 'a0000000-0000-4000-8000-000000000105', now(), now(), now()
  ),
  (
    'a0000000-0000-4000-8000-000000000106', 'a0000000-0000-4000-8000-000000000106',
    jsonb_build_object('sub', 'a0000000-0000-4000-8000-000000000106', 'email', 'arif.ramadhan@demo.motodo.id'),
    'email', 'a0000000-0000-4000-8000-000000000106', now(), now(), now()
  ),
  (
    'a0000000-0000-4000-8000-000000000107', 'a0000000-0000-4000-8000-000000000107',
    jsonb_build_object('sub', 'a0000000-0000-4000-8000-000000000107', 'email', 'dimas.saputra@demo.motodo.id'),
    'email', 'a0000000-0000-4000-8000-000000000107', now(), now(), now()
  ),
  (
    'a0000000-0000-4000-8000-000000000108', 'a0000000-0000-4000-8000-000000000108',
    jsonb_build_object('sub', 'a0000000-0000-4000-8000-000000000108', 'email', 'yoga.pranata@demo.motodo.id'),
    'email', 'a0000000-0000-4000-8000-000000000108', now(), now(), now()
  ),
  (
    'a0000000-0000-4000-8000-000000000109', 'a0000000-0000-4000-8000-000000000109',
    jsonb_build_object('sub', 'a0000000-0000-4000-8000-000000000109', 'email', 'sinta.wulandari@demo.motodo.id'),
    'email', 'a0000000-0000-4000-8000-000000000109', now(), now(), now()
  ),
  (
    'a0000000-0000-4000-8000-000000000110', 'a0000000-0000-4000-8000-000000000110',
    jsonb_build_object('sub', 'a0000000-0000-4000-8000-000000000110', 'email', 'budi.hartono@demo.motodo.id'),
    'email', 'a0000000-0000-4000-8000-000000000110', now(), now(), now()
  ),
  (
    'a0000000-0000-4000-8000-000000000111', 'a0000000-0000-4000-8000-000000000111',
    jsonb_build_object('sub', 'a0000000-0000-4000-8000-000000000111', 'email', 'maya.kusuma@demo.motodo.id'),
    'email', 'a0000000-0000-4000-8000-000000000111', now(), now(), now()
  ),
  (
    'a0000000-0000-4000-8000-000000000112', 'a0000000-0000-4000-8000-000000000112',
    jsonb_build_object('sub', 'a0000000-0000-4000-8000-000000000112', 'email', 'eko.wijaya@demo.motodo.id'),
    'email', 'a0000000-0000-4000-8000-000000000112', now(), now(), now()
  )
ON CONFLICT (provider_id, provider) DO NOTHING;

UPDATE public.profiles SET is_demo = true, account_type = 'buyer', full_name = CASE id
  WHEN 'a0000000-0000-4000-8000-000000000101' THEN 'Rizky Pratama'
  WHEN 'a0000000-0000-4000-8000-000000000102' THEN 'Andi Setiawan'
  WHEN 'a0000000-0000-4000-8000-000000000103' THEN 'Dewi Lestari'
  WHEN 'a0000000-0000-4000-8000-000000000104' THEN 'Fajar Nugroho'
  WHEN 'a0000000-0000-4000-8000-000000000105' THEN 'Reza Mahendra'
  WHEN 'a0000000-0000-4000-8000-000000000106' THEN 'Arif Ramadhan'
  WHEN 'a0000000-0000-4000-8000-000000000107' THEN 'Dimas Saputra'
  WHEN 'a0000000-0000-4000-8000-000000000108' THEN 'Yoga Pranata'
  WHEN 'a0000000-0000-4000-8000-000000000109' THEN 'Sinta Wulandari'
  WHEN 'a0000000-0000-4000-8000-000000000110' THEN 'Budi Hartono'
  WHEN 'a0000000-0000-4000-8000-000000000111' THEN 'Maya Kusuma'
  WHEN 'a0000000-0000-4000-8000-000000000112' THEN 'Eko Wijaya'
  ELSE full_name END
WHERE id IN (
  'a0000000-0000-4000-8000-000000000101',
  'a0000000-0000-4000-8000-000000000102',
  'a0000000-0000-4000-8000-000000000103',
  'a0000000-0000-4000-8000-000000000104',
  'a0000000-0000-4000-8000-000000000105',
  'a0000000-0000-4000-8000-000000000106',
  'a0000000-0000-4000-8000-000000000107',
  'a0000000-0000-4000-8000-000000000108',
  'a0000000-0000-4000-8000-000000000109',
  'a0000000-0000-4000-8000-000000000110',
  'a0000000-0000-4000-8000-000000000111',
  'a0000000-0000-4000-8000-000000000112'
);

-- ---------------------------------------------------------------------------
-- 6) DEMO completed orders (scaffolding for reviews only).
-- Inserted as completed so complete_order() does not decrement listing.quantity.
-- Deterministic IDs c0000000-...-0000000000NN
-- ---------------------------------------------------------------------------
INSERT INTO public.orders (
  id, order_number, buyer_id, seller_id, listing_id, quantity, unit_price, subtotal,
  discount_amount, buyer_total, seller_fee_rate, seller_fee_amount, seller_net_amount,
  delivery_method, payment_method, payment_status, status, listing_name, buyer_name
)
VALUES
  (
    'c0000000-0000-4000-8000-000000000001', 'MTD-D0001', 'a0000000-0000-4000-8000-000000000101', 'a0000000-0000-4000-8000-000000000001', 'b0000000-0000-4000-8000-000000000001',
    1, 185000000, 185000000, 0, 185000000, 0.02, 3700000.0, 181300000.0,
    'pickup', 'bank_transfer', 'paid', 'completed',
    'Harley-Davidson Sportster 883 Custom', 'Rizky Pratama'
  ),
  (
    'c0000000-0000-4000-8000-000000000002', 'MTD-D0002', 'a0000000-0000-4000-8000-000000000102', 'a0000000-0000-4000-8000-000000000001', 'b0000000-0000-4000-8000-000000000001',
    1, 185000000, 185000000, 0, 185000000, 0.02, 3700000.0, 181300000.0,
    'pickup', 'bank_transfer', 'paid', 'completed',
    'Harley-Davidson Sportster 883 Custom', 'Andi Setiawan'
  ),
  (
    'c0000000-0000-4000-8000-000000000003', 'MTD-D0003', 'a0000000-0000-4000-8000-000000000103', 'a0000000-0000-4000-8000-000000000001', 'b0000000-0000-4000-8000-000000000001',
    1, 185000000, 185000000, 0, 185000000, 0.02, 3700000.0, 181300000.0,
    'pickup', 'bank_transfer', 'paid', 'completed',
    'Harley-Davidson Sportster 883 Custom', 'Dewi Lestari'
  ),
  (
    'c0000000-0000-4000-8000-000000000004', 'MTD-D0004', 'a0000000-0000-4000-8000-000000000104', 'a0000000-0000-4000-8000-000000000001', 'b0000000-0000-4000-8000-000000000001',
    1, 185000000, 185000000, 0, 185000000, 0.02, 3700000.0, 181300000.0,
    'pickup', 'bank_transfer', 'paid', 'completed',
    'Harley-Davidson Sportster 883 Custom', 'Fajar Nugroho'
  ),
  (
    'c0000000-0000-4000-8000-000000000005', 'MTD-D0005', 'a0000000-0000-4000-8000-000000000105', 'a0000000-0000-4000-8000-000000000001', 'b0000000-0000-4000-8000-000000000001',
    1, 185000000, 185000000, 0, 185000000, 0.02, 3700000.0, 181300000.0,
    'pickup', 'bank_transfer', 'paid', 'completed',
    'Harley-Davidson Sportster 883 Custom', 'Reza Mahendra'
  ),
  (
    'c0000000-0000-4000-8000-000000000006', 'MTD-D0006', 'a0000000-0000-4000-8000-000000000106', 'a0000000-0000-4000-8000-000000000004', 'b0000000-0000-4000-8000-000000000002',
    1, 210000000, 210000000, 0, 210000000, 0.02, 4200000.0, 205800000.0,
    'pickup', 'bank_transfer', 'paid', 'completed',
    'Triumph Bonneville T120', 'Arif Ramadhan'
  ),
  (
    'c0000000-0000-4000-8000-000000000007', 'MTD-D0007', 'a0000000-0000-4000-8000-000000000107', 'a0000000-0000-4000-8000-000000000004', 'b0000000-0000-4000-8000-000000000002',
    1, 210000000, 210000000, 0, 210000000, 0.02, 4200000.0, 205800000.0,
    'pickup', 'bank_transfer', 'paid', 'completed',
    'Triumph Bonneville T120', 'Dimas Saputra'
  ),
  (
    'c0000000-0000-4000-8000-000000000008', 'MTD-D0008', 'a0000000-0000-4000-8000-000000000108', 'a0000000-0000-4000-8000-000000000004', 'b0000000-0000-4000-8000-000000000002',
    1, 210000000, 210000000, 0, 210000000, 0.02, 4200000.0, 205800000.0,
    'pickup', 'bank_transfer', 'paid', 'completed',
    'Triumph Bonneville T120', 'Yoga Pranata'
  ),
  (
    'c0000000-0000-4000-8000-000000000009', 'MTD-D0009', 'a0000000-0000-4000-8000-000000000109', 'a0000000-0000-4000-8000-000000000004', 'b0000000-0000-4000-8000-000000000002',
    1, 210000000, 210000000, 0, 210000000, 0.02, 4200000.0, 205800000.0,
    'pickup', 'bank_transfer', 'paid', 'completed',
    'Triumph Bonneville T120', 'Sinta Wulandari'
  ),
  (
    'c0000000-0000-4000-8000-000000000010', 'MTD-D0010', 'a0000000-0000-4000-8000-000000000110', 'a0000000-0000-4000-8000-000000000004', 'b0000000-0000-4000-8000-000000000003',
    1, 62000000, 62000000, 0, 62000000, 0.02, 1240000.0, 60760000.0,
    'pickup', 'bank_transfer', 'paid', 'completed',
    'Royal Enfield Classic 350', 'Budi Hartono'
  ),
  (
    'c0000000-0000-4000-8000-000000000011', 'MTD-D0011', 'a0000000-0000-4000-8000-000000000111', 'a0000000-0000-4000-8000-000000000004', 'b0000000-0000-4000-8000-000000000003',
    1, 62000000, 62000000, 0, 62000000, 0.02, 1240000.0, 60760000.0,
    'pickup', 'bank_transfer', 'paid', 'completed',
    'Royal Enfield Classic 350', 'Maya Kusuma'
  ),
  (
    'c0000000-0000-4000-8000-000000000012', 'MTD-D0012', 'a0000000-0000-4000-8000-000000000112', 'a0000000-0000-4000-8000-000000000004', 'b0000000-0000-4000-8000-000000000003',
    1, 62000000, 62000000, 0, 62000000, 0.02, 1240000.0, 60760000.0,
    'pickup', 'bank_transfer', 'paid', 'completed',
    'Royal Enfield Classic 350', 'Eko Wijaya'
  ),
  (
    'c0000000-0000-4000-8000-000000000013', 'MTD-D0013', 'a0000000-0000-4000-8000-000000000101', 'a0000000-0000-4000-8000-000000000004', 'b0000000-0000-4000-8000-000000000003',
    1, 62000000, 62000000, 0, 62000000, 0.02, 1240000.0, 60760000.0,
    'pickup', 'bank_transfer', 'paid', 'completed',
    'Royal Enfield Classic 350', 'Rizky Pratama'
  ),
  (
    'c0000000-0000-4000-8000-000000000014', 'MTD-D0014', 'a0000000-0000-4000-8000-000000000102', 'a0000000-0000-4000-8000-000000000002', 'b0000000-0000-4000-8000-000000000004',
    1, 48000000, 48000000, 0, 48000000, 0.02, 960000.0, 47040000.0,
    'pickup', 'bank_transfer', 'paid', 'completed',
    'Kawasaki W175 Custom', 'Andi Setiawan'
  ),
  (
    'c0000000-0000-4000-8000-000000000015', 'MTD-D0015', 'a0000000-0000-4000-8000-000000000103', 'a0000000-0000-4000-8000-000000000002', 'b0000000-0000-4000-8000-000000000004',
    1, 48000000, 48000000, 0, 48000000, 0.02, 960000.0, 47040000.0,
    'pickup', 'bank_transfer', 'paid', 'completed',
    'Kawasaki W175 Custom', 'Dewi Lestari'
  ),
  (
    'c0000000-0000-4000-8000-000000000016', 'MTD-D0016', 'a0000000-0000-4000-8000-000000000104', 'a0000000-0000-4000-8000-000000000002', 'b0000000-0000-4000-8000-000000000004',
    1, 48000000, 48000000, 0, 48000000, 0.02, 960000.0, 47040000.0,
    'pickup', 'bank_transfer', 'paid', 'completed',
    'Kawasaki W175 Custom', 'Fajar Nugroho'
  ),
  (
    'c0000000-0000-4000-8000-000000000017', 'MTD-D0017', 'a0000000-0000-4000-8000-000000000105', 'a0000000-0000-4000-8000-000000000002', 'b0000000-0000-4000-8000-000000000005',
    1, 118000000, 118000000, 0, 118000000, 0.02, 2360000.0, 115640000.0,
    'pickup', 'bank_transfer', 'paid', 'completed',
    'Honda Rebel 500', 'Reza Mahendra'
  ),
  (
    'c0000000-0000-4000-8000-000000000018', 'MTD-D0018', 'a0000000-0000-4000-8000-000000000106', 'a0000000-0000-4000-8000-000000000002', 'b0000000-0000-4000-8000-000000000005',
    1, 118000000, 118000000, 0, 118000000, 0.02, 2360000.0, 115640000.0,
    'pickup', 'bank_transfer', 'paid', 'completed',
    'Honda Rebel 500', 'Arif Ramadhan'
  ),
  (
    'c0000000-0000-4000-8000-000000000019', 'MTD-D0019', 'a0000000-0000-4000-8000-000000000107', 'a0000000-0000-4000-8000-000000000002', 'b0000000-0000-4000-8000-000000000005',
    1, 118000000, 118000000, 0, 118000000, 0.02, 2360000.0, 115640000.0,
    'pickup', 'bank_transfer', 'paid', 'completed',
    'Honda Rebel 500', 'Dimas Saputra'
  ),
  (
    'c0000000-0000-4000-8000-000000000020', 'MTD-D0020', 'a0000000-0000-4000-8000-000000000108', 'a0000000-0000-4000-8000-000000000002', 'b0000000-0000-4000-8000-000000000005',
    1, 118000000, 118000000, 0, 118000000, 0.02, 2360000.0, 115640000.0,
    'pickup', 'bank_transfer', 'paid', 'completed',
    'Honda Rebel 500', 'Yoga Pranata'
  ),
  (
    'c0000000-0000-4000-8000-000000000021', 'MTD-D0021', 'a0000000-0000-4000-8000-000000000109', 'a0000000-0000-4000-8000-000000000005', 'b0000000-0000-4000-8000-000000000006',
    1, 39000000, 39000000, 0, 39000000, 0.02, 780000.0, 38220000.0,
    'pickup', 'bank_transfer', 'paid', 'completed',
    'Yamaha XSR 155', 'Sinta Wulandari'
  ),
  (
    'c0000000-0000-4000-8000-000000000022', 'MTD-D0022', 'a0000000-0000-4000-8000-000000000110', 'a0000000-0000-4000-8000-000000000005', 'b0000000-0000-4000-8000-000000000006',
    1, 39000000, 39000000, 0, 39000000, 0.02, 780000.0, 38220000.0,
    'pickup', 'bank_transfer', 'paid', 'completed',
    'Yamaha XSR 155', 'Budi Hartono'
  ),
  (
    'c0000000-0000-4000-8000-000000000023', 'MTD-D0023', 'a0000000-0000-4000-8000-000000000111', 'a0000000-0000-4000-8000-000000000005', 'b0000000-0000-4000-8000-000000000006',
    1, 39000000, 39000000, 0, 39000000, 0.02, 780000.0, 38220000.0,
    'pickup', 'bank_transfer', 'paid', 'completed',
    'Yamaha XSR 155', 'Maya Kusuma'
  ),
  (
    'c0000000-0000-4000-8000-000000000024', 'MTD-D0024', 'a0000000-0000-4000-8000-000000000112', 'a0000000-0000-4000-8000-000000000003', 'b0000000-0000-4000-8000-000000000007',
    1, 245000000, 245000000, 0, 245000000, 0.02, 4900000.0, 240100000.0,
    'pickup', 'bank_transfer', 'paid', 'completed',
    'Ducati Scrambler Icon', 'Eko Wijaya'
  ),
  (
    'c0000000-0000-4000-8000-000000000025', 'MTD-D0025', 'a0000000-0000-4000-8000-000000000101', 'a0000000-0000-4000-8000-000000000003', 'b0000000-0000-4000-8000-000000000007',
    1, 245000000, 245000000, 0, 245000000, 0.02, 4900000.0, 240100000.0,
    'pickup', 'bank_transfer', 'paid', 'completed',
    'Ducati Scrambler Icon', 'Rizky Pratama'
  ),
  (
    'c0000000-0000-4000-8000-000000000026', 'MTD-D0026', 'a0000000-0000-4000-8000-000000000102', 'a0000000-0000-4000-8000-000000000003', 'b0000000-0000-4000-8000-000000000007',
    1, 245000000, 245000000, 0, 245000000, 0.02, 4900000.0, 240100000.0,
    'pickup', 'bank_transfer', 'paid', 'completed',
    'Ducati Scrambler Icon', 'Andi Setiawan'
  ),
  (
    'c0000000-0000-4000-8000-000000000027', 'MTD-D0027', 'a0000000-0000-4000-8000-000000000103', 'a0000000-0000-4000-8000-000000000003', 'b0000000-0000-4000-8000-000000000008',
    1, 420000000, 420000000, 0, 420000000, 0.02, 8400000.0, 411600000.0,
    'pickup', 'bank_transfer', 'paid', 'completed',
    'BMW R nineT', 'Dewi Lestari'
  ),
  (
    'c0000000-0000-4000-8000-000000000028', 'MTD-D0028', 'a0000000-0000-4000-8000-000000000104', 'a0000000-0000-4000-8000-000000000003', 'b0000000-0000-4000-8000-000000000008',
    1, 420000000, 420000000, 0, 420000000, 0.02, 8400000.0, 411600000.0,
    'pickup', 'bank_transfer', 'paid', 'completed',
    'BMW R nineT', 'Fajar Nugroho'
  ),
  (
    'c0000000-0000-4000-8000-000000000029', 'MTD-D0029', 'a0000000-0000-4000-8000-000000000105', 'a0000000-0000-4000-8000-000000000001', 'b0000000-0000-4000-8000-000000000009',
    1, 175000000, 175000000, 0, 175000000, 0.02, 3500000.0, 171500000.0,
    'pickup', 'bank_transfer', 'paid', 'completed',
    'Harley-Davidson Iron 883', 'Reza Mahendra'
  ),
  (
    'c0000000-0000-4000-8000-000000000030', 'MTD-D0030', 'a0000000-0000-4000-8000-000000000106', 'a0000000-0000-4000-8000-000000000001', 'b0000000-0000-4000-8000-000000000009',
    1, 175000000, 175000000, 0, 175000000, 0.02, 3500000.0, 171500000.0,
    'pickup', 'bank_transfer', 'paid', 'completed',
    'Harley-Davidson Iron 883', 'Arif Ramadhan'
  ),
  (
    'c0000000-0000-4000-8000-000000000031', 'MTD-D0031', 'a0000000-0000-4000-8000-000000000107', 'a0000000-0000-4000-8000-000000000001', 'b0000000-0000-4000-8000-000000000009',
    1, 175000000, 175000000, 0, 175000000, 0.02, 3500000.0, 171500000.0,
    'pickup', 'bank_transfer', 'paid', 'completed',
    'Harley-Davidson Iron 883', 'Dimas Saputra'
  ),
  (
    'c0000000-0000-4000-8000-000000000032', 'MTD-D0032', 'a0000000-0000-4000-8000-000000000108', 'a0000000-0000-4000-8000-000000000004', 'b0000000-0000-4000-8000-000000000010',
    1, 165000000, 165000000, 0, 165000000, 0.02, 3300000.0, 161700000.0,
    'pickup', 'bank_transfer', 'paid', 'completed',
    'Triumph Street Twin', 'Yoga Pranata'
  ),
  (
    'c0000000-0000-4000-8000-000000000033', 'MTD-D0033', 'a0000000-0000-4000-8000-000000000109', 'a0000000-0000-4000-8000-000000000004', 'b0000000-0000-4000-8000-000000000010',
    1, 165000000, 165000000, 0, 165000000, 0.02, 3300000.0, 161700000.0,
    'pickup', 'bank_transfer', 'paid', 'completed',
    'Triumph Street Twin', 'Sinta Wulandari'
  ),
  (
    'c0000000-0000-4000-8000-000000000034', 'MTD-D0034', 'a0000000-0000-4000-8000-000000000110', 'a0000000-0000-4000-8000-000000000004', 'b0000000-0000-4000-8000-000000000010',
    1, 165000000, 165000000, 0, 165000000, 0.02, 3300000.0, 161700000.0,
    'pickup', 'bank_transfer', 'paid', 'completed',
    'Triumph Street Twin', 'Budi Hartono'
  ),
  (
    'c0000000-0000-4000-8000-000000000035', 'MTD-D0035', 'a0000000-0000-4000-8000-000000000111', 'a0000000-0000-4000-8000-000000000005', 'b0000000-0000-4000-8000-000000000011',
    1, 98000000, 98000000, 0, 98000000, 0.02, 1960000.0, 96040000.0,
    'pickup', 'bank_transfer', 'paid', 'completed',
    'Royal Enfield Interceptor 650', 'Maya Kusuma'
  ),
  (
    'c0000000-0000-4000-8000-000000000036', 'MTD-D0036', 'a0000000-0000-4000-8000-000000000112', 'a0000000-0000-4000-8000-000000000005', 'b0000000-0000-4000-8000-000000000011',
    1, 98000000, 98000000, 0, 98000000, 0.02, 1960000.0, 96040000.0,
    'pickup', 'bank_transfer', 'paid', 'completed',
    'Royal Enfield Interceptor 650', 'Eko Wijaya'
  ),
  (
    'c0000000-0000-4000-8000-000000000037', 'MTD-D0037', 'a0000000-0000-4000-8000-000000000101', 'a0000000-0000-4000-8000-000000000005', 'b0000000-0000-4000-8000-000000000011',
    1, 98000000, 98000000, 0, 98000000, 0.02, 1960000.0, 96040000.0,
    'pickup', 'bank_transfer', 'paid', 'completed',
    'Royal Enfield Interceptor 650', 'Rizky Pratama'
  ),
  (
    'c0000000-0000-4000-8000-000000000038', 'MTD-D0038', 'a0000000-0000-4000-8000-000000000102', 'a0000000-0000-4000-8000-000000000003', 'b0000000-0000-4000-8000-000000000012',
    1, 268000000, 268000000, 0, 268000000, 0.02, 5360000.0, 262640000.0,
    'pickup', 'bank_transfer', 'paid', 'completed',
    'Kawasaki Z900RS', 'Andi Setiawan'
  ),
  (
    'c0000000-0000-4000-8000-000000000039', 'MTD-D0039', 'a0000000-0000-4000-8000-000000000103', 'a0000000-0000-4000-8000-000000000003', 'b0000000-0000-4000-8000-000000000012',
    1, 268000000, 268000000, 0, 268000000, 0.02, 5360000.0, 262640000.0,
    'pickup', 'bank_transfer', 'paid', 'completed',
    'Kawasaki Z900RS', 'Dewi Lestari'
  ),
  (
    'c0000000-0000-4000-8000-000000000040', 'MTD-D0040', 'a0000000-0000-4000-8000-000000000104', 'a0000000-0000-4000-8000-000000000003', 'b0000000-0000-4000-8000-000000000013',
    1, 198000000, 198000000, 0, 198000000, 0.02, 3960000.0, 194040000.0,
    'pickup', 'bank_transfer', 'paid', 'completed',
    'Honda CB650R', 'Fajar Nugroho'
  ),
  (
    'c0000000-0000-4000-8000-000000000041', 'MTD-D0041', 'a0000000-0000-4000-8000-000000000105', 'a0000000-0000-4000-8000-000000000003', 'b0000000-0000-4000-8000-000000000013',
    1, 198000000, 198000000, 0, 198000000, 0.02, 3960000.0, 194040000.0,
    'pickup', 'bank_transfer', 'paid', 'completed',
    'Honda CB650R', 'Reza Mahendra'
  ),
  (
    'c0000000-0000-4000-8000-000000000042', 'MTD-D0042', 'a0000000-0000-4000-8000-000000000106', 'a0000000-0000-4000-8000-000000000003', 'b0000000-0000-4000-8000-000000000013',
    1, 198000000, 198000000, 0, 198000000, 0.02, 3960000.0, 194040000.0,
    'pickup', 'bank_transfer', 'paid', 'completed',
    'Honda CB650R', 'Arif Ramadhan'
  ),
  (
    'c0000000-0000-4000-8000-000000000043', 'MTD-D0043', 'a0000000-0000-4000-8000-000000000107', 'a0000000-0000-4000-8000-000000000002', 'b0000000-0000-4000-8000-000000000014',
    1, 225000000, 225000000, 0, 225000000, 0.02, 4500000.0, 220500000.0,
    'pickup', 'bank_transfer', 'paid', 'completed',
    'Yamaha MT-09', 'Dimas Saputra'
  ),
  (
    'c0000000-0000-4000-8000-000000000044', 'MTD-D0044', 'a0000000-0000-4000-8000-000000000108', 'a0000000-0000-4000-8000-000000000002', 'b0000000-0000-4000-8000-000000000014',
    1, 225000000, 225000000, 0, 225000000, 0.02, 4500000.0, 220500000.0,
    'pickup', 'bank_transfer', 'paid', 'completed',
    'Yamaha MT-09', 'Yoga Pranata'
  ),
  (
    'c0000000-0000-4000-8000-000000000045', 'MTD-D0045', 'a0000000-0000-4000-8000-000000000109', 'a0000000-0000-4000-8000-000000000002', 'b0000000-0000-4000-8000-000000000014',
    1, 225000000, 225000000, 0, 225000000, 0.02, 4500000.0, 220500000.0,
    'pickup', 'bank_transfer', 'paid', 'completed',
    'Yamaha MT-09', 'Sinta Wulandari'
  ),
  (
    'c0000000-0000-4000-8000-000000000046', 'MTD-D0046', 'a0000000-0000-4000-8000-000000000110', 'a0000000-0000-4000-8000-000000000003', 'b0000000-0000-4000-8000-000000000015',
    1, 495000000, 495000000, 0, 495000000, 0.02, 9900000.0, 485100000.0,
    'pickup', 'bank_transfer', 'paid', 'completed',
    'BMW R 18', 'Budi Hartono'
  ),
  (
    'c0000000-0000-4000-8000-000000000047', 'MTD-D0047', 'a0000000-0000-4000-8000-000000000111', 'a0000000-0000-4000-8000-000000000003', 'b0000000-0000-4000-8000-000000000015',
    1, 495000000, 495000000, 0, 495000000, 0.02, 9900000.0, 485100000.0,
    'pickup', 'bank_transfer', 'paid', 'completed',
    'BMW R 18', 'Maya Kusuma'
  ),
  (
    'c0000000-0000-4000-8000-000000000048', 'MTD-D0048', 'a0000000-0000-4000-8000-000000000112', 'a0000000-0000-4000-8000-000000000001', 'b0000000-0000-4000-8000-000000000016',
    1, 205000000, 205000000, 0, 205000000, 0.02, 4100000.0, 200900000.0,
    'pickup', 'bank_transfer', 'paid', 'completed',
    'Harley-Davidson Forty-Eight', 'Eko Wijaya'
  ),
  (
    'c0000000-0000-4000-8000-000000000049', 'MTD-D0049', 'a0000000-0000-4000-8000-000000000101', 'a0000000-0000-4000-8000-000000000001', 'b0000000-0000-4000-8000-000000000016',
    1, 205000000, 205000000, 0, 205000000, 0.02, 4100000.0, 200900000.0,
    'pickup', 'bank_transfer', 'paid', 'completed',
    'Harley-Davidson Forty-Eight', 'Rizky Pratama'
  ),
  (
    'c0000000-0000-4000-8000-000000000050', 'MTD-D0050', 'a0000000-0000-4000-8000-000000000102', 'a0000000-0000-4000-8000-000000000001', 'b0000000-0000-4000-8000-000000000016',
    1, 205000000, 205000000, 0, 205000000, 0.02, 4100000.0, 200900000.0,
    'pickup', 'bank_transfer', 'paid', 'completed',
    'Harley-Davidson Forty-Eight', 'Andi Setiawan'
  ),
  (
    'c0000000-0000-4000-8000-000000000051', 'MTD-D0051', 'a0000000-0000-4000-8000-000000000103', 'a0000000-0000-4000-8000-000000000002', 'b0000000-0000-4000-8000-000000000017',
    1, 235000000, 235000000, 0, 235000000, 0.02, 4700000.0, 230300000.0,
    'pickup', 'bank_transfer', 'paid', 'completed',
    'Triumph Bonneville Bobber', 'Dewi Lestari'
  ),
  (
    'c0000000-0000-4000-8000-000000000052', 'MTD-D0052', 'a0000000-0000-4000-8000-000000000104', 'a0000000-0000-4000-8000-000000000002', 'b0000000-0000-4000-8000-000000000017',
    1, 235000000, 235000000, 0, 235000000, 0.02, 4700000.0, 230300000.0,
    'pickup', 'bank_transfer', 'paid', 'completed',
    'Triumph Bonneville Bobber', 'Fajar Nugroho'
  ),
  (
    'c0000000-0000-4000-8000-000000000053', 'MTD-D0053', 'a0000000-0000-4000-8000-000000000105', 'a0000000-0000-4000-8000-000000000002', 'b0000000-0000-4000-8000-000000000017',
    1, 235000000, 235000000, 0, 235000000, 0.02, 4700000.0, 230300000.0,
    'pickup', 'bank_transfer', 'paid', 'completed',
    'Triumph Bonneville Bobber', 'Reza Mahendra'
  ),
  (
    'c0000000-0000-4000-8000-000000000054', 'MTD-D0054', 'a0000000-0000-4000-8000-000000000106', 'a0000000-0000-4000-8000-000000000005', 'b0000000-0000-4000-8000-000000000018',
    1, 105000000, 105000000, 0, 105000000, 0.02, 2100000.0, 102900000.0,
    'pickup', 'bank_transfer', 'paid', 'completed',
    'Royal Enfield Continental GT 650', 'Arif Ramadhan'
  ),
  (
    'c0000000-0000-4000-8000-000000000055', 'MTD-D0055', 'a0000000-0000-4000-8000-000000000107', 'a0000000-0000-4000-8000-000000000005', 'b0000000-0000-4000-8000-000000000018',
    1, 105000000, 105000000, 0, 105000000, 0.02, 2100000.0, 102900000.0,
    'pickup', 'bank_transfer', 'paid', 'completed',
    'Royal Enfield Continental GT 650', 'Dimas Saputra'
  ),
  (
    'c0000000-0000-4000-8000-000000000056', 'MTD-D0056', 'a0000000-0000-4000-8000-000000000108', 'a0000000-0000-4000-8000-000000000005', 'b0000000-0000-4000-8000-000000000018',
    1, 105000000, 105000000, 0, 105000000, 0.02, 2100000.0, 102900000.0,
    'pickup', 'bank_transfer', 'paid', 'completed',
    'Royal Enfield Continental GT 650', 'Yoga Pranata'
  )
ON CONFLICT (id) DO UPDATE SET
  order_number = EXCLUDED.order_number,
  buyer_id = EXCLUDED.buyer_id,
  seller_id = EXCLUDED.seller_id,
  listing_id = EXCLUDED.listing_id,
  quantity = EXCLUDED.quantity,
  unit_price = EXCLUDED.unit_price,
  subtotal = EXCLUDED.subtotal,
  buyer_total = EXCLUDED.buyer_total,
  seller_fee_amount = EXCLUDED.seller_fee_amount,
  seller_net_amount = EXCLUDED.seller_net_amount,
  delivery_method = EXCLUDED.delivery_method,
  payment_status = EXCLUDED.payment_status,
  status = EXCLUDED.status,
  listing_name = EXCLUDED.listing_name,
  buyer_name = EXCLUDED.buyer_name
WHERE public.orders.listing_id IN (SELECT id FROM public.listings WHERE is_demo = true);

-- ---------------------------------------------------------------------------
-- 7) DEMO reviews (one per DEMO order). Feeds listing_rating_summary / seller_rating_summary.
-- ---------------------------------------------------------------------------
INSERT INTO public.reviews (
  id, order_id, listing_id, seller_id, buyer_id, rating, title, body, status,
  order_number, listing_name, buyer_display_name, created_at
)
VALUES
  (
    'd0000000-0000-4000-8000-000000000001', 'c0000000-0000-4000-8000-000000000001', 'b0000000-0000-4000-8000-000000000001', 'a0000000-0000-4000-8000-000000000001', 'a0000000-0000-4000-8000-000000000101',
    5, 'Sesuai foto', 'Unit Sportster 883 di Kemang sesuai deskripsi. Mesin 883 cc hidup halus dan seller menjelaskan upgrade knalpot dengan jujur. Komunikasi lewat Motodo cepat.', 'published',
    'MTD-D0001', 'Harley-Davidson Sportster 883 Custom', 'Rizky Pratama',
    now() - interval '1 days'
  ),
  (
    'd0000000-0000-4000-8000-000000000002', 'c0000000-0000-4000-8000-000000000002', 'b0000000-0000-4000-8000-000000000001', 'a0000000-0000-4000-8000-000000000001', 'a0000000-0000-4000-8000-000000000102',
    5, 'Showroom rapi', 'Datang ke showroom demo, odometer 8.500 km cocok dengan listing. Surat-surat ditunjukkan. Proses tanya jawab tentang servis cukup lengkap.', 'published',
    'MTD-D0002', 'Harley-Davidson Sportster 883 Custom', 'Andi Setiawan',
    now() - interval '2 days'
  ),
  (
    'd0000000-0000-4000-8000-000000000003', 'c0000000-0000-4000-8000-000000000003', 'b0000000-0000-4000-8000-000000000001', 'a0000000-0000-4000-8000-000000000001', 'a0000000-0000-4000-8000-000000000103',
    4, 'Knalpot agak keras', 'Motor terawat, finishing hitam rapi. Knalpot aftermarket agak keras di residensial, sudah diinformasikan seller. Overall puas untuk harian Jakarta.', 'published',
    'MTD-D0003', 'Harley-Davidson Sportster 883 Custom', 'Dewi Lestari',
    now() - interval '3 days'
  ),
  (
    'd0000000-0000-4000-8000-000000000004', 'c0000000-0000-4000-8000-000000000004', 'b0000000-0000-4000-8000-000000000001', 'a0000000-0000-4000-8000-000000000001', 'a0000000-0000-4000-8000-000000000104',
    5, NULL, 'Seller responsif saat diminta foto detail mesin dan rantai. Transaksi lewat alur Motodo terasa jelas. Rekomendasi untuk yang cari Sportster custom.', 'published',
    'MTD-D0004', 'Harley-Davidson Sportster 883 Custom', 'Fajar Nugroho',
    now() - interval '4 days'
  ),
  (
    'd0000000-0000-4000-8000-000000000005', 'c0000000-0000-4000-8000-000000000005', 'b0000000-0000-4000-8000-000000000001', 'a0000000-0000-4000-8000-000000000001', 'a0000000-0000-4000-8000-000000000105',
    5, 'Siap touring singkat', 'Test sit di showroom, posisi duduk nyaman. Ban masih tebal. Bukan klaim bebas tabrakan, tapi kondisi sesuai yang dijelaskan demo seller.', 'published',
    'MTD-D0005', 'Harley-Davidson Sportster 883 Custom', 'Reza Mahendra',
    now() - interval '5 days'
  ),
  (
    'd0000000-0000-4000-8000-000000000006', 'c0000000-0000-4000-8000-000000000006', 'b0000000-0000-4000-8000-000000000002', 'a0000000-0000-4000-8000-000000000004', 'a0000000-0000-4000-8000-000000000106',
    5, 'Heritage yang halus', 'T120 2022 terasa baru. Mesin 1.200 cc halus, cat hijau utuh. Buku servis ditunjukkan. Cocok untuk touring Bandung.', 'published',
    'MTD-D0006', 'Triumph Bonneville T120', 'Arif Ramadhan',
    now() - interval '6 days'
  ),
  (
    'd0000000-0000-4000-8000-000000000007', 'c0000000-0000-4000-8000-000000000007', 'b0000000-0000-4000-8000-000000000002', 'a0000000-0000-4000-8000-000000000004', 'a0000000-0000-4000-8000-000000000107',
    5, NULL, 'Seller di Dago sabar jelaskan perbedaan T120 dan Street Twin. Foto listing akurat. Handling nyaman di tanjakan.', 'published',
    'MTD-D0007', 'Triumph Bonneville T120', 'Dimas Saputra',
    now() - interval '7 days'
  ),
  (
    'd0000000-0000-4000-8000-000000000008', 'c0000000-0000-4000-8000-000000000008', 'b0000000-0000-4000-8000-000000000002', 'a0000000-0000-4000-8000-000000000004', 'a0000000-0000-4000-8000-000000000108',
    4, 'Harga sesuai spek', 'Kilometer 4.200 masih rendah. Ada baret halus di sliders, sudah disebutkan. Komunikasi baik, tidak terburu-buru.', 'published',
    'MTD-D0008', 'Triumph Bonneville T120', 'Yoga Pranata',
    now() - interval '8 days'
  ),
  (
    'd0000000-0000-4000-8000-000000000009', 'c0000000-0000-4000-8000-000000000009', 'b0000000-0000-4000-8000-000000000002', 'a0000000-0000-4000-8000-000000000004', 'a0000000-0000-4000-8000-000000000109',
    5, 'Dokumen rapi', 'STNK dan BPKB sesuai catatan demo seller. Rem dan ban masih oke. Pengalaman koordinasi pengiriman dibahas jujur: diatur dengan seller.', 'published',
    'MTD-D0009', 'Triumph Bonneville T120', 'Sinta Wulandari',
    now() - interval '9 days'
  ),
  (
    'd0000000-0000-4000-8000-000000000010', 'c0000000-0000-4000-8000-000000000010', 'b0000000-0000-4000-8000-000000000003', 'a0000000-0000-4000-8000-000000000004', 'a0000000-0000-4000-8000-000000000110',
    5, 'Karakter Enfield', 'Classic 350 sesuai selera santai. Getaran mesin wajar, bukan cacat. 14.200 km terasa masuk akal untuk 2020.', 'published',
    'MTD-D0010', 'Royal Enfield Classic 350', 'Budi Hartono',
    now() - interval '10 days'
  ),
  (
    'd0000000-0000-4000-8000-000000000011', 'c0000000-0000-4000-8000-000000000011', 'b0000000-0000-4000-8000-000000000003', 'a0000000-0000-4000-8000-000000000004', 'a0000000-0000-4000-8000-000000000111',
    4, NULL, 'Bagus untuk harian kota. Starter dan kelistrikan normal. Jok agak keras untuk jarak jauh — sudah dikasih tahu.', 'published',
    'MTD-D0011', 'Royal Enfield Classic 350', 'Maya Kusuma',
    now() - interval '11 days'
  ),
  (
    'd0000000-0000-4000-8000-000000000012', 'c0000000-0000-4000-8000-000000000012', 'b0000000-0000-4000-8000-000000000003', 'a0000000-0000-4000-8000-000000000004', 'a0000000-0000-4000-8000-000000000112',
    5, 'Jujur soal tromol', 'Seller bilang rem belakang perlu dicek saat inspeksi, dan memang begitu. Saya appreciate kejujuran itu.', 'published',
    'MTD-D0012', 'Royal Enfield Classic 350', 'Eko Wijaya',
    now() - interval '12 days'
  ),
  (
    'd0000000-0000-4000-8000-000000000013', 'c0000000-0000-4000-8000-000000000013', 'b0000000-0000-4000-8000-000000000003', 'a0000000-0000-4000-8000-000000000004', 'a0000000-0000-4000-8000-000000000101',
    3, 'Perlu penyetelan', 'Motor hidup dan dokumen ada, tapi karburasi/idle masih perlu disetel ulang. Harga masih masuk untuk kondisi Good.', 'published',
    'MTD-D0013', 'Royal Enfield Classic 350', 'Rizky Pratama',
    now() - interval '13 days'
  ),
  (
    'd0000000-0000-4000-8000-000000000014', 'c0000000-0000-4000-8000-000000000014', 'b0000000-0000-4000-8000-000000000004', 'a0000000-0000-4000-8000-000000000002', 'a0000000-0000-4000-8000-000000000102',
    5, 'Chopper ringan', 'W175 custom tampilannya lebih besar dari spek 177 cc. Ringan dikendarai. Setang aftermarket terpasang rapi.', 'published',
    'MTD-D0014', 'Kawasaki W175 Custom', 'Andi Setiawan',
    now() - interval '14 days'
  ),
  (
    'd0000000-0000-4000-8000-000000000015', 'c0000000-0000-4000-8000-000000000015', 'b0000000-0000-4000-8000-000000000004', 'a0000000-0000-4000-8000-000000000002', 'a0000000-0000-4000-8000-000000000103',
    4, NULL, 'Cocok pameran kampus. Rantai sudah diganti. Cat custom ada goresan kecil di swingarm, sesuai foto close-up.', 'published',
    'MTD-D0015', 'Kawasaki W175 Custom', 'Dewi Lestari',
    now() - interval '15 days'
  ),
  (
    'd0000000-0000-4000-8000-000000000016', 'c0000000-0000-4000-8000-000000000016', 'b0000000-0000-4000-8000-000000000004', 'a0000000-0000-4000-8000-000000000002', 'a0000000-0000-4000-8000-000000000104',
    5, 'Irit dalam kota', 'Seller jelaskan perawatan sederhana. Surat lengkap. Komunikasi WhatsApp setelah chat Motodo juga jelas — tetap lewat alur yang disepakati.', 'published',
    'MTD-D0016', 'Kawasaki W175 Custom', 'Fajar Nugroho',
    now() - interval '16 days'
  ),
  (
    'd0000000-0000-4000-8000-000000000017', 'c0000000-0000-4000-8000-000000000017', 'b0000000-0000-4000-8000-000000000005', 'a0000000-0000-4000-8000-000000000002', 'a0000000-0000-4000-8000-000000000105',
    5, 'Pemula friendly', 'Rebel 500 2023 mudah dikendarai. 3.100 km, mesin 471 cc halus. Posisi duduk rendah pas buat saya.', 'published',
    'MTD-D0017', 'Honda Rebel 500', 'Reza Mahendra',
    now() - interval '17 days'
  ),
  (
    'd0000000-0000-4000-8000-000000000018', 'c0000000-0000-4000-8000-000000000018', 'b0000000-0000-4000-8000-000000000005', 'a0000000-0000-4000-8000-000000000002', 'a0000000-0000-4000-8000-000000000106',
    5, NULL, 'Matte black rapi, ABS normal. Seller Jakarta Custom Works responsif soal pajak. Foto sesuai unit.', 'published',
    'MTD-D0018', 'Honda Rebel 500', 'Arif Ramadhan',
    now() - interval '18 days'
  ),
  (
    'd0000000-0000-4000-8000-000000000019', 'c0000000-0000-4000-8000-000000000019', 'b0000000-0000-4000-8000-000000000005', 'a0000000-0000-4000-8000-000000000002', 'a0000000-0000-4000-8000-000000000107',
    4, 'Sedikit baret sandaran', 'Ada baret halus di passenger pad. Disebutkan di chat. Selebihnya seperti motor hampir baru.', 'published',
    'MTD-D0019', 'Honda Rebel 500', 'Dimas Saputra',
    now() - interval '19 days'
  ),
  (
    'd0000000-0000-4000-8000-000000000020', 'c0000000-0000-4000-8000-000000000020', 'b0000000-0000-4000-8000-000000000005', 'a0000000-0000-4000-8000-000000000002', 'a0000000-0000-4000-8000-000000000108',
    5, 'Irit dan rapi', 'Test ride singkat di area Radio Dalam. Kopling ringan. Rekomendasi buat pindahan dari motor 150.', 'published',
    'MTD-D0020', 'Honda Rebel 500', 'Yoga Pranata',
    now() - interval '20 days'
  ),
  (
    'd0000000-0000-4000-8000-000000000021', 'c0000000-0000-4000-8000-000000000021', 'b0000000-0000-4000-8000-000000000006', 'a0000000-0000-4000-8000-000000000005', 'a0000000-0000-4000-8000-000000000109',
    5, 'Lincah di Bali', 'XSR 155 brat pas untuk Denpasar. 7.600 km, mesin 155 terawat. Stang cafe terasa pas.', 'published',
    'MTD-D0021', 'Yamaha XSR 155', 'Sinta Wulandari',
    now() - interval '21 days'
  ),
  (
    'd0000000-0000-4000-8000-000000000022', 'c0000000-0000-4000-8000-000000000022', 'b0000000-0000-4000-8000-000000000006', 'a0000000-0000-4000-8000-000000000005', 'a0000000-0000-4000-8000-000000000110',
    4, NULL, 'Ban masih oke musim kemarau. Spakbor pendek, air hujan perlu hati-hati — seller sudah ingatkan.', 'published',
    'MTD-D0022', 'Yamaha XSR 155', 'Budi Hartono',
    now() - interval '22 days'
  ),
  (
    'd0000000-0000-4000-8000-000000000023', 'c0000000-0000-4000-8000-000000000023', 'b0000000-0000-4000-8000-000000000006', 'a0000000-0000-4000-8000-000000000005', 'a0000000-0000-4000-8000-000000000111',
    5, 'Alasan jual masuk akal', 'Seller ganti ke 650, unit ini dirawat. Harga sesuai spek. Chat cepat.', 'published',
    'MTD-D0023', 'Yamaha XSR 155', 'Maya Kusuma',
    now() - interval '23 days'
  ),
  (
    'd0000000-0000-4000-8000-000000000024', 'c0000000-0000-4000-8000-000000000024', 'b0000000-0000-4000-8000-000000000007', 'a0000000-0000-4000-8000-000000000003', 'a0000000-0000-4000-8000-000000000112',
    5, 'Scrambler ramah', '803 cc tidak terasa galak. 5.400 km, kuning ikonik utuh. Idle stabil.', 'published',
    'MTD-D0024', 'Ducati Scrambler Icon', 'Eko Wijaya',
    now() - interval '24 days'
  ),
  (
    'd0000000-0000-4000-8000-000000000025', 'c0000000-0000-4000-8000-000000000025', 'b0000000-0000-4000-8000-000000000007', 'a0000000-0000-4000-8000-000000000003', 'a0000000-0000-4000-8000-000000000101',
    4, 'Servis perlu dicek', 'Buku servis ada. Satu record tinggal di dealer lain, seller jelaskan. Tidak ada kejutan besar.', 'published',
    'MTD-D0025', 'Ducati Scrambler Icon', 'Rizky Pratama',
    now() - interval '25 days'
  ),
  (
    'd0000000-0000-4000-8000-000000000026', 'c0000000-0000-4000-8000-000000000026', 'b0000000-0000-4000-8000-000000000007', 'a0000000-0000-4000-8000-000000000003', 'a0000000-0000-4000-8000-000000000102',
    5, NULL, 'Ban tebal, rem enak. Showroom Surabaya rapi. Koordinasi lihat unit mudah.', 'published',
    'MTD-D0026', 'Ducati Scrambler Icon', 'Andi Setiawan',
    now() - interval '26 days'
  ),
  (
    'd0000000-0000-4000-8000-000000000027', 'c0000000-0000-4000-8000-000000000027', 'b0000000-0000-4000-8000-000000000008', 'a0000000-0000-4000-8000-000000000003', 'a0000000-0000-4000-8000-000000000103',
    5, 'Boxer touring', 'R nineT 1.170 cc terasa kokoh. 8.900 km wajar untuk 2020. Finishing aluminium bagus.', 'published',
    'MTD-D0027', 'BMW R nineT', 'Dewi Lestari',
    now() - interval '27 days'
  ),
  (
    'd0000000-0000-4000-8000-000000000028', 'c0000000-0000-4000-8000-000000000028', 'b0000000-0000-4000-8000-000000000008', 'a0000000-0000-4000-8000-000000000003', 'a0000000-0000-4000-8000-000000000104',
    4, NULL, 'Motor besar, tidak untuk pemula. Seller jujur soal itu. Inspeksi disarankan dan saya setuju.', 'published',
    'MTD-D0028', 'BMW R nineT', 'Fajar Nugroho',
    now() - interval '28 days'
  ),
  (
    'd0000000-0000-4000-8000-000000000029', 'c0000000-0000-4000-8000-000000000029', 'b0000000-0000-4000-8000-000000000009', 'a0000000-0000-4000-8000-000000000001', 'a0000000-0000-4000-8000-000000000105',
    5, 'Dark custom pas', 'Iron 883 knalpot aftermarket suaranya dalam. 12.100 km, mesin kering.', 'published',
    'MTD-D0029', 'Harley-Davidson Iron 883', 'Reza Mahendra',
    now() - interval '29 days'
  ),
  (
    'd0000000-0000-4000-8000-000000000030', 'c0000000-0000-4000-8000-000000000030', 'b0000000-0000-4000-8000-000000000009', 'a0000000-0000-4000-8000-000000000001', 'a0000000-0000-4000-8000-000000000106',
    4, 'Kopling khas Sportster', 'Berat di macet, sudah diingatkan. Selebihnya sesuai listing denim black.', 'published',
    'MTD-D0030', 'Harley-Davidson Iron 883', 'Arif Ramadhan',
    now() - interval '30 days'
  ),
  (
    'd0000000-0000-4000-8000-000000000031', 'c0000000-0000-4000-8000-000000000031', 'b0000000-0000-4000-8000-000000000009', 'a0000000-0000-4000-8000-000000000001', 'a0000000-0000-4000-8000-000000000107',
    5, NULL, 'Dokumen lengkap. Seller Kemang bantu foto detail mesin malam hari.', 'published',
    'MTD-D0031', 'Harley-Davidson Iron 883', 'Dimas Saputra',
    now() - interval '31 days'
  ),
  (
    'd0000000-0000-4000-8000-000000000032', 'c0000000-0000-4000-8000-000000000032', 'b0000000-0000-4000-8000-000000000010', 'a0000000-0000-4000-8000-000000000004', 'a0000000-0000-4000-8000-000000000108',
    5, 'Nyaman macet Bandung', 'Street Twin 900 cc torsi rendah enak. 6.700 km. Cat merah rapi.', 'published',
    'MTD-D0032', 'Triumph Street Twin', 'Yoga Pranata',
    now() - interval '32 days'
  ),
  (
    'd0000000-0000-4000-8000-000000000033', 'c0000000-0000-4000-8000-000000000033', 'b0000000-0000-4000-8000-000000000010', 'a0000000-0000-4000-8000-000000000004', 'a0000000-0000-4000-8000-000000000109',
    4, NULL, 'Spion aftermarket sedikit goyang di lubang. Seller sudah mention. Harga pas.', 'published',
    'MTD-D0033', 'Triumph Street Twin', 'Sinta Wulandari',
    now() - interval '33 days'
  ),
  (
    'd0000000-0000-4000-8000-000000000034', 'c0000000-0000-4000-8000-000000000034', 'b0000000-0000-4000-8000-000000000010', 'a0000000-0000-4000-8000-000000000004', 'a0000000-0000-4000-8000-000000000110',
    5, 'Naik dari 150cc', 'Saya pindah dari motor kecil, seller sabar jelaskan kopling. Test di Dago membantu.', 'published',
    'MTD-D0034', 'Triumph Street Twin', 'Budi Hartono',
    now() - interval '34 days'
  ),
  (
    'd0000000-0000-4000-8000-000000000035', 'c0000000-0000-4000-8000-000000000035', 'b0000000-0000-4000-8000-000000000011', 'a0000000-0000-4000-8000-000000000005', 'a0000000-0000-4000-8000-000000000111',
    5, 'Twin 650 rendah km', 'Interceptor 2.800 km terasa baru. Orange cerah, knalpot stock berkarakter.', 'published',
    'MTD-D0035', 'Royal Enfield Interceptor 650', 'Maya Kusuma',
    now() - interval '35 days'
  ),
  (
    'd0000000-0000-4000-8000-000000000036', 'c0000000-0000-4000-8000-000000000036', 'b0000000-0000-4000-8000-000000000011', 'a0000000-0000-4000-8000-000000000005', 'a0000000-0000-4000-8000-000000000112',
    5, NULL, 'Cocok touring Ubud. Posisi duduk tegak. Seller Bali responsif soal pengiriman kapal — dibahas sebagai koordinasi, bukan tarif pasti.', 'published',
    'MTD-D0036', 'Royal Enfield Interceptor 650', 'Eko Wijaya',
    now() - interval '36 days'
  ),
  (
    'd0000000-0000-4000-8000-000000000037', 'c0000000-0000-4000-8000-000000000037', 'b0000000-0000-4000-8000-000000000011', 'a0000000-0000-4000-8000-000000000005', 'a0000000-0000-4000-8000-000000000101',
    4, 'Kaca spion getar', 'Getaran spion di 80 km/jam. Hal biasa di twin ini. Unit bersih.', 'published',
    'MTD-D0037', 'Royal Enfield Interceptor 650', 'Rizky Pratama',
    now() - interval '37 days'
  ),
  (
    'd0000000-0000-4000-8000-000000000038', 'c0000000-0000-4000-8000-000000000038', 'b0000000-0000-4000-8000-000000000012', 'a0000000-0000-4000-8000-000000000003', 'a0000000-0000-4000-8000-000000000102',
    5, 'Z1 vibe', 'Z900RS kuning 2022, 4.100 km. Empat silinder halus, gaya retro kuat.', 'published',
    'MTD-D0038', 'Kawasaki Z900RS', 'Andi Setiawan',
    now() - interval '38 days'
  ),
  (
    'd0000000-0000-4000-8000-000000000039', 'c0000000-0000-4000-8000-000000000039', 'b0000000-0000-4000-8000-000000000012', 'a0000000-0000-4000-8000-000000000003', 'a0000000-0000-4000-8000-000000000103',
    4, NULL, 'Performanya lebih dari cukup untuk tol. Seller tidak overclaim dealer resmi. Suka kejujuran itu.', 'published',
    'MTD-D0039', 'Kawasaki Z900RS', 'Dewi Lestari',
    now() - interval '39 days'
  ),
  (
    'd0000000-0000-4000-8000-000000000040', 'c0000000-0000-4000-8000-000000000040', 'b0000000-0000-4000-8000-000000000013', 'a0000000-0000-4000-8000-000000000003', 'a0000000-0000-4000-8000-000000000104',
    5, 'Four cylinder halus', 'CB650R 649 cc sesuai deskripsi. 9.200 km, grey rapi.', 'published',
    'MTD-D0040', 'Honda CB650R', 'Fajar Nugroho',
    now() - interval '40 days'
  ),
  (
    'd0000000-0000-4000-8000-000000000041', 'c0000000-0000-4000-8000-000000000041', 'b0000000-0000-4000-8000-000000000013', 'a0000000-0000-4000-8000-000000000003', 'a0000000-0000-4000-8000-000000000105',
    4, 'Baret sliders', 'Ada baret halus, sesuai usia 2021. Tidak mengganggu. Chat seller jelas.', 'published',
    'MTD-D0041', 'Honda CB650R', 'Reza Mahendra',
    now() - interval '41 days'
  ),
  (
    'd0000000-0000-4000-8000-000000000042', 'c0000000-0000-4000-8000-000000000042', 'b0000000-0000-4000-8000-000000000013', 'a0000000-0000-4000-8000-000000000003', 'a0000000-0000-4000-8000-000000000106',
    5, NULL, 'Handling netral Surabaya–Malang. Rem dan rantai masih nyaman.', 'published',
    'MTD-D0042', 'Honda CB650R', 'Arif Ramadhan',
    now() - interval '42 days'
  ),
  (
    'd0000000-0000-4000-8000-000000000043', 'c0000000-0000-4000-8000-000000000043', 'b0000000-0000-4000-8000-000000000014', 'a0000000-0000-4000-8000-000000000002', 'a0000000-0000-4000-8000-000000000107',
    5, 'Bukan motor pemula', 'MT-09 890 cc sesuai peringatan seller. Torsi triple terasa. 5.800 km.', 'published',
    'MTD-D0043', 'Yamaha MT-09', 'Dimas Saputra',
    now() - interval '43 days'
  ),
  (
    'd0000000-0000-4000-8000-000000000044', 'c0000000-0000-4000-8000-000000000044', 'b0000000-0000-4000-8000-000000000014', 'a0000000-0000-4000-8000-000000000002', 'a0000000-0000-4000-8000-000000000108',
    4, NULL, 'Tuas rem aftermarket terpasang rapi. Ban masih grip. Harga negotiable dalam batas wajar.', 'published',
    'MTD-D0044', 'Yamaha MT-09', 'Yoga Pranata',
    now() - interval '44 days'
  ),
  (
    'd0000000-0000-4000-8000-000000000045', 'c0000000-0000-4000-8000-000000000045', 'b0000000-0000-4000-8000-000000000014', 'a0000000-0000-4000-8000-000000000002', 'a0000000-0000-4000-8000-000000000109',
    5, 'Showroom Radio Dalam', 'Penjelasan mesin jujur. Tidak dipaksa closing. Foto listing akurat.', 'published',
    'MTD-D0045', 'Yamaha MT-09', 'Sinta Wulandari',
    now() - interval '45 days'
  ),
  (
    'd0000000-0000-4000-8000-000000000046', 'c0000000-0000-4000-8000-000000000046', 'b0000000-0000-4000-8000-000000000015', 'a0000000-0000-4000-8000-000000000003', 'a0000000-0000-4000-8000-000000000110',
    5, 'Cruiser kilometer rendah', 'R 18 1.802 cc, 3.600 km, hitam mengkilap. Presentasi premium.', 'published',
    'MTD-D0046', 'BMW R 18', 'Budi Hartono',
    now() - interval '46 days'
  ),
  (
    'd0000000-0000-4000-8000-000000000047', 'c0000000-0000-4000-8000-000000000047', 'b0000000-0000-4000-8000-000000000015', 'a0000000-0000-4000-8000-000000000003', 'a0000000-0000-4000-8000-000000000111',
    4, 'Tidak untuk gang sempit', 'Seller tekankan itu. Benar. Untuk yang paham cruiser besar, unitnya rapi.', 'published',
    'MTD-D0047', 'BMW R 18', 'Maya Kusuma',
    now() - interval '47 days'
  ),
  (
    'd0000000-0000-4000-8000-000000000048', 'c0000000-0000-4000-8000-000000000048', 'b0000000-0000-4000-8000-000000000016', 'a0000000-0000-4000-8000-000000000001', 'a0000000-0000-4000-8000-000000000112',
    5, 'Fat tank ikonik', 'Forty-Eight 1.202 cc, orange, 10.200 km. Pelek 16 sesuai foto.', 'published',
    'MTD-D0048', 'Harley-Davidson Forty-Eight', 'Eko Wijaya',
    now() - interval '48 days'
  ),
  (
    'd0000000-0000-4000-8000-000000000049', 'c0000000-0000-4000-8000-000000000049', 'b0000000-0000-4000-8000-000000000016', 'a0000000-0000-4000-8000-000000000001', 'a0000000-0000-4000-8000-000000000101',
    4, NULL, 'Exhaust aftermarket keras. Sudah diinformasikan. Mesin lebih berisi dari 883.', 'published',
    'MTD-D0049', 'Harley-Davidson Forty-Eight', 'Rizky Pratama',
    now() - interval '49 days'
  ),
  (
    'd0000000-0000-4000-8000-000000000050', 'c0000000-0000-4000-8000-000000000050', 'b0000000-0000-4000-8000-000000000016', 'a0000000-0000-4000-8000-000000000001', 'a0000000-0000-4000-8000-000000000102',
    5, 'Inspeksi Kemang', 'Datang langsung, rantai dan oli ditunjukkan. Proses Motodo jelas.', 'published',
    'MTD-D0050', 'Harley-Davidson Forty-Eight', 'Andi Setiawan',
    now() - interval '50 days'
  ),
  (
    'd0000000-0000-4000-8000-000000000051', 'c0000000-0000-4000-8000-000000000051', 'b0000000-0000-4000-8000-000000000017', 'a0000000-0000-4000-8000-000000000002', 'a0000000-0000-4000-8000-000000000103',
    5, 'Single seat bersih', 'Bobber 1.200 cc tampilan pabrik. 4.700 km. Posisi rendah nyaman.', 'published',
    'MTD-D0051', 'Triumph Bonneville Bobber', 'Dewi Lestari',
    now() - interval '51 days'
  ),
  (
    'd0000000-0000-4000-8000-000000000052', 'c0000000-0000-4000-8000-000000000052', 'b0000000-0000-4000-8000-000000000017', 'a0000000-0000-4000-8000-000000000002', 'a0000000-0000-4000-8000-000000000104',
    5, NULL, 'Cat hitam rapi, chrome minim baret. Seller jelaskan alasan ganti dual seat.', 'published',
    'MTD-D0052', 'Triumph Bonneville Bobber', 'Fajar Nugroho',
    now() - interval '52 days'
  ),
  (
    'd0000000-0000-4000-8000-000000000053', 'c0000000-0000-4000-8000-000000000053', 'b0000000-0000-4000-8000-000000000017', 'a0000000-0000-4000-8000-000000000002', 'a0000000-0000-4000-8000-000000000105',
    4, 'Bukan untuk boncenger jauh', 'Jelas dari konsepnya. Harian solo sangat pas.', 'published',
    'MTD-D0053', 'Triumph Bonneville Bobber', 'Reza Mahendra',
    now() - interval '53 days'
  ),
  (
    'd0000000-0000-4000-8000-000000000054', 'c0000000-0000-4000-8000-000000000054', 'b0000000-0000-4000-8000-000000000018', 'a0000000-0000-4000-8000-000000000005', 'a0000000-0000-4000-8000-000000000106',
    5, 'Cafe pesisir', 'GT 650 clip-on, 6.100 km, merah. Pas buat Sanur sore hari.', 'published',
    'MTD-D0054', 'Royal Enfield Continental GT 650', 'Arif Ramadhan',
    now() - interval '54 days'
  ),
  (
    'd0000000-0000-4000-8000-000000000055', 'c0000000-0000-4000-8000-000000000055', 'b0000000-0000-4000-8000-000000000018', 'a0000000-0000-4000-8000-000000000005', 'a0000000-0000-4000-8000-000000000107',
    4, 'Clip-on butuh biasa', 'Leher pegal di jam pertama, seller sudah kasih tahu. Mesin twin terawat.', 'published',
    'MTD-D0055', 'Royal Enfield Continental GT 650', 'Dimas Saputra',
    now() - interval '55 days'
  ),
  (
    'd0000000-0000-4000-8000-000000000056', 'c0000000-0000-4000-8000-000000000056', 'b0000000-0000-4000-8000-000000000018', 'a0000000-0000-4000-8000-000000000005', 'a0000000-0000-4000-8000-000000000108',
    5, NULL, 'Bukan touring jauh, sesuai deskripsi. Chat Urban Rider cepat.', 'published',
    'MTD-D0056', 'Royal Enfield Continental GT 650', 'Yoga Pranata',
    now() - interval '56 days'
  )
ON CONFLICT (id) DO UPDATE SET
  order_id = EXCLUDED.order_id,
  listing_id = EXCLUDED.listing_id,
  seller_id = EXCLUDED.seller_id,
  buyer_id = EXCLUDED.buyer_id,
  rating = EXCLUDED.rating,
  title = EXCLUDED.title,
  body = EXCLUDED.body,
  status = 'published',
  order_number = EXCLUDED.order_number,
  listing_name = EXCLUDED.listing_name,
  buyer_display_name = EXCLUDED.buyer_display_name
WHERE public.reviews.listing_id IN (SELECT id FROM public.listings WHERE is_demo = true);


ALTER TABLE public.seller_profiles ENABLE TRIGGER notify_on_seller_profile_change;
ALTER TABLE public.listings ENABLE TRIGGER protect_listing_columns;
ALTER TABLE public.seller_profiles ENABLE TRIGGER protect_seller_profile_columns;
ALTER TABLE public.orders ENABLE TRIGGER notify_on_order_change;

COMMIT;

-- Optional validation (run after COMMIT, separately):
-- SELECT COUNT(*) FILTER (WHERE is_demo) AS demo_listings FROM public.listings;
-- SELECT COUNT(*) FILTER (WHERE is_demo) AS demo_sellers FROM public.seller_profiles;
-- SELECT COUNT(*) FROM public.reviews r JOIN public.listings l ON l.id = r.listing_id WHERE l.is_demo;
-- SELECT COUNT(*) FROM public.listing_images i JOIN public.listings l ON l.id = i.listing_id WHERE l.is_demo;

-- =============================================================================
-- Safe deletion (DEMO ONLY). Run separately when you want to remove demo data.
--
-- BEGIN;
-- DELETE FROM public.reviews
-- WHERE listing_id IN (SELECT id FROM public.listings WHERE is_demo = true);
-- DELETE FROM public.orders
-- WHERE listing_id IN (SELECT id FROM public.listings WHERE is_demo = true)
--    OR buyer_id IN (SELECT id FROM public.profiles WHERE is_demo = true);
-- DELETE FROM public.listing_images
-- WHERE listing_id IN (SELECT id FROM public.listings WHERE is_demo = true);
-- DELETE FROM public.listings WHERE is_demo = true;
-- DELETE FROM public.seller_profiles WHERE is_demo = true;
-- DELETE FROM public.profiles WHERE is_demo = true;
-- DELETE FROM auth.identities
-- WHERE user_id IN (SELECT id FROM auth.users WHERE email LIKE '%@demo.motodo.id');
-- DELETE FROM auth.users WHERE email LIKE '%@demo.motodo.id';
-- COMMIT;
-- =============================================================================
