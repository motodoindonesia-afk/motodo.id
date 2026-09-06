-- Motodo.id Phase D — listings + listing_images
-- Apply in the Supabase SQL editor or CLI. Do not run from the Vite app.

CREATE TABLE IF NOT EXISTS public.listings (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  seller_id uuid NOT NULL REFERENCES public.seller_profiles (id) ON DELETE CASCADE,
  name text NOT NULL,
  brand text NOT NULL,
  model text,
  category text NOT NULL,
  price numeric(15, 2) NOT NULL CHECK (price >= 0),
  condition text,
  year integer CHECK (
    year IS NULL
    OR (year >= 1900 AND year <= (EXTRACT(YEAR FROM now())::integer + 1))
  ),
  mileage integer CHECK (mileage IS NULL OR mileage >= 0),
  engine text,
  transmission text,
  fuel text,
  color text,
  city text,
  location text,
  showroom_address text,
  description text,
  quantity integer NOT NULL DEFAULT 1 CHECK (quantity >= 0),
  status text NOT NULL DEFAULT 'draft' CHECK (status IN ('draft', 'active', 'sold')),
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS listings_seller_id_idx ON public.listings (seller_id);
CREATE INDEX IF NOT EXISTS listings_status_idx ON public.listings (status);

COMMENT ON TABLE public.listings IS 'Motorcycle listings. seller_id = seller_profiles.id = auth.users.id.';
COMMENT ON COLUMN public.listings.quantity IS 'Total inventory. Reservations stay in the app until the orders phase.';
COMMENT ON COLUMN public.listings.status IS 'draft | active | sold. Active insert/update requires an approved seller.';

CREATE TABLE IF NOT EXISTS public.listing_images (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  listing_id uuid NOT NULL REFERENCES public.listings (id) ON DELETE CASCADE,
  storage_path text NOT NULL,
  public_url text,
  sort_order integer NOT NULL DEFAULT 0 CHECK (sort_order >= 0),
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (listing_id, storage_path)
);

CREATE INDEX IF NOT EXISTS listing_images_listing_id_idx ON public.listing_images (listing_id, sort_order);

COMMENT ON TABLE public.listing_images IS 'Image metadata only. Binary files live in Storage bucket listing-images.';

CREATE OR REPLACE FUNCTION public.set_listings_updated_at()
RETURNS trigger
LANGUAGE plpgsql
AS $$
BEGIN
  NEW.updated_at := now();
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS listings_set_updated_at ON public.listings;
CREATE TRIGGER listings_set_updated_at
  BEFORE UPDATE ON public.listings
  FOR EACH ROW
  EXECUTE FUNCTION public.set_listings_updated_at();

CREATE OR REPLACE FUNCTION public.is_approved_seller()
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.seller_profiles
    WHERE id = auth.uid() AND seller_status = 'approved'
  );
$$;

CREATE OR REPLACE FUNCTION public.owns_listing(p_listing_id uuid)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.listings
    WHERE id = p_listing_id AND seller_id = auth.uid()
  );
$$;

REVOKE ALL ON FUNCTION public.is_approved_seller() FROM PUBLIC;
REVOKE ALL ON FUNCTION public.owns_listing(uuid) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.is_admin() TO anon, authenticated;
GRANT EXECUTE ON FUNCTION public.is_approved_seller() TO anon, authenticated;
GRANT EXECUTE ON FUNCTION public.owns_listing(uuid) TO anon, authenticated;

-- Force seller_id = auth.uid() for non-admins. Block active status unless approved.
CREATE OR REPLACE FUNCTION public.protect_listing_columns()
RETURNS trigger
LANGUAGE plpgsql
AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    IF NOT public.is_admin() THEN
      IF auth.uid() IS NULL THEN
        RAISE EXCEPTION 'not authenticated';
      END IF;
      NEW.seller_id := auth.uid();
      IF NEW.status = 'active' AND NOT public.is_approved_seller() THEN
        RAISE EXCEPTION 'only approved sellers can publish active listings';
      END IF;
      IF NEW.status IS DISTINCT FROM 'draft'
        AND NEW.status IS DISTINCT FROM 'active'
        AND NEW.status IS DISTINCT FROM 'sold'
      THEN
        NEW.status := 'draft';
      END IF;
      IF NOT public.is_approved_seller() THEN
        RAISE EXCEPTION 'only approved sellers can create listings';
      END IF;
    END IF;
    RETURN NEW;
  END IF;

  NEW.seller_id := OLD.seller_id;
  NEW.id := OLD.id;

  IF public.is_admin() THEN
    RETURN NEW;
  END IF;

  IF auth.uid() IS NULL OR auth.uid() IS DISTINCT FROM OLD.seller_id THEN
    RAISE EXCEPTION 'not authorized to update this listing';
  END IF;

  IF NEW.status = 'active' AND NOT public.is_approved_seller() THEN
    RAISE EXCEPTION 'only approved sellers can publish active listings';
  END IF;

  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS protect_listing_columns ON public.listings;
CREATE TRIGGER protect_listing_columns
  BEFORE INSERT OR UPDATE ON public.listings
  FOR EACH ROW
  EXECUTE FUNCTION public.protect_listing_columns();

-- Public display fields only (not phone, NIB, rejection_reason).
CREATE OR REPLACE VIEW public.seller_listing_cards AS
SELECT id, business_name, city, created_at
FROM public.seller_profiles
WHERE seller_status = 'approved';

ALTER VIEW public.seller_listing_cards SET (security_invoker = false);
GRANT SELECT ON public.seller_listing_cards TO anon, authenticated;

ALTER TABLE public.listings ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.listing_images ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS listings_select_public_own_admin ON public.listings;
CREATE POLICY listings_select_public_own_admin
  ON public.listings
  FOR SELECT
  TO anon, authenticated
  USING (
    status IN ('active', 'sold')
    OR seller_id = auth.uid()
    OR public.is_admin()
  );

DROP POLICY IF EXISTS listings_insert_approved_own ON public.listings;
CREATE POLICY listings_insert_approved_own
  ON public.listings
  FOR INSERT
  TO authenticated
  WITH CHECK (
    seller_id = auth.uid()
    AND public.is_approved_seller()
    AND status IN ('draft', 'active', 'sold')
  );

DROP POLICY IF EXISTS listings_update_own ON public.listings;
CREATE POLICY listings_update_own
  ON public.listings
  FOR UPDATE
  TO authenticated
  USING (seller_id = auth.uid() OR public.is_admin())
  WITH CHECK (seller_id = auth.uid() OR public.is_admin());

DROP POLICY IF EXISTS listings_delete_own ON public.listings;
CREATE POLICY listings_delete_own
  ON public.listings
  FOR DELETE
  TO authenticated
  USING (seller_id = auth.uid() OR public.is_admin());

DROP POLICY IF EXISTS listing_images_select_visible ON public.listing_images;
CREATE POLICY listing_images_select_visible
  ON public.listing_images
  FOR SELECT
  TO anon, authenticated
  USING (
    EXISTS (
      SELECT 1
      FROM public.listings l
      WHERE l.id = listing_id
        AND (
          l.status IN ('active', 'sold')
          OR l.seller_id = auth.uid()
          OR public.is_admin()
        )
    )
  );

DROP POLICY IF EXISTS listing_images_insert_own ON public.listing_images;
CREATE POLICY listing_images_insert_own
  ON public.listing_images
  FOR INSERT
  TO authenticated
  WITH CHECK (public.owns_listing(listing_id) OR public.is_admin());

DROP POLICY IF EXISTS listing_images_update_own ON public.listing_images;
CREATE POLICY listing_images_update_own
  ON public.listing_images
  FOR UPDATE
  TO authenticated
  USING (public.owns_listing(listing_id) OR public.is_admin())
  WITH CHECK (public.owns_listing(listing_id) OR public.is_admin());

DROP POLICY IF EXISTS listing_images_delete_own ON public.listing_images;
CREATE POLICY listing_images_delete_own
  ON public.listing_images
  FOR DELETE
  TO authenticated
  USING (public.owns_listing(listing_id) OR public.is_admin());

GRANT SELECT ON public.listings TO anon, authenticated;
GRANT SELECT ON public.listing_images TO anon, authenticated;
GRANT INSERT, UPDATE, DELETE ON public.listings TO authenticated;
GRANT INSERT, UPDATE, DELETE ON public.listing_images TO authenticated;

-- Storage bucket (public read of objects). If this insert is not permitted in the SQL editor,
-- create a public bucket named listing-images in Storage and apply the policies below.
INSERT INTO storage.buckets (id, name, public)
VALUES ('listing-images', 'listing-images', true)
ON CONFLICT (id) DO NOTHING;

DROP POLICY IF EXISTS listing_images_storage_select ON storage.objects;
CREATE POLICY listing_images_storage_select
  ON storage.objects
  FOR SELECT
  TO public
  USING (bucket_id = 'listing-images');

DROP POLICY IF EXISTS listing_images_storage_insert ON storage.objects;
CREATE POLICY listing_images_storage_insert
  ON storage.objects
  FOR INSERT
  TO authenticated
  WITH CHECK (
    bucket_id = 'listing-images'
    AND (storage.foldername(name))[1] = 'listings'
    AND (
      public.is_admin()
      OR (
        public.is_approved_seller()
        AND public.owns_listing(((storage.foldername(name))[2])::uuid)
      )
    )
  );

DROP POLICY IF EXISTS listing_images_storage_update ON storage.objects;
CREATE POLICY listing_images_storage_update
  ON storage.objects
  FOR UPDATE
  TO authenticated
  USING (
    bucket_id = 'listing-images'
    AND (
      public.is_admin()
      OR public.owns_listing(((storage.foldername(name))[2])::uuid)
    )
  )
  WITH CHECK (
    bucket_id = 'listing-images'
    AND (
      public.is_admin()
      OR public.owns_listing(((storage.foldername(name))[2])::uuid)
    )
  );

DROP POLICY IF EXISTS listing_images_storage_delete ON storage.objects;
CREATE POLICY listing_images_storage_delete
  ON storage.objects
  FOR DELETE
  TO authenticated
  USING (
    bucket_id = 'listing-images'
    AND (
      public.is_admin()
      OR public.owns_listing(((storage.foldername(name))[2])::uuid)
    )
  );
