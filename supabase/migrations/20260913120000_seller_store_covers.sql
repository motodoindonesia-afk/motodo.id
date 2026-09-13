-- Motodo — seller store cover (banner) photos.
-- Safe for existing sellers: store_cover_url is nullable and defaults to NULL.
-- Storage path is stable per seller: seller-store-covers/{seller_id}/cover.webp

ALTER TABLE public.seller_profiles
  ADD COLUMN IF NOT EXISTS store_cover_url text NULL;

COMMENT ON COLUMN public.seller_profiles.store_cover_url IS
  'Public URL of the seller store cover in bucket seller-store-covers. NULL means use the Motodo fallback banner.';

CREATE OR REPLACE VIEW public.seller_listing_cards AS
SELECT id, business_name, city, created_at, store_cover_url
FROM public.seller_profiles
WHERE seller_status = 'approved';

ALTER VIEW public.seller_listing_cards SET (security_invoker = false);
GRANT SELECT ON public.seller_listing_cards TO anon, authenticated;

-- Owners may set store_cover_url only to their own cover object (or NULL).
CREATE OR REPLACE FUNCTION public.is_own_store_cover_url(p_seller_id uuid, p_url text)
RETURNS boolean
LANGUAGE sql
STABLE
SET search_path = public
AS $$
  SELECT
    p_url IS NULL
    OR btrim(p_url) = ''
    OR (
      p_seller_id IS NOT NULL
      AND split_part(split_part(p_url, '?', 1), '#', 1)
        ~ (
          '/storage/v1/object/public/seller-store-covers/'
          || p_seller_id::text
          || '/cover\.webp$'
        )
    );
$$;

REVOKE ALL ON FUNCTION public.is_own_store_cover_url(uuid, text) FROM PUBLIC, anon, authenticated;

CREATE OR REPLACE FUNCTION public.protect_seller_profile_columns()
RETURNS trigger
LANGUAGE plpgsql
AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    IF NOT public.is_admin() THEN
      IF auth.uid() IS NULL THEN
        RAISE EXCEPTION 'not authenticated';
      END IF;
      NEW.id := auth.uid();
      NEW.seller_status := 'pending';
      NEW.rejection_reason := NULL;
      NEW.store_cover_url := NULL;
    END IF;
    RETURN NEW;
  END IF;

  NEW.id := OLD.id;

  IF public.is_admin() THEN
    RETURN NEW;
  END IF;

  IF auth.uid() IS NULL OR auth.uid() IS DISTINCT FROM OLD.id THEN
    RAISE EXCEPTION 'not authorized to update this seller profile';
  END IF;

  IF NEW.seller_status IS DISTINCT FROM OLD.seller_status THEN
    IF NOT (OLD.seller_status = 'rejected' AND NEW.seller_status = 'pending') THEN
      RAISE EXCEPTION 'seller_status cannot be changed by the seller';
    END IF;
    NEW.rejection_reason := NULL;
  ELSIF NEW.rejection_reason IS DISTINCT FROM OLD.rejection_reason THEN
    RAISE EXCEPTION 'rejection_reason cannot be changed by the seller';
  END IF;

  IF NEW.store_cover_url IS DISTINCT FROM OLD.store_cover_url THEN
    IF NEW.store_cover_url IS NOT NULL AND btrim(NEW.store_cover_url) = '' THEN
      NEW.store_cover_url := NULL;
    ELSIF NOT public.is_own_store_cover_url(OLD.id, NEW.store_cover_url) THEN
      RAISE EXCEPTION 'invalid store cover url';
    END IF;
  END IF;

  RETURN NEW;
END;
$$;

REVOKE ALL ON FUNCTION public.protect_seller_profile_columns() FROM PUBLIC, anon, authenticated;

INSERT INTO storage.buckets (id, name, public)
VALUES ('seller-store-covers', 'seller-store-covers', true)
ON CONFLICT (id) DO NOTHING;

DO $$
BEGIN
  UPDATE storage.buckets
  SET
    file_size_limit = 5242880,
    allowed_mime_types = ARRAY['image/jpeg', 'image/png', 'image/webp']
  WHERE id = 'seller-store-covers';
EXCEPTION
  WHEN undefined_column THEN
    RAISE NOTICE 'storage.buckets has no file_size_limit/allowed_mime_types; keep Storage RLS path checks only';
END;
$$;

CREATE OR REPLACE FUNCTION public.store_cover_seller_id(object_name text)
RETURNS uuid
LANGUAGE sql
STABLE
SET search_path = public
AS $$
  SELECT CASE
    WHEN object_name ~* '^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}/cover\.webp$'
    THEN split_part(object_name, '/', 1)::uuid
    ELSE NULL
  END;
$$;

REVOKE ALL ON FUNCTION public.store_cover_seller_id(text) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.store_cover_seller_id(text) TO authenticated;

DROP POLICY IF EXISTS seller_store_covers_storage_select ON storage.objects;
CREATE POLICY seller_store_covers_storage_select
  ON storage.objects
  FOR SELECT
  TO public
  USING (bucket_id = 'seller-store-covers');

DROP POLICY IF EXISTS seller_store_covers_storage_insert ON storage.objects;
CREATE POLICY seller_store_covers_storage_insert
  ON storage.objects
  FOR INSERT
  TO authenticated
  WITH CHECK (
    bucket_id = 'seller-store-covers'
    AND public.store_cover_seller_id(name) IS NOT NULL
    AND (
      public.is_admin()
      OR (
        public.is_approved_seller()
        AND public.store_cover_seller_id(name) = auth.uid()
      )
    )
  );

DROP POLICY IF EXISTS seller_store_covers_storage_update ON storage.objects;
CREATE POLICY seller_store_covers_storage_update
  ON storage.objects
  FOR UPDATE
  TO authenticated
  USING (
    bucket_id = 'seller-store-covers'
    AND public.store_cover_seller_id(name) IS NOT NULL
    AND (
      public.is_admin()
      OR (
        public.is_approved_seller()
        AND public.store_cover_seller_id(name) = auth.uid()
      )
    )
  )
  WITH CHECK (
    bucket_id = 'seller-store-covers'
    AND public.store_cover_seller_id(name) IS NOT NULL
    AND (
      public.is_admin()
      OR (
        public.is_approved_seller()
        AND public.store_cover_seller_id(name) = auth.uid()
      )
    )
  );

DROP POLICY IF EXISTS seller_store_covers_storage_delete ON storage.objects;
CREATE POLICY seller_store_covers_storage_delete
  ON storage.objects
  FOR DELETE
  TO authenticated
  USING (
    bucket_id = 'seller-store-covers'
    AND public.store_cover_seller_id(name) IS NOT NULL
    AND (
      public.is_admin()
      OR (
        public.is_approved_seller()
        AND public.store_cover_seller_id(name) = auth.uid()
      )
    )
  );
