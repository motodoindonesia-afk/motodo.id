-- Motodo.id — mark DEMO marketplace records
-- Apply in the Supabase SQL editor or CLI. Does not change RLS or existing row values.
-- Existing rows receive is_demo = false via the column default.

ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS is_demo boolean NOT NULL DEFAULT false;

ALTER TABLE public.seller_profiles
  ADD COLUMN IF NOT EXISTS is_demo boolean NOT NULL DEFAULT false;

ALTER TABLE public.listings
  ADD COLUMN IF NOT EXISTS is_demo boolean NOT NULL DEFAULT false;

COMMENT ON COLUMN public.profiles.is_demo IS 'DEMO DATA ONLY. Real accounts must remain false.';
COMMENT ON COLUMN public.seller_profiles.is_demo IS 'DEMO DATA ONLY. Real sellers must remain false.';
COMMENT ON COLUMN public.listings.is_demo IS 'DEMO DATA ONLY. Real listings must remain false. Child listing_images are identified via listings.is_demo.';

CREATE INDEX IF NOT EXISTS profiles_is_demo_true_idx ON public.profiles (id) WHERE is_demo;
CREATE INDEX IF NOT EXISTS seller_profiles_is_demo_true_idx ON public.seller_profiles (id) WHERE is_demo;
CREATE INDEX IF NOT EXISTS listings_is_demo_true_idx ON public.listings (id) WHERE is_demo;
