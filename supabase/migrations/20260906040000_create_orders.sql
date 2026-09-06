-- Motodo.id Phase E — orders + server-side inventory / reservation
-- Apply in the Supabase SQL editor or CLI. Do not run from the Vite app.

CREATE TABLE IF NOT EXISTS public.orders (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  order_number text UNIQUE NOT NULL,
  buyer_id uuid NOT NULL REFERENCES public.profiles (id),
  seller_id uuid NOT NULL REFERENCES public.seller_profiles (id),
  listing_id uuid NOT NULL REFERENCES public.listings (id),
  quantity integer NOT NULL CHECK (quantity >= 1),
  unit_price numeric(15, 2) NOT NULL,
  subtotal numeric(15, 2) NOT NULL,
  discount_amount numeric(15, 2) NOT NULL DEFAULT 0,
  buyer_total numeric(15, 2) NOT NULL,
  seller_fee_rate numeric(8, 6) NOT NULL DEFAULT 0.02,
  seller_fee_amount numeric(15, 2) NOT NULL,
  seller_net_amount numeric(15, 2) NOT NULL,
  delivery_method text NOT NULL CHECK (delivery_method IN ('pickup', 'seller_fleet', 'third_party')),
  delivery_address text,
  delivery_city text,
  delivery_notes text,
  payment_method text,
  payment_status text NOT NULL DEFAULT 'pending' CHECK (payment_status IN ('pending', 'paid', 'failed', 'refunded')),
  status text NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'confirmed', 'completed', 'cancelled')),
  cancellation_reason text,
  listing_name text,
  listing_image text,
  buyer_name text,
  buyer_email text,
  buyer_phone text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

COMMENT ON TABLE public.orders IS 'Marketplace orders. Financial fields and status are RPC-owned.';
COMMENT ON COLUMN public.orders.order_number IS 'Human-readable MTD-XXXXXXXX. Generated server-side.';
COMMENT ON COLUMN public.orders.seller_fee_rate IS 'Seller success fee. Product rate is exactly 0.02. Not added to buyer_total.';
COMMENT ON COLUMN public.listings.quantity IS 'Total inventory. Pending/confirmed orders reserve units; completed orders deduct.';

CREATE INDEX IF NOT EXISTS orders_buyer_id_idx ON public.orders (buyer_id);
CREATE INDEX IF NOT EXISTS orders_seller_id_idx ON public.orders (seller_id);
CREATE INDEX IF NOT EXISTS orders_listing_id_idx ON public.orders (listing_id);
CREATE INDEX IF NOT EXISTS orders_status_idx ON public.orders (status);
CREATE INDEX IF NOT EXISTS orders_listing_reserving_idx ON public.orders (listing_id) WHERE status IN ('pending', 'confirmed');

CREATE OR REPLACE FUNCTION public.set_orders_updated_at()
RETURNS trigger
LANGUAGE plpgsql
AS $$
BEGIN
  NEW.updated_at := now();
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS orders_set_updated_at ON public.orders;
CREATE TRIGGER orders_set_updated_at
  BEFORE UPDATE ON public.orders
  FOR EACH ROW
  EXECUTE FUNCTION public.set_orders_updated_at();

CREATE OR REPLACE FUNCTION public.listing_reserved_quantity(p_listing_id uuid)
RETURNS integer
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT COALESCE(SUM(o.quantity), 0)::integer
  FROM public.orders o
  WHERE o.listing_id = p_listing_id
    AND o.status IN ('pending', 'confirmed');
$$;

CREATE OR REPLACE FUNCTION public.listing_available_quantity(p_listing_id uuid)
RETURNS integer
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT GREATEST(
    0,
    COALESCE((SELECT l.quantity FROM public.listings l WHERE l.id = p_listing_id), 0)
      - public.listing_reserved_quantity(p_listing_id)
  );
$$;

CREATE OR REPLACE VIEW public.listing_stock AS
SELECT
  l.id,
  l.quantity AS total_quantity,
  public.listing_reserved_quantity(l.id) AS reserved_quantity,
  GREATEST(0, l.quantity - public.listing_reserved_quantity(l.id)) AS available_quantity
FROM public.listings l;

ALTER VIEW public.listing_stock SET (security_invoker = false);

CREATE OR REPLACE FUNCTION public.generate_order_number()
RETURNS text
LANGUAGE plpgsql
AS $$
DECLARE
  v_candidate text;
BEGIN
  LOOP
    v_candidate := 'MTD-' || upper(substr(replace(gen_random_uuid()::text, '-', ''), 1, 8));
    EXIT WHEN NOT EXISTS (SELECT 1 FROM public.orders WHERE order_number = v_candidate);
  END LOOP;
  RETURN v_candidate;
END;
$$;

CREATE OR REPLACE FUNCTION public.order_row_by_ref(p_order_ref text)
RETURNS public.orders
LANGUAGE plpgsql
STABLE
AS $$
DECLARE
  v_order public.orders;
BEGIN
  IF p_order_ref IS NULL OR length(trim(p_order_ref)) = 0 THEN
    RAISE EXCEPTION 'order not found';
  END IF;

  IF p_order_ref ~* '^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$' THEN
    SELECT * INTO v_order
    FROM public.orders
    WHERE id = p_order_ref::uuid OR order_number = p_order_ref;
  ELSE
    SELECT * INTO v_order
    FROM public.orders
    WHERE order_number = p_order_ref;
  END IF;

  IF v_order.id IS NULL THEN
    RAISE EXCEPTION 'order not found';
  END IF;
  RETURN v_order;
END;
$$;

CREATE OR REPLACE FUNCTION public.create_order(
  p_listing_id uuid,
  p_quantity integer,
  p_delivery_method text,
  p_delivery_address text DEFAULT NULL,
  p_delivery_city text DEFAULT NULL,
  p_payment_method text DEFAULT NULL,
  p_buyer_phone text DEFAULT NULL,
  p_delivery_notes text DEFAULT NULL
)
RETURNS public.orders
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_buyer_id uuid := auth.uid();
  v_listing public.listings;
  v_reserved integer;
  v_available integer;
  v_unit_price numeric(15, 2);
  v_subtotal numeric(15, 2);
  v_discount numeric(15, 2) := 0;
  v_buyer_total numeric(15, 2);
  v_fee_rate numeric(8, 6) := 0.02;
  v_fee numeric(15, 2);
  v_net numeric(15, 2);
  v_cover text;
  v_buyer_name text;
  v_buyer_email text;
  v_order public.orders;
BEGIN
  IF v_buyer_id IS NULL THEN
    RAISE EXCEPTION 'You must be logged in to place an order.';
  END IF;

  IF p_listing_id IS NULL THEN
    RAISE EXCEPTION 'Motorcycle listing not found.';
  END IF;

  IF p_quantity IS NULL OR p_quantity < 1 THEN
    RAISE EXCEPTION 'Enter a whole number of 1 or more.';
  END IF;

  IF p_delivery_method IS DISTINCT FROM 'pickup' AND p_delivery_method IS DISTINCT FROM 'seller_fleet' THEN
    IF p_delivery_method = 'third_party' THEN
      RAISE EXCEPTION 'Third-party logistics is not available yet.';
    END IF;
    RAISE EXCEPTION 'Select a delivery method.';
  END IF;

  IF p_payment_method IS NOT NULL
    AND p_payment_method IS DISTINCT FROM 'bank_transfer'
    AND p_payment_method IS DISTINCT FROM 'discuss_with_seller'
  THEN
    RAISE EXCEPTION 'Select a payment method.';
  END IF;

  IF p_delivery_method = 'seller_fleet' THEN
    IF p_delivery_address IS NULL OR length(trim(p_delivery_address)) = 0 THEN
      RAISE EXCEPTION 'Delivery address is required.';
    END IF;
    IF p_delivery_city IS NULL OR length(trim(p_delivery_city)) = 0 THEN
      RAISE EXCEPTION 'City is required.';
    END IF;
  END IF;

  SELECT * INTO v_listing
  FROM public.listings
  WHERE id = p_listing_id
  FOR UPDATE;

  IF v_listing.id IS NULL THEN
    RAISE EXCEPTION 'Motorcycle listing not found.';
  END IF;

  IF v_listing.status IS DISTINCT FROM 'active' THEN
    RAISE EXCEPTION 'This motorcycle is no longer available.';
  END IF;

  IF v_listing.seller_id = v_buyer_id THEN
    RAISE EXCEPTION 'You cannot purchase your own listing.';
  END IF;

  IF NOT EXISTS (
    SELECT 1
    FROM public.seller_profiles sp
    WHERE sp.id = v_listing.seller_id AND sp.seller_status = 'approved'
  ) THEN
    RAISE EXCEPTION 'This motorcycle is no longer available.';
  END IF;

  v_reserved := public.listing_reserved_quantity(v_listing.id);
  v_available := GREATEST(0, v_listing.quantity - v_reserved);

  IF p_quantity > v_available THEN
    RAISE EXCEPTION 'Not enough units available.';
  END IF;

  v_unit_price := ROUND(v_listing.price, 2);
  v_subtotal := ROUND(v_unit_price * p_quantity, 2);
  v_buyer_total := ROUND(v_subtotal - v_discount, 2);
  v_fee := ROUND(v_buyer_total * v_fee_rate, 2);
  v_net := ROUND(v_buyer_total - v_fee, 2);

  SELECT li.public_url INTO v_cover
  FROM public.listing_images li
  WHERE li.listing_id = v_listing.id
  ORDER BY li.sort_order
  LIMIT 1;

  SELECT p.full_name INTO v_buyer_name
  FROM public.profiles p
  WHERE p.id = v_buyer_id;

  SELECT u.email INTO v_buyer_email
  FROM auth.users u
  WHERE u.id = v_buyer_id;

  INSERT INTO public.orders (
    order_number,
    buyer_id,
    seller_id,
    listing_id,
    quantity,
    unit_price,
    subtotal,
    discount_amount,
    buyer_total,
    seller_fee_rate,
    seller_fee_amount,
    seller_net_amount,
    delivery_method,
    delivery_address,
    delivery_city,
    delivery_notes,
    payment_method,
    payment_status,
    status,
    listing_name,
    listing_image,
    buyer_name,
    buyer_email,
    buyer_phone
  ) VALUES (
    public.generate_order_number(),
    v_buyer_id,
    v_listing.seller_id,
    v_listing.id,
    p_quantity,
    v_unit_price,
    v_subtotal,
    v_discount,
    v_buyer_total,
    v_fee_rate,
    v_fee,
    v_net,
    p_delivery_method,
    CASE WHEN p_delivery_method = 'seller_fleet' THEN trim(p_delivery_address) ELSE NULL END,
    CASE WHEN p_delivery_method = 'seller_fleet' THEN trim(p_delivery_city) ELSE NULL END,
    NULLIF(trim(COALESCE(p_delivery_notes, '')), ''),
    COALESCE(p_payment_method, 'bank_transfer'),
    'pending',
    'pending',
    v_listing.name,
    v_cover,
    COALESCE(v_buyer_name, ''),
    COALESCE(v_buyer_email, ''),
    NULLIF(trim(COALESCE(p_buyer_phone, '')), '')
  )
  RETURNING * INTO v_order;

  RETURN v_order;
END;
$$;

CREATE OR REPLACE FUNCTION public.cancel_order(
  p_order_ref text,
  p_reason text DEFAULT NULL
)
RETURNS public.orders
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_actor uuid := auth.uid();
  v_order public.orders;
BEGIN
  IF v_actor IS NULL THEN
    RAISE EXCEPTION 'not authenticated';
  END IF;

  v_order := public.order_row_by_ref(p_order_ref);

  SELECT * INTO v_order
  FROM public.orders
  WHERE id = v_order.id
  FOR UPDATE;

  IF v_order.status IS DISTINCT FROM 'pending' THEN
    RAISE EXCEPTION 'This order status cannot be changed.';
  END IF;

  IF NOT (
    public.is_admin()
    OR v_order.buyer_id = v_actor
    OR v_order.seller_id = v_actor
  ) THEN
    RAISE EXCEPTION 'You don''t have permission to update this order.';
  END IF;

  UPDATE public.orders
  SET
    status = 'cancelled',
    cancellation_reason = NULLIF(trim(COALESCE(p_reason, '')), '')
  WHERE id = v_order.id
  RETURNING * INTO v_order;

  RETURN v_order;
END;
$$;

CREATE OR REPLACE FUNCTION public.confirm_order(p_order_ref text)
RETURNS public.orders
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_actor uuid := auth.uid();
  v_order public.orders;
BEGIN
  IF v_actor IS NULL THEN
    RAISE EXCEPTION 'not authenticated';
  END IF;

  v_order := public.order_row_by_ref(p_order_ref);

  SELECT * INTO v_order
  FROM public.orders
  WHERE id = v_order.id
  FOR UPDATE;

  IF v_order.status IS DISTINCT FROM 'pending' THEN
    RAISE EXCEPTION 'This order status cannot be changed.';
  END IF;

  IF NOT (public.is_admin() OR v_order.seller_id = v_actor) THEN
    RAISE EXCEPTION 'You don''t have permission to update this order.';
  END IF;

  UPDATE public.orders
  SET status = 'confirmed'
  WHERE id = v_order.id
  RETURNING * INTO v_order;

  RETURN v_order;
END;
$$;

CREATE OR REPLACE FUNCTION public.complete_order(p_order_ref text)
RETURNS public.orders
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_actor uuid := auth.uid();
  v_order public.orders;
  v_listing public.listings;
  v_next_qty integer;
BEGIN
  IF v_actor IS NULL THEN
    RAISE EXCEPTION 'not authenticated';
  END IF;

  v_order := public.order_row_by_ref(p_order_ref);

  SELECT * INTO v_listing
  FROM public.listings
  WHERE id = v_order.listing_id
  FOR UPDATE;

  SELECT * INTO v_order
  FROM public.orders
  WHERE id = v_order.id
  FOR UPDATE;

  IF v_order.status IS DISTINCT FROM 'confirmed' THEN
    RAISE EXCEPTION 'This order status cannot be changed.';
  END IF;

  IF NOT (public.is_admin() OR v_order.seller_id = v_actor) THEN
    RAISE EXCEPTION 'You don''t have permission to update this order.';
  END IF;

  IF v_listing.id IS NULL THEN
    RAISE EXCEPTION 'Motorcycle listing not found.';
  END IF;

  IF v_listing.quantity < v_order.quantity THEN
    RAISE EXCEPTION 'Unable to complete this order because inventory is inconsistent.';
  END IF;

  v_next_qty := v_listing.quantity - v_order.quantity;

  UPDATE public.listings
  SET
    quantity = v_next_qty,
    status = CASE WHEN v_next_qty = 0 THEN 'sold' ELSE status END
  WHERE id = v_listing.id;

  UPDATE public.orders
  SET status = 'completed'
  WHERE id = v_order.id
  RETURNING * INTO v_order;

  RETURN v_order;
END;
$$;

-- Mark-active requires approved seller (existing) and total quantity > 0.
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
    IF NEW.status = 'active' AND COALESCE(NEW.quantity, 0) <= 0 THEN
      RAISE EXCEPTION 'cannot mark a listing active when quantity is 0';
    END IF;
    RETURN NEW;
  END IF;

  NEW.seller_id := OLD.seller_id;
  NEW.id := OLD.id;

  IF NEW.status = 'active' AND COALESCE(NEW.quantity, 0) <= 0 THEN
    RAISE EXCEPTION 'cannot mark a listing active when quantity is 0';
  END IF;

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

ALTER TABLE public.orders ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS orders_select_participant_or_admin ON public.orders;
CREATE POLICY orders_select_participant_or_admin
  ON public.orders
  FOR SELECT
  TO authenticated
  USING (
    buyer_id = auth.uid()
    OR seller_id = auth.uid()
    OR public.is_admin()
  );

DROP POLICY IF EXISTS orders_insert_deny ON public.orders;
CREATE POLICY orders_insert_deny
  ON public.orders
  FOR INSERT
  TO authenticated
  WITH CHECK (false);

DROP POLICY IF EXISTS orders_update_deny ON public.orders;
CREATE POLICY orders_update_deny
  ON public.orders
  FOR UPDATE
  TO authenticated
  USING (false)
  WITH CHECK (false);

DROP POLICY IF EXISTS orders_delete_deny ON public.orders;
CREATE POLICY orders_delete_deny
  ON public.orders
  FOR DELETE
  TO authenticated
  USING (false);

REVOKE ALL ON TABLE public.orders FROM PUBLIC, anon, authenticated;
GRANT SELECT ON TABLE public.orders TO authenticated;

GRANT SELECT ON public.listing_stock TO anon, authenticated;

REVOKE ALL ON FUNCTION public.listing_reserved_quantity(uuid) FROM PUBLIC;
REVOKE ALL ON FUNCTION public.listing_available_quantity(uuid) FROM PUBLIC;
REVOKE ALL ON FUNCTION public.generate_order_number() FROM PUBLIC;
REVOKE ALL ON FUNCTION public.order_row_by_ref(text) FROM PUBLIC;
REVOKE ALL ON FUNCTION public.create_order(uuid, integer, text, text, text, text, text, text) FROM PUBLIC;
REVOKE ALL ON FUNCTION public.cancel_order(text, text) FROM PUBLIC;
REVOKE ALL ON FUNCTION public.confirm_order(text) FROM PUBLIC;
REVOKE ALL ON FUNCTION public.complete_order(text) FROM PUBLIC;

GRANT EXECUTE ON FUNCTION public.listing_reserved_quantity(uuid) TO anon, authenticated;
GRANT EXECUTE ON FUNCTION public.listing_available_quantity(uuid) TO anon, authenticated;
GRANT EXECUTE ON FUNCTION public.create_order(uuid, integer, text, text, text, text, text, text) TO authenticated;
GRANT EXECUTE ON FUNCTION public.cancel_order(text, text) TO authenticated;
GRANT EXECUTE ON FUNCTION public.confirm_order(text) TO authenticated;
GRANT EXECUTE ON FUNCTION public.complete_order(text) TO authenticated;
