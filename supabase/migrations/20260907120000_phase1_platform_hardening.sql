-- Motodo.id Phase 1 platform hardening
-- Inventory vs reserved, RPC error codes, demo sale block, storage MIME/size, listing_images listing_id freeze.
-- Does not change the order state machine or add a second API.

-- ---------------------------------------------------------------------------
-- 1) Structured error helper
--    PostgREST exposes message, details, hint. Motodo code is DETAIL, HINT, and the
--    "CODE: " message prefix so native clients never parse English copy.
-- ---------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.motodo_raise(p_code text, p_message text)
RETURNS void
LANGUAGE plpgsql
STABLE
SET search_path = public
AS $$
BEGIN
  RAISE EXCEPTION '%: %', p_code, p_message
    USING ERRCODE = 'P0001',
          DETAIL = p_code,
          HINT = p_code;
END;
$$;

COMMENT ON FUNCTION public.motodo_raise(text, text) IS
  'Internal. Raises Motodo RPC errors. DETAIL/HINT = stable code. Message = CODE: human text.';

REVOKE ALL ON FUNCTION public.motodo_raise(text, text) FROM PUBLIC, anon, authenticated;

-- ---------------------------------------------------------------------------
-- 2) Quantity cannot fall below reserved (pending + confirmed)
-- ---------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.enforce_listing_quantity_vs_reserved()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_reserved integer;
BEGIN
  SELECT COALESCE(SUM(o.quantity), 0)::integer
  INTO v_reserved
  FROM public.orders o
  WHERE o.listing_id = NEW.id
    AND o.status IN ('pending', 'confirmed');

  IF COALESCE(NEW.quantity, 0) < v_reserved THEN
    PERFORM public.motodo_raise(
      'QUANTITY_BELOW_RESERVED',
      'Quantity cannot be lower than units already reserved by pending or confirmed orders.'
    );
  END IF;

  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS enforce_listing_quantity_vs_reserved ON public.listings;
CREATE TRIGGER enforce_listing_quantity_vs_reserved
  BEFORE INSERT OR UPDATE OF quantity ON public.listings
  FOR EACH ROW
  EXECUTE FUNCTION public.enforce_listing_quantity_vs_reserved();

REVOKE ALL ON FUNCTION public.enforce_listing_quantity_vs_reserved() FROM PUBLIC, anon, authenticated;

-- Freeze is_demo for non-admins (clients cannot turn demo rows into real inventory flags or vice versa).
CREATE OR REPLACE FUNCTION public.protect_listing_columns()
RETURNS trigger
LANGUAGE plpgsql
AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    IF NOT public.is_admin() THEN
      NEW.is_demo := false;
      IF auth.uid() IS NULL THEN
        PERFORM public.motodo_raise('UNAUTHORIZED', 'You must be logged in.');
      END IF;
      NEW.seller_id := auth.uid();
      IF NEW.status = 'active' AND NOT public.is_approved_seller() THEN
        PERFORM public.motodo_raise('SELLER_NOT_APPROVED', 'Only approved sellers can publish active listings.');
      END IF;
      IF NEW.status IS DISTINCT FROM 'draft'
        AND NEW.status IS DISTINCT FROM 'active'
        AND NEW.status IS DISTINCT FROM 'sold'
      THEN
        NEW.status := 'draft';
      END IF;
      IF NOT public.is_approved_seller() THEN
        PERFORM public.motodo_raise('SELLER_NOT_APPROVED', 'Only approved sellers can create listings.');
      END IF;
    END IF;
    IF NEW.status = 'active' AND COALESCE(NEW.quantity, 0) <= 0 THEN
      PERFORM public.motodo_raise('ACTIVE_REQUIRES_QUANTITY', 'Cannot mark a listing active when quantity is 0.');
    END IF;
    RETURN NEW;
  END IF;

  NEW.seller_id := OLD.seller_id;
  NEW.id := OLD.id;
  IF NOT public.is_admin() THEN
    NEW.is_demo := OLD.is_demo;
  END IF;

  IF NEW.status = 'active' AND COALESCE(NEW.quantity, 0) <= 0 THEN
    PERFORM public.motodo_raise('ACTIVE_REQUIRES_QUANTITY', 'Cannot mark a listing active when quantity is 0.');
  END IF;

  IF public.is_admin() THEN
    RETURN NEW;
  END IF;

  IF auth.uid() IS NULL OR auth.uid() IS DISTINCT FROM OLD.seller_id THEN
    PERFORM public.motodo_raise('FORBIDDEN', 'You don''t have permission to update this listing.');
  END IF;

  IF NEW.status = 'active' AND NOT public.is_approved_seller() THEN
    PERFORM public.motodo_raise('SELLER_NOT_APPROVED', 'Only approved sellers can publish active listings.');
  END IF;

  RETURN NEW;
END;
$$;

-- ---------------------------------------------------------------------------
-- 3) listing_images: cannot move a row to another listing
-- ---------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.protect_listing_image_path()
RETURNS trigger
LANGUAGE plpgsql
SET search_path = public
AS $$
BEGIN
  IF TG_OP = 'UPDATE' THEN
    NEW.listing_id := OLD.listing_id;
  END IF;

  IF NEW.storage_path IS NULL
    OR NEW.storage_path !~ ('^listings/' || NEW.listing_id::text || '/[^/]+$')
  THEN
    PERFORM public.motodo_raise('INVALID_LISTING_IMAGE_PATH', 'Invalid listing image storage path.');
  END IF;
  RETURN NEW;
END;
$$;

-- ---------------------------------------------------------------------------
-- 4) Storage bucket MIME + size (when columns exist). Path ownership stays in RLS.
--    Storage RLS cannot inspect file bytes; this is the supported bucket-level limit.
-- ---------------------------------------------------------------------------
DO $$
BEGIN
  UPDATE storage.buckets
  SET
    file_size_limit = 5242880,
    allowed_mime_types = ARRAY['image/jpeg', 'image/png', 'image/webp', 'image/gif']
  WHERE id = 'listing-images';
EXCEPTION
  WHEN undefined_column THEN
    RAISE NOTICE 'storage.buckets has no file_size_limit/allowed_mime_types; keep Storage RLS path checks only';
END;
$$;

-- ---------------------------------------------------------------------------
-- 5) Notifications: entity_type + entity_id is the platform resource; link is web-only.
-- ---------------------------------------------------------------------------
COMMENT ON COLUMN public.notifications.entity_type IS
  'Platform resource type. Canonical navigation for web and mobile with entity_id.';
COMMENT ON COLUMN public.notifications.entity_id IS
  'Platform resource UUID. Canonical navigation for web and mobile with entity_type.';
COMMENT ON COLUMN public.notifications.link IS
  'Web SPA path helper only. Native clients must not depend on this column.';

-- ---------------------------------------------------------------------------
-- 6) RPC replacements with motodo_raise + complete_order deduct after complete
-- ---------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.order_row_by_ref(p_order_ref text)
RETURNS public.orders
LANGUAGE plpgsql
STABLE
AS $$
DECLARE
  v_order public.orders;
BEGIN
  IF p_order_ref IS NULL OR length(trim(p_order_ref)) = 0 THEN
    PERFORM public.motodo_raise('ORDER_NOT_FOUND', 'Order not found.');
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
    PERFORM public.motodo_raise('ORDER_NOT_FOUND', 'Order not found.');
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
    PERFORM public.motodo_raise('UNAUTHORIZED', 'You must be logged in to place an order.');
  END IF;

  IF p_listing_id IS NULL THEN
    PERFORM public.motodo_raise('LISTING_NOT_FOUND', 'Motorcycle listing not found.');
  END IF;

  IF p_quantity IS NULL OR p_quantity < 1 THEN
    PERFORM public.motodo_raise('INVALID_QUANTITY', 'Enter a whole number of 1 or more.');
  END IF;

  IF p_delivery_method IS DISTINCT FROM 'pickup' AND p_delivery_method IS DISTINCT FROM 'seller_fleet' THEN
    IF p_delivery_method = 'third_party' THEN
      PERFORM public.motodo_raise('DELIVERY_NOT_AVAILABLE', 'Third-party logistics is not available yet.');
    END IF;
    PERFORM public.motodo_raise('INVALID_DELIVERY_METHOD', 'Select a delivery method.');
  END IF;

  IF p_payment_method IS NOT NULL
    AND p_payment_method IS DISTINCT FROM 'bank_transfer'
    AND p_payment_method IS DISTINCT FROM 'discuss_with_seller'
  THEN
    PERFORM public.motodo_raise('INVALID_PAYMENT_METHOD', 'Select a payment method.');
  END IF;

  IF p_delivery_method = 'seller_fleet' THEN
    IF p_delivery_address IS NULL OR length(trim(p_delivery_address)) = 0 THEN
      PERFORM public.motodo_raise('DELIVERY_ADDRESS_REQUIRED', 'Delivery address is required.');
    END IF;
    IF p_delivery_city IS NULL OR length(trim(p_delivery_city)) = 0 THEN
      PERFORM public.motodo_raise('DELIVERY_CITY_REQUIRED', 'City is required.');
    END IF;
  END IF;

  SELECT * INTO v_listing
  FROM public.listings
  WHERE id = p_listing_id
  FOR UPDATE;

  IF v_listing.id IS NULL THEN
    PERFORM public.motodo_raise('LISTING_NOT_FOUND', 'Motorcycle listing not found.');
  END IF;

  IF COALESCE(v_listing.is_demo, false) THEN
    PERFORM public.motodo_raise('DEMO_LISTING_NOT_FOR_SALE', 'This listing is demo data and cannot be purchased.');
  END IF;

  IF v_listing.status IS DISTINCT FROM 'active' THEN
    PERFORM public.motodo_raise('LISTING_UNAVAILABLE', 'This motorcycle is no longer available.');
  END IF;

  IF v_listing.seller_id = v_buyer_id THEN
    PERFORM public.motodo_raise('SELF_PURCHASE', 'You cannot purchase your own listing.');
  END IF;

  IF NOT EXISTS (
    SELECT 1
    FROM public.seller_profiles sp
    WHERE sp.id = v_listing.seller_id AND sp.seller_status = 'approved'
  ) THEN
    PERFORM public.motodo_raise('LISTING_UNAVAILABLE', 'This motorcycle is no longer available.');
  END IF;

  v_reserved := public.listing_reserved_quantity(v_listing.id);
  v_available := GREATEST(0, v_listing.quantity - v_reserved);

  IF p_quantity > v_available THEN
    PERFORM public.motodo_raise('INSUFFICIENT_STOCK', 'Not enough units available.');
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
    PERFORM public.motodo_raise('UNAUTHORIZED', 'You must be logged in.');
  END IF;

  v_order := public.order_row_by_ref(p_order_ref);

  SELECT * INTO v_order
  FROM public.orders
  WHERE id = v_order.id
  FOR UPDATE;

  IF v_order.status IS DISTINCT FROM 'pending' THEN
    PERFORM public.motodo_raise('INVALID_ORDER_STATE', 'This order status cannot be changed.');
  END IF;

  IF NOT (
    public.is_admin()
    OR v_order.buyer_id = v_actor
    OR v_order.seller_id = v_actor
  ) THEN
    PERFORM public.motodo_raise('FORBIDDEN', 'You don''t have permission to update this order.');
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
    PERFORM public.motodo_raise('UNAUTHORIZED', 'You must be logged in.');
  END IF;

  v_order := public.order_row_by_ref(p_order_ref);

  SELECT * INTO v_order
  FROM public.orders
  WHERE id = v_order.id
  FOR UPDATE;

  IF v_order.status IS DISTINCT FROM 'pending' THEN
    PERFORM public.motodo_raise('INVALID_ORDER_STATE', 'This order status cannot be changed.');
  END IF;

  IF NOT (public.is_admin() OR v_order.seller_id = v_actor) THEN
    PERFORM public.motodo_raise('FORBIDDEN', 'You don''t have permission to update this order.');
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
    PERFORM public.motodo_raise('UNAUTHORIZED', 'You must be logged in.');
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
    PERFORM public.motodo_raise('INVALID_ORDER_STATE', 'This order status cannot be changed.');
  END IF;

  IF NOT (public.is_admin() OR v_order.seller_id = v_actor) THEN
    PERFORM public.motodo_raise('FORBIDDEN', 'You don''t have permission to update this order.');
  END IF;

  IF v_listing.id IS NULL THEN
    PERFORM public.motodo_raise('LISTING_NOT_FOUND', 'Motorcycle listing not found.');
  END IF;

  IF v_listing.quantity < v_order.quantity THEN
    PERFORM public.motodo_raise(
      'INVENTORY_INCONSISTENT',
      'Unable to complete this order because inventory is inconsistent.'
    );
  END IF;

  -- Release reservation first so quantity >= remaining reserved still holds.
  UPDATE public.orders
  SET status = 'completed'
  WHERE id = v_order.id
  RETURNING * INTO v_order;

  v_next_qty := v_listing.quantity - v_order.quantity;

  UPDATE public.listings
  SET
    quantity = v_next_qty,
    status = CASE WHEN v_next_qty = 0 THEN 'sold' ELSE status END
  WHERE id = v_listing.id;

  RETURN v_order;
END;
$$;

CREATE OR REPLACE FUNCTION public.approve_seller_profile(target_id uuid)
RETURNS public.seller_profiles
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  result public.seller_profiles;
BEGIN
  IF NOT public.is_admin() THEN
    PERFORM public.motodo_raise('FORBIDDEN', 'You don''t have permission to do that.');
  END IF;

  UPDATE public.seller_profiles
  SET
    seller_status = 'approved',
    rejection_reason = NULL
  WHERE id = target_id
  RETURNING * INTO result;

  IF result.id IS NULL THEN
    PERFORM public.motodo_raise('SELLER_PROFILE_NOT_FOUND', 'Seller profile not found.');
  END IF;

  RETURN result;
END;
$$;

CREATE OR REPLACE FUNCTION public.reject_seller_profile(target_id uuid, reason text)
RETURNS public.seller_profiles
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  result public.seller_profiles;
  trimmed text;
BEGIN
  IF NOT public.is_admin() THEN
    PERFORM public.motodo_raise('FORBIDDEN', 'You don''t have permission to do that.');
  END IF;

  trimmed := nullif(btrim(coalesce(reason, '')), '');
  IF trimmed IS NULL THEN
    PERFORM public.motodo_raise('REJECTION_REASON_REQUIRED', 'Rejection reason is required.');
  END IF;

  UPDATE public.seller_profiles
  SET
    seller_status = 'rejected',
    rejection_reason = trimmed
  WHERE id = target_id
  RETURNING * INTO result;

  IF result.id IS NULL THEN
    PERFORM public.motodo_raise('SELLER_PROFILE_NOT_FOUND', 'Seller profile not found.');
  END IF;

  RETURN result;
END;
$$;

CREATE OR REPLACE FUNCTION public.start_conversation(p_listing_id uuid)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_buyer_id uuid := auth.uid();
  v_listing public.listings;
  v_cover text;
  v_buyer_name text;
  v_row public.conversations;
  v_created boolean := false;
BEGIN
  IF v_buyer_id IS NULL THEN
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

  IF v_listing.status IS DISTINCT FROM 'active' AND v_listing.status IS DISTINCT FROM 'sold' THEN
    PERFORM public.motodo_raise('LISTING_NOT_FOUND', 'Motorcycle listing not found.');
  END IF;

  IF v_listing.seller_id = v_buyer_id THEN
    PERFORM public.motodo_raise('SELF_CONVERSATION', 'You cannot message yourself.');
  END IF;

  IF NOT EXISTS (
    SELECT 1
    FROM public.seller_profiles sp
    WHERE sp.id = v_listing.seller_id AND sp.seller_status = 'approved'
  ) THEN
    PERFORM public.motodo_raise('LISTING_NOT_FOUND', 'Motorcycle listing not found.');
  END IF;

  SELECT li.public_url INTO v_cover
  FROM public.listing_images li
  WHERE li.listing_id = v_listing.id
  ORDER BY li.sort_order
  LIMIT 1;

  SELECT p.full_name INTO v_buyer_name
  FROM public.profiles p
  WHERE p.id = v_buyer_id;

  INSERT INTO public.conversations (
    listing_id,
    buyer_id,
    seller_id,
    listing_name,
    listing_image,
    buyer_name
  )
  VALUES (
    v_listing.id,
    v_buyer_id,
    v_listing.seller_id,
    v_listing.name,
    v_cover,
    COALESCE(v_buyer_name, '')
  )
  ON CONFLICT (buyer_id, seller_id, listing_id) DO NOTHING
  RETURNING * INTO v_row;

  IF v_row.id IS NULL THEN
    SELECT * INTO v_row
    FROM public.conversations
    WHERE buyer_id = v_buyer_id
      AND seller_id = v_listing.seller_id
      AND listing_id = v_listing.id;
    v_created := false;
  ELSE
    v_created := true;
  END IF;

  IF v_row.id IS NULL THEN
    PERFORM public.motodo_raise('CONVERSATION_START_FAILED', 'Unable to start conversation.');
  END IF;

  RETURN jsonb_build_object(
    'created', v_created,
    'conversation', to_jsonb(v_row)
  );
END;
$$;

CREATE OR REPLACE FUNCTION public.send_message(p_conversation_id uuid, p_body text)
RETURNS public.messages
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_sender uuid := auth.uid();
  v_conversation public.conversations;
  v_body text;
  v_message public.messages;
BEGIN
  IF v_sender IS NULL THEN
    PERFORM public.motodo_raise('UNAUTHORIZED', 'You must be logged in.');
  END IF;

  IF p_conversation_id IS NULL THEN
    PERFORM public.motodo_raise('CONVERSATION_NOT_FOUND', 'Conversation not found.');
  END IF;

  v_body := btrim(COALESCE(p_body, ''));
  IF v_body = '' THEN
    PERFORM public.motodo_raise('MESSAGE_EMPTY', 'Enter a message before sending.');
  END IF;
  IF char_length(v_body) > 5000 THEN
    PERFORM public.motodo_raise('MESSAGE_TOO_LONG', 'Message is too long.');
  END IF;

  SELECT * INTO v_conversation
  FROM public.conversations
  WHERE id = p_conversation_id
  FOR UPDATE;

  IF v_conversation.id IS NULL THEN
    PERFORM public.motodo_raise('CONVERSATION_NOT_FOUND', 'Conversation not found.');
  END IF;

  IF v_conversation.buyer_id IS DISTINCT FROM v_sender
    AND v_conversation.seller_id IS DISTINCT FROM v_sender
  THEN
    PERFORM public.motodo_raise('MESSAGE_NOT_ALLOWED', 'You don''t have permission to access this conversation.');
  END IF;

  INSERT INTO public.messages (conversation_id, sender_id, body)
  VALUES (p_conversation_id, v_sender, v_body)
  RETURNING * INTO v_message;

  UPDATE public.conversations
  SET updated_at = now()
  WHERE id = p_conversation_id;

  RETURN v_message;
END;
$$;

CREATE OR REPLACE FUNCTION public.mark_messages_read(p_conversation_id uuid)
RETURNS integer
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_actor uuid := auth.uid();
  v_conversation public.conversations;
  v_count integer := 0;
BEGIN
  IF v_actor IS NULL THEN
    PERFORM public.motodo_raise('UNAUTHORIZED', 'You must be logged in.');
  END IF;

  SELECT * INTO v_conversation
  FROM public.conversations
  WHERE id = p_conversation_id
  FOR UPDATE;

  IF v_conversation.id IS NULL THEN
    PERFORM public.motodo_raise('CONVERSATION_NOT_FOUND', 'Conversation not found.');
  END IF;

  IF v_conversation.buyer_id IS DISTINCT FROM v_actor
    AND v_conversation.seller_id IS DISTINCT FROM v_actor
  THEN
    PERFORM public.motodo_raise('MESSAGE_NOT_ALLOWED', 'You don''t have permission to access this conversation.');
  END IF;

  UPDATE public.messages
  SET read_at = now()
  WHERE conversation_id = p_conversation_id
    AND sender_id IS DISTINCT FROM v_actor
    AND read_at IS NULL;

  GET DIAGNOSTICS v_count = ROW_COUNT;

  IF v_count > 0 THEN
    UPDATE public.conversations
    SET updated_at = now()
    WHERE id = p_conversation_id;
  END IF;

  RETURN v_count;
END;
$$;

CREATE OR REPLACE FUNCTION public.create_review(
  p_order_ref text,
  p_rating integer,
  p_title text DEFAULT NULL,
  p_body text DEFAULT NULL
)
RETURNS public.reviews
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_buyer uuid := auth.uid();
  v_order public.orders;
  v_title text;
  v_body text;
  v_buyer_name text;
  v_review public.reviews;
BEGIN
  IF v_buyer IS NULL THEN
    PERFORM public.motodo_raise('UNAUTHORIZED', 'You must be logged in to leave a review.');
  END IF;

  v_order := public.order_row_by_ref(p_order_ref);

  IF v_order.buyer_id IS DISTINCT FROM v_buyer THEN
    PERFORM public.motodo_raise('REVIEW_NOT_ALLOWED', 'You don''t have permission to review this order.');
  END IF;

  IF v_order.status IS DISTINCT FROM 'completed' THEN
    PERFORM public.motodo_raise('REVIEW_NOT_ALLOWED', 'You can only review a completed order.');
  END IF;

  IF NOT EXISTS (SELECT 1 FROM public.listings l WHERE l.id = v_order.listing_id) THEN
    PERFORM public.motodo_raise('LISTING_NOT_FOUND', 'Motorcycle listing not found.');
  END IF;

  IF NOT EXISTS (SELECT 1 FROM public.seller_profiles sp WHERE sp.id = v_order.seller_id) THEN
    PERFORM public.motodo_raise('SELLER_NOT_FOUND', 'Seller not found.');
  END IF;

  IF EXISTS (SELECT 1 FROM public.reviews r WHERE r.order_id = v_order.id) THEN
    PERFORM public.motodo_raise('REVIEW_ALREADY_EXISTS', 'You have already reviewed this order.');
  END IF;

  IF p_rating IS NULL OR p_rating < 1 OR p_rating > 5 THEN
    PERFORM public.motodo_raise('INVALID_RATING', 'Select a rating from 1 to 5 stars.');
  END IF;

  v_title := NULLIF(btrim(COALESCE(p_title, '')), '');
  IF v_title IS NOT NULL AND char_length(v_title) > 200 THEN
    PERFORM public.motodo_raise('INVALID_REVIEW_TITLE', 'Title must be 200 characters or fewer.');
  END IF;

  v_body := btrim(COALESCE(p_body, ''));
  IF v_body = '' THEN
    PERFORM public.motodo_raise('INVALID_REVIEW_BODY', 'Comment is required.');
  END IF;
  IF char_length(v_body) < 5 THEN
    PERFORM public.motodo_raise('INVALID_REVIEW_BODY', 'Comment must be at least 5 characters.');
  END IF;
  IF char_length(v_body) > 1000 THEN
    PERFORM public.motodo_raise('INVALID_REVIEW_BODY', 'Comment must be 1000 characters or fewer.');
  END IF;

  SELECT p.full_name INTO v_buyer_name
  FROM public.profiles p
  WHERE p.id = v_buyer;

  INSERT INTO public.reviews (
    order_id,
    listing_id,
    seller_id,
    buyer_id,
    rating,
    title,
    body,
    status,
    order_number,
    listing_name,
    buyer_display_name
  )
  VALUES (
    v_order.id,
    v_order.listing_id,
    v_order.seller_id,
    v_buyer,
    p_rating,
    v_title,
    v_body,
    'published',
    v_order.order_number,
    v_order.listing_name,
    COALESCE(v_buyer_name, 'Buyer')
  )
  RETURNING * INTO v_review;

  RETURN v_review;
EXCEPTION
  WHEN unique_violation THEN
    PERFORM public.motodo_raise('REVIEW_ALREADY_EXISTS', 'You have already reviewed this order.');
END;
$$;

CREATE OR REPLACE FUNCTION public.set_review_status(p_review_id uuid, p_status text)
RETURNS public.reviews
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_review public.reviews;
BEGIN
  IF NOT public.is_admin() THEN
    PERFORM public.motodo_raise('FORBIDDEN', 'You don''t have permission to do that.');
  END IF;

  IF p_status IS DISTINCT FROM 'published' AND p_status IS DISTINCT FROM 'hidden' THEN
    PERFORM public.motodo_raise('INVALID_REVIEW_STATUS', 'Invalid review status.');
  END IF;

  UPDATE public.reviews
  SET status = p_status
  WHERE id = p_review_id
  RETURNING * INTO v_review;

  IF v_review.id IS NULL THEN
    PERFORM public.motodo_raise('REVIEW_NOT_FOUND', 'Review not found.');
  END IF;

  RETURN v_review;
END;
$$;

CREATE OR REPLACE FUNCTION public.mark_notification_read(p_notification_id uuid)
RETURNS public.notifications
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_actor uuid := auth.uid();
  v_row public.notifications;
BEGIN
  IF v_actor IS NULL THEN
    PERFORM public.motodo_raise('UNAUTHORIZED', 'You must be logged in.');
  END IF;

  UPDATE public.notifications
  SET
    is_read = true,
    read_at = COALESCE(read_at, now())
  WHERE id = p_notification_id AND user_id = v_actor
  RETURNING * INTO v_row;

  IF v_row.id IS NULL THEN
    PERFORM public.motodo_raise('NOTIFICATION_NOT_FOUND', 'Notification not found.');
  END IF;
  RETURN v_row;
END;
$$;

CREATE OR REPLACE FUNCTION public.mark_notification_unread(p_notification_id uuid)
RETURNS public.notifications
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_actor uuid := auth.uid();
  v_row public.notifications;
BEGIN
  IF v_actor IS NULL THEN
    PERFORM public.motodo_raise('UNAUTHORIZED', 'You must be logged in.');
  END IF;

  UPDATE public.notifications
  SET
    is_read = false,
    read_at = NULL
  WHERE id = p_notification_id AND user_id = v_actor
  RETURNING * INTO v_row;

  IF v_row.id IS NULL THEN
    PERFORM public.motodo_raise('NOTIFICATION_NOT_FOUND', 'Notification not found.');
  END IF;
  RETURN v_row;
END;
$$;

CREATE OR REPLACE FUNCTION public.mark_all_notifications_read()
RETURNS integer
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_actor uuid := auth.uid();
  v_count integer := 0;
BEGIN
  IF v_actor IS NULL THEN
    PERFORM public.motodo_raise('UNAUTHORIZED', 'You must be logged in.');
  END IF;

  UPDATE public.notifications
  SET
    is_read = true,
    read_at = COALESCE(read_at, now())
  WHERE user_id = v_actor AND is_read = false;

  GET DIAGNOSTICS v_count = ROW_COUNT;
  RETURN v_count;
END;
$$;

REVOKE ALL ON FUNCTION public.order_row_by_ref(text) FROM PUBLIC, anon, authenticated;

COMMENT ON COLUMN public.orders.id IS 'Internal entity UUID. Canonical Order.id for all clients.';
COMMENT ON COLUMN public.orders.order_number IS 'Human-readable MTD-XXXXXXXX. Display and existing web URLs. Not the primary key.';
COMMENT ON COLUMN public.reviews.order_number IS 'Snapshot of orders.order_number. Review.orderId is reviews.order_id (UUID).';

