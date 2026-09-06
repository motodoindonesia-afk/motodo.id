-- Motodo.id Phase I — security hardening
-- Apply in the Supabase SQL editor or CLI. Do not run from the Vite app.
-- Only actual gaps from the Phase I audit. Does not duplicate already-correct RLS.

-- ---------------------------------------------------------------------------
-- 1) listing_stock must not bypass listings RLS (draft inventory leak).
-- ---------------------------------------------------------------------------
ALTER VIEW public.listing_stock SET (security_invoker = true);

-- ---------------------------------------------------------------------------
-- 2) Quantity helpers are SECURITY DEFINER (needed to sum reservations).
--    Do not return private listing stock to callers who cannot SELECT the listing.
--    create_order still works: it only orders active listings.
-- ---------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.listing_reserved_quantity(p_listing_id uuid)
RETURNS integer
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF p_listing_id IS NULL THEN
    RETURN 0;
  END IF;

  IF NOT EXISTS (
    SELECT 1
    FROM public.listings l
    WHERE l.id = p_listing_id
      AND (
        l.status IN ('active', 'sold')
        OR l.seller_id = auth.uid()
        OR public.is_admin()
      )
  ) THEN
    RETURN 0;
  END IF;

  RETURN COALESCE(
    (
      SELECT SUM(o.quantity)::integer
      FROM public.orders o
      WHERE o.listing_id = p_listing_id
        AND o.status IN ('pending', 'confirmed')
    ),
    0
  );
END;
$$;

CREATE OR REPLACE FUNCTION public.listing_available_quantity(p_listing_id uuid)
RETURNS integer
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_qty integer;
BEGIN
  IF p_listing_id IS NULL THEN
    RETURN 0;
  END IF;

  SELECT l.quantity INTO v_qty
  FROM public.listings l
  WHERE l.id = p_listing_id
    AND (
      l.status IN ('active', 'sold')
      OR l.seller_id = auth.uid()
      OR public.is_admin()
    );

  IF v_qty IS NULL THEN
    RETURN 0;
  END IF;

  RETURN GREATEST(0, v_qty - public.listing_reserved_quantity(p_listing_id));
END;
$$;

-- ---------------------------------------------------------------------------
-- 3) Storage: require listings/<listing_id>/... and a valid uuid segment.
--    UPDATE/DELETE previously did not require the listings/ prefix.
-- ---------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.listing_id_from_storage_name(object_name text)
RETURNS uuid
LANGUAGE sql
STABLE
SET search_path = public
AS $$
  SELECT CASE
    WHEN split_part(object_name, '/', 1) = 'listings'
      AND split_part(object_name, '/', 2) ~* '^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$'
    THEN split_part(object_name, '/', 2)::uuid
    ELSE NULL
  END;
$$;

REVOKE ALL ON FUNCTION public.listing_id_from_storage_name(text) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.listing_id_from_storage_name(text) TO authenticated;

DROP POLICY IF EXISTS listing_images_storage_insert ON storage.objects;
CREATE POLICY listing_images_storage_insert
  ON storage.objects
  FOR INSERT
  TO authenticated
  WITH CHECK (
    bucket_id = 'listing-images'
    AND public.listing_id_from_storage_name(name) IS NOT NULL
    AND (
      public.is_admin()
      OR (
        public.is_approved_seller()
        AND public.owns_listing(public.listing_id_from_storage_name(name))
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
    AND public.listing_id_from_storage_name(name) IS NOT NULL
    AND (
      public.is_admin()
      OR public.owns_listing(public.listing_id_from_storage_name(name))
    )
  )
  WITH CHECK (
    bucket_id = 'listing-images'
    AND public.listing_id_from_storage_name(name) IS NOT NULL
    AND (
      public.is_admin()
      OR public.owns_listing(public.listing_id_from_storage_name(name))
    )
  );

DROP POLICY IF EXISTS listing_images_storage_delete ON storage.objects;
CREATE POLICY listing_images_storage_delete
  ON storage.objects
  FOR DELETE
  TO authenticated
  USING (
    bucket_id = 'listing-images'
    AND public.listing_id_from_storage_name(name) IS NOT NULL
    AND (
      public.is_admin()
      OR public.owns_listing(public.listing_id_from_storage_name(name))
    )
  );

CREATE OR REPLACE FUNCTION public.protect_listing_image_path()
RETURNS trigger
LANGUAGE plpgsql
SET search_path = public
AS $$
BEGIN
  IF NEW.storage_path IS NULL
    OR NEW.storage_path !~ ('^listings/' || NEW.listing_id::text || '/[^/]+$')
  THEN
    RAISE EXCEPTION 'invalid listing image storage path';
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS protect_listing_image_path ON public.listing_images;
CREATE TRIGGER protect_listing_image_path
  BEFORE INSERT OR UPDATE OF storage_path, listing_id ON public.listing_images
  FOR EACH ROW
  EXECUTE FUNCTION public.protect_listing_image_path();

-- ---------------------------------------------------------------------------
-- 4) Explicit deny policies (RLS default-deny already applied; make intent clear).
-- ---------------------------------------------------------------------------
DROP POLICY IF EXISTS profiles_insert_deny ON public.profiles;
CREATE POLICY profiles_insert_deny
  ON public.profiles
  FOR INSERT
  TO authenticated
  WITH CHECK (false);

DROP POLICY IF EXISTS profiles_delete_deny ON public.profiles;
CREATE POLICY profiles_delete_deny
  ON public.profiles
  FOR DELETE
  TO authenticated
  USING (false);

DROP POLICY IF EXISTS seller_profiles_delete_deny ON public.seller_profiles;
CREATE POLICY seller_profiles_delete_deny
  ON public.seller_profiles
  FOR DELETE
  TO authenticated
  USING (false);

-- ---------------------------------------------------------------------------
-- 5) Do not expose internal helpers / trigger functions as client RPCs.
--    is_admin / is_approved_seller / owns_listing stay granted (used in RLS).
-- ---------------------------------------------------------------------------
REVOKE ALL ON FUNCTION public.is_conversation_participant(uuid) FROM PUBLIC, anon, authenticated;

REVOKE ALL ON FUNCTION public.handle_new_user() FROM PUBLIC, anon, authenticated;
REVOKE ALL ON FUNCTION public.protect_profile_columns() FROM PUBLIC, anon, authenticated;
REVOKE ALL ON FUNCTION public.set_seller_profiles_updated_at() FROM PUBLIC, anon, authenticated;
REVOKE ALL ON FUNCTION public.protect_seller_profile_columns() FROM PUBLIC, anon, authenticated;
REVOKE ALL ON FUNCTION public.set_listings_updated_at() FROM PUBLIC, anon, authenticated;
REVOKE ALL ON FUNCTION public.protect_listing_columns() FROM PUBLIC, anon, authenticated;
REVOKE ALL ON FUNCTION public.protect_listing_image_path() FROM PUBLIC, anon, authenticated;
REVOKE ALL ON FUNCTION public.set_orders_updated_at() FROM PUBLIC, anon, authenticated;
REVOKE ALL ON FUNCTION public.generate_order_number() FROM PUBLIC, anon, authenticated;
REVOKE ALL ON FUNCTION public.order_row_by_ref(text) FROM PUBLIC, anon, authenticated;
REVOKE ALL ON FUNCTION public.set_conversations_updated_at() FROM PUBLIC, anon, authenticated;
REVOKE ALL ON FUNCTION public.set_reviews_updated_at() FROM PUBLIC, anon, authenticated;
REVOKE ALL ON FUNCTION public.notify_on_order_change() FROM PUBLIC, anon, authenticated;
REVOKE ALL ON FUNCTION public.notify_on_listing_change() FROM PUBLIC, anon, authenticated;
REVOKE ALL ON FUNCTION public.notify_on_listing_quantity_change() FROM PUBLIC, anon, authenticated;
REVOKE ALL ON FUNCTION public.notify_on_message_insert() FROM PUBLIC, anon, authenticated;
REVOKE ALL ON FUNCTION public.notify_on_seller_profile_change() FROM PUBLIC, anon, authenticated;
REVOKE ALL ON FUNCTION public.notify_listing_low_inventory(uuid, integer, integer) FROM PUBLIC, anon, authenticated;
REVOKE ALL ON FUNCTION public.create_notification(uuid, text, text, text, text, text, uuid) FROM PUBLIC, anon, authenticated;
