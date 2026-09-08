-- Motodo.id — favorites (wishlist) + cart_items platform contract
-- Web and future native clients. Does not change orders, inventory reservation, or payments.

-- ---------------------------------------------------------------------------
-- Favorites
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.favorites (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES public.profiles (id) ON DELETE CASCADE,
  listing_id uuid NOT NULL REFERENCES public.listings (id) ON DELETE CASCADE,
  created_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT favorites_user_listing_unique UNIQUE (user_id, listing_id)
);

CREATE INDEX IF NOT EXISTS favorites_user_id_idx ON public.favorites (user_id, created_at DESC);
CREATE INDEX IF NOT EXISTS favorites_listing_id_idx ON public.favorites (listing_id);

COMMENT ON TABLE public.favorites IS 'User wishlist. Does not reserve inventory or create orders.';
COMMENT ON COLUMN public.favorites.user_id IS 'Owner. Always auth.uid(). Never trust a client-supplied user_id.';

ALTER TABLE public.favorites ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS favorites_select_own ON public.favorites;
CREATE POLICY favorites_select_own
  ON public.favorites
  FOR SELECT
  TO authenticated
  USING (user_id = auth.uid());

DROP POLICY IF EXISTS favorites_insert_own ON public.favorites;
CREATE POLICY favorites_insert_own
  ON public.favorites
  FOR INSERT
  TO authenticated
  WITH CHECK (user_id = auth.uid());

DROP POLICY IF EXISTS favorites_update_deny ON public.favorites;
CREATE POLICY favorites_update_deny
  ON public.favorites
  FOR UPDATE
  TO authenticated
  USING (false)
  WITH CHECK (false);

DROP POLICY IF EXISTS favorites_delete_own ON public.favorites;
CREATE POLICY favorites_delete_own
  ON public.favorites
  FOR DELETE
  TO authenticated
  USING (user_id = auth.uid());

REVOKE ALL ON TABLE public.favorites FROM PUBLIC, anon, authenticated;
GRANT SELECT, INSERT, DELETE ON TABLE public.favorites TO authenticated;

CREATE OR REPLACE FUNCTION public.protect_favorites_user_id()
RETURNS trigger
LANGUAGE plpgsql
SET search_path = public
AS $$
BEGIN
  IF auth.uid() IS NULL THEN
    PERFORM public.motodo_raise('UNAUTHORIZED', 'You must be logged in.');
  END IF;
  NEW.user_id := auth.uid();
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS protect_favorites_user_id ON public.favorites;
CREATE TRIGGER protect_favorites_user_id
  BEFORE INSERT ON public.favorites
  FOR EACH ROW
  EXECUTE FUNCTION public.protect_favorites_user_id();

REVOKE ALL ON FUNCTION public.protect_favorites_user_id() FROM PUBLIC, anon, authenticated;

CREATE OR REPLACE FUNCTION public.toggle_favorite(p_listing_id uuid)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_user uuid := auth.uid();
  v_listing public.listings;
  v_existing uuid;
  v_id uuid;
BEGIN
  IF v_user IS NULL THEN
    PERFORM public.motodo_raise('UNAUTHORIZED', 'You must be logged in.');
  END IF;

  IF p_listing_id IS NULL THEN
    PERFORM public.motodo_raise('LISTING_NOT_FOUND', 'Motorcycle listing not found.');
  END IF;

  SELECT * INTO v_listing
  FROM public.listings
  WHERE id = p_listing_id;

  IF v_listing.id IS NULL THEN
    PERFORM public.motodo_raise('LISTING_NOT_FOUND', 'Motorcycle listing not found.');
  END IF;

  IF v_listing.status IS DISTINCT FROM 'active'
    AND v_listing.status IS DISTINCT FROM 'sold'
    AND v_listing.seller_id IS DISTINCT FROM v_user
    AND NOT public.is_admin()
  THEN
    PERFORM public.motodo_raise('LISTING_NOT_FOUND', 'Motorcycle listing not found.');
  END IF;

  SELECT f.id INTO v_existing
  FROM public.favorites f
  WHERE f.user_id = v_user AND f.listing_id = p_listing_id;

  IF v_existing IS NOT NULL THEN
    DELETE FROM public.favorites WHERE id = v_existing;
    RETURN jsonb_build_object(
      'listing_id', p_listing_id,
      'favorited', false
    );
  END IF;

  INSERT INTO public.favorites (user_id, listing_id)
  VALUES (v_user, p_listing_id)
  ON CONFLICT (user_id, listing_id) DO NOTHING
  RETURNING id INTO v_id;

  RETURN jsonb_build_object(
    'listing_id', p_listing_id,
    'favorited', true
  );
END;
$$;

CREATE OR REPLACE FUNCTION public.get_my_favorites()
RETURNS SETOF public.favorites
LANGUAGE sql
STABLE
SECURITY INVOKER
SET search_path = public
AS $$
  SELECT *
  FROM public.favorites
  WHERE user_id = auth.uid()
  ORDER BY created_at DESC;
$$;

REVOKE ALL ON FUNCTION public.toggle_favorite(uuid) FROM PUBLIC, anon;
REVOKE ALL ON FUNCTION public.get_my_favorites() FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.toggle_favorite(uuid) TO authenticated;
GRANT EXECUTE ON FUNCTION public.get_my_favorites() TO authenticated;

-- ---------------------------------------------------------------------------
-- Cart (does not reserve inventory; create_order remains authoritative)
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.cart_items (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES public.profiles (id) ON DELETE CASCADE,
  listing_id uuid NOT NULL REFERENCES public.listings (id) ON DELETE CASCADE,
  quantity integer NOT NULL DEFAULT 1 CHECK (quantity >= 1),
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT cart_items_user_listing_unique UNIQUE (user_id, listing_id)
);

CREATE INDEX IF NOT EXISTS cart_items_user_id_idx ON public.cart_items (user_id, updated_at DESC);
CREATE INDEX IF NOT EXISTS cart_items_listing_id_idx ON public.cart_items (listing_id);

COMMENT ON TABLE public.cart_items IS 'Persistent cart. Does not reserve stock, create orders, or set payment state.';
COMMENT ON COLUMN public.cart_items.quantity IS 'Requested units. Must stay >= 1 and <= available at add/update. Stale rows may exceed later availability.';

CREATE OR REPLACE FUNCTION public.set_cart_items_updated_at()
RETURNS trigger
LANGUAGE plpgsql
SET search_path = public
AS $$
BEGIN
  NEW.updated_at := now();
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS cart_items_set_updated_at ON public.cart_items;
CREATE TRIGGER cart_items_set_updated_at
  BEFORE UPDATE ON public.cart_items
  FOR EACH ROW
  EXECUTE FUNCTION public.set_cart_items_updated_at();

REVOKE ALL ON FUNCTION public.set_cart_items_updated_at() FROM PUBLIC, anon, authenticated;

ALTER TABLE public.cart_items ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS cart_items_select_own ON public.cart_items;
CREATE POLICY cart_items_select_own
  ON public.cart_items
  FOR SELECT
  TO authenticated
  USING (user_id = auth.uid());

DROP POLICY IF EXISTS cart_items_insert_deny ON public.cart_items;
CREATE POLICY cart_items_insert_deny
  ON public.cart_items
  FOR INSERT
  TO authenticated
  WITH CHECK (false);

DROP POLICY IF EXISTS cart_items_update_deny ON public.cart_items;
CREATE POLICY cart_items_update_deny
  ON public.cart_items
  FOR UPDATE
  TO authenticated
  USING (false)
  WITH CHECK (false);

DROP POLICY IF EXISTS cart_items_delete_deny ON public.cart_items;
CREATE POLICY cart_items_delete_deny
  ON public.cart_items
  FOR DELETE
  TO authenticated
  USING (false);

REVOKE ALL ON TABLE public.cart_items FROM PUBLIC, anon, authenticated;
GRANT SELECT ON TABLE public.cart_items TO authenticated;

CREATE OR REPLACE FUNCTION public.protect_cart_items_user_id()
RETURNS trigger
LANGUAGE plpgsql
SET search_path = public
AS $$
BEGIN
  IF auth.uid() IS NULL THEN
    PERFORM public.motodo_raise('UNAUTHORIZED', 'You must be logged in.');
  END IF;
  NEW.user_id := auth.uid();
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS protect_cart_items_user_id ON public.cart_items;
CREATE TRIGGER protect_cart_items_user_id
  BEFORE INSERT ON public.cart_items
  FOR EACH ROW
  EXECUTE FUNCTION public.protect_cart_items_user_id();

REVOKE ALL ON FUNCTION public.protect_cart_items_user_id() FROM PUBLIC, anon, authenticated;

CREATE OR REPLACE FUNCTION public.add_to_cart(p_listing_id uuid)
RETURNS public.cart_items
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_user uuid := auth.uid();
  v_listing public.listings;
  v_available integer;
  v_row public.cart_items;
BEGIN
  IF v_user IS NULL THEN
    PERFORM public.motodo_raise('UNAUTHORIZED', 'You must be logged in.');
  END IF;

  IF p_listing_id IS NULL THEN
    PERFORM public.motodo_raise('LISTING_NOT_FOUND', 'Motorcycle listing not found.');
  END IF;

  SELECT * INTO v_listing
  FROM public.listings
  WHERE id = p_listing_id;

  IF v_listing.id IS NULL THEN
    PERFORM public.motodo_raise('LISTING_NOT_FOUND', 'Motorcycle listing not found.');
  END IF;

  IF COALESCE(v_listing.is_demo, false) THEN
    PERFORM public.motodo_raise('DEMO_LISTING_NOT_FOR_SALE', 'This listing is demo data and cannot be purchased.');
  END IF;

  IF v_listing.status IS DISTINCT FROM 'active' THEN
    PERFORM public.motodo_raise('LISTING_UNAVAILABLE', 'This motorcycle is no longer available.');
  END IF;

  IF v_listing.seller_id = v_user THEN
    PERFORM public.motodo_raise('SELF_PURCHASE', 'You cannot purchase your own listing.');
  END IF;

  SELECT * INTO v_row
  FROM public.cart_items
  WHERE user_id = v_user AND listing_id = p_listing_id;

  IF v_row.id IS NOT NULL THEN
    RETURN v_row;
  END IF;

  v_available := public.listing_available_quantity(v_listing.id);
  IF v_available < 1 THEN
    PERFORM public.motodo_raise('INSUFFICIENT_STOCK', 'Not enough units available.');
  END IF;

  INSERT INTO public.cart_items (user_id, listing_id, quantity)
  VALUES (v_user, p_listing_id, 1)
  ON CONFLICT (user_id, listing_id) DO NOTHING
  RETURNING * INTO v_row;

  IF v_row.id IS NULL THEN
    SELECT * INTO v_row
    FROM public.cart_items
    WHERE user_id = v_user AND listing_id = p_listing_id;
  END IF;

  RETURN v_row;
END;
$$;

CREATE OR REPLACE FUNCTION public.remove_from_cart(p_listing_id uuid)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_user uuid := auth.uid();
  v_deleted integer := 0;
BEGIN
  IF v_user IS NULL THEN
    PERFORM public.motodo_raise('UNAUTHORIZED', 'You must be logged in.');
  END IF;

  IF p_listing_id IS NULL THEN
    PERFORM public.motodo_raise('LISTING_NOT_FOUND', 'Motorcycle listing not found.');
  END IF;

  DELETE FROM public.cart_items
  WHERE user_id = v_user AND listing_id = p_listing_id;

  GET DIAGNOSTICS v_deleted = ROW_COUNT;

  RETURN jsonb_build_object(
    'listing_id', p_listing_id,
    'removed', v_deleted > 0
  );
END;
$$;

CREATE OR REPLACE FUNCTION public.update_cart_quantity(p_listing_id uuid, p_quantity integer)
RETURNS public.cart_items
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_user uuid := auth.uid();
  v_listing public.listings;
  v_available integer;
  v_row public.cart_items;
BEGIN
  IF v_user IS NULL THEN
    PERFORM public.motodo_raise('UNAUTHORIZED', 'You must be logged in.');
  END IF;

  IF p_listing_id IS NULL THEN
    PERFORM public.motodo_raise('LISTING_NOT_FOUND', 'Motorcycle listing not found.');
  END IF;

  IF p_quantity IS NULL OR p_quantity < 1 THEN
    PERFORM public.motodo_raise('INVALID_QUANTITY', 'Enter a whole number of 1 or more.');
  END IF;

  SELECT * INTO v_row
  FROM public.cart_items
  WHERE user_id = v_user AND listing_id = p_listing_id
  FOR UPDATE;

  IF v_row.id IS NULL THEN
    PERFORM public.motodo_raise('CART_ITEM_NOT_FOUND', 'That motorcycle is not in your cart.');
  END IF;

  SELECT * INTO v_listing
  FROM public.listings
  WHERE id = p_listing_id;

  IF v_listing.id IS NULL THEN
    PERFORM public.motodo_raise('LISTING_NOT_FOUND', 'Motorcycle listing not found.');
  END IF;

  IF COALESCE(v_listing.is_demo, false) THEN
    PERFORM public.motodo_raise('DEMO_LISTING_NOT_FOR_SALE', 'This listing is demo data and cannot be purchased.');
  END IF;

  v_available := public.listing_available_quantity(v_listing.id);
  IF p_quantity > v_available OR p_quantity > v_listing.quantity THEN
    PERFORM public.motodo_raise('INSUFFICIENT_STOCK', 'Not enough units available.');
  END IF;

  UPDATE public.cart_items
  SET quantity = p_quantity
  WHERE id = v_row.id
  RETURNING * INTO v_row;

  RETURN v_row;
END;
$$;

CREATE OR REPLACE FUNCTION public.clear_cart()
RETURNS integer
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_user uuid := auth.uid();
  v_count integer := 0;
BEGIN
  IF v_user IS NULL THEN
    PERFORM public.motodo_raise('UNAUTHORIZED', 'You must be logged in.');
  END IF;

  DELETE FROM public.cart_items WHERE user_id = v_user;
  GET DIAGNOSTICS v_count = ROW_COUNT;
  RETURN v_count;
END;
$$;

CREATE OR REPLACE FUNCTION public.get_my_cart()
RETURNS TABLE (
  id uuid,
  user_id uuid,
  listing_id uuid,
  quantity integer,
  created_at timestamptz,
  updated_at timestamptz,
  listing_status text,
  listing_is_demo boolean,
  available_quantity integer,
  is_available boolean
)
LANGUAGE sql
STABLE
SECURITY INVOKER
SET search_path = public
AS $$
  SELECT
    c.id,
    c.user_id,
    c.listing_id,
    c.quantity,
    c.created_at,
    c.updated_at,
    l.status,
    COALESCE(l.is_demo, false),
    public.listing_available_quantity(c.listing_id),
    (
      l.id IS NOT NULL
      AND COALESCE(l.is_demo, false) = false
      AND l.status = 'active'
      AND l.seller_id IS DISTINCT FROM auth.uid()
      AND public.listing_available_quantity(c.listing_id) >= c.quantity
    )
  FROM public.cart_items c
  LEFT JOIN public.listings l ON l.id = c.listing_id
  WHERE c.user_id = auth.uid()
  ORDER BY c.updated_at DESC;
$$;

REVOKE ALL ON FUNCTION public.add_to_cart(uuid) FROM PUBLIC, anon;
REVOKE ALL ON FUNCTION public.remove_from_cart(uuid) FROM PUBLIC, anon;
REVOKE ALL ON FUNCTION public.update_cart_quantity(uuid, integer) FROM PUBLIC, anon;
REVOKE ALL ON FUNCTION public.clear_cart() FROM PUBLIC, anon;
REVOKE ALL ON FUNCTION public.get_my_cart() FROM PUBLIC, anon;

GRANT EXECUTE ON FUNCTION public.add_to_cart(uuid) TO authenticated;
GRANT EXECUTE ON FUNCTION public.remove_from_cart(uuid) TO authenticated;
GRANT EXECUTE ON FUNCTION public.update_cart_quantity(uuid, integer) TO authenticated;
GRANT EXECUTE ON FUNCTION public.clear_cart() TO authenticated;
GRANT EXECUTE ON FUNCTION public.get_my_cart() TO authenticated;
