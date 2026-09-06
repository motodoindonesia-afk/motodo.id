-- Motodo.id Phase H — notifications
-- Apply in the Supabase SQL editor or CLI. Do not run from the Vite app.
-- create_notification is SECURITY DEFINER and is NOT granted to authenticated/anon.

CREATE TABLE IF NOT EXISTS public.notifications (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES public.profiles (id) ON DELETE CASCADE,
  type text NOT NULL CHECK (type IN (
    'new_message',
    'new_order',
    'order_confirmed',
    'order_completed',
    'order_cancelled',
    'listing_sold',
    'listing_low_inventory',
    'listing_status',
    'review_reminder',
    'seller_registration',
    'seller_approved',
    'seller_rejected'
  )),
  title text NOT NULL CHECK (char_length(title) BETWEEN 1 AND 200),
  body text NOT NULL CHECK (char_length(body) BETWEEN 1 AND 1000),
  link text,
  entity_type text CHECK (
    entity_type IS NULL OR entity_type IN ('conversation', 'order', 'listing', 'review', 'seller')
  ),
  entity_id uuid,
  is_read boolean NOT NULL DEFAULT false,
  created_at timestamptz NOT NULL DEFAULT now(),
  read_at timestamptz
);

COMMENT ON TABLE public.notifications IS 'Per-user notifications. Created only by trusted SECURITY DEFINER helpers/triggers. Clients may SELECT own rows and mark read via RPC.';
COMMENT ON COLUMN public.notifications.body IS 'Display body. Mapped to Notification.message in the app.';

CREATE INDEX IF NOT EXISTS notifications_user_created_idx ON public.notifications (user_id, created_at DESC);
CREATE INDEX IF NOT EXISTS notifications_user_unread_idx ON public.notifications (user_id) WHERE is_read = false;

-- One-shot events only. new_message and listing_status may repeat.
CREATE UNIQUE INDEX IF NOT EXISTS notifications_once_per_event_idx
  ON public.notifications (user_id, type, entity_id)
  WHERE entity_id IS NOT NULL
    AND type IN (
      'new_order',
      'order_confirmed',
      'order_completed',
      'order_cancelled',
      'listing_sold',
      'listing_low_inventory',
      'review_reminder',
      'seller_registration',
      'seller_approved',
      'seller_rejected'
    );

CREATE OR REPLACE FUNCTION public.create_notification(
  target_user_id uuid,
  notification_type text,
  title text,
  body text,
  link text DEFAULT NULL,
  entity_type text DEFAULT NULL,
  entity_id uuid DEFAULT NULL
)
RETURNS uuid
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_id uuid;
  v_title text := btrim(COALESCE(title, ''));
  v_body text := btrim(COALESCE(body, ''));
BEGIN
  IF target_user_id IS NULL THEN
    RETURN NULL;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM public.profiles p WHERE p.id = target_user_id) THEN
    RETURN NULL;
  END IF;
  IF v_title = '' OR v_body = '' THEN
    RETURN NULL;
  END IF;
  IF char_length(v_title) > 200 OR char_length(v_body) > 1000 THEN
    RETURN NULL;
  END IF;

  INSERT INTO public.notifications (
    user_id, type, title, body, link, entity_type, entity_id
  ) VALUES (
    target_user_id,
    notification_type,
    v_title,
    v_body,
    NULLIF(btrim(COALESCE(link, '')), ''),
    NULLIF(btrim(COALESCE(entity_type, '')), ''),
    entity_id
  )
  RETURNING id INTO v_id;

  RETURN v_id;
EXCEPTION
  WHEN unique_violation THEN
    RETURN NULL;
  WHEN check_violation THEN
    RETURN NULL;
END;
$$;

REVOKE ALL ON FUNCTION public.create_notification(uuid, text, text, text, text, text, uuid) FROM PUBLIC, anon, authenticated;

CREATE OR REPLACE FUNCTION public.notify_listing_low_inventory(
  p_listing_id uuid,
  p_previous_available integer,
  p_next_available integer
)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_listing public.listings;
BEGIN
  SELECT * INTO v_listing FROM public.listings WHERE id = p_listing_id;
  IF v_listing.id IS NULL THEN
    RETURN;
  END IF;
  IF v_listing.status IS DISTINCT FROM 'active' THEN
    RETURN;
  END IF;
  IF COALESCE(p_next_available, 0) <= 0 THEN
    RETURN;
  END IF;
  IF COALESCE(p_next_available, 0) > 2 THEN
    RETURN;
  END IF;
  IF COALESCE(p_previous_available, 0) <= 2 THEN
    RETURN;
  END IF;

  PERFORM public.create_notification(
    v_listing.seller_id,
    'listing_low_inventory',
    'Low Inventory',
    'Only ' || p_next_available::text || ' ' || CASE WHEN p_next_available = 1 THEN 'unit' ELSE 'units' END || ' of ' || v_listing.name || ' remain.',
    '/seller/listings/' || v_listing.id::text,
    'listing',
    v_listing.id
  );
END;
$$;

REVOKE ALL ON FUNCTION public.notify_listing_low_inventory(uuid, integer, integer) FROM PUBLIC, anon, authenticated;

CREATE OR REPLACE FUNCTION public.notify_on_order_change()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_prev_available integer;
  v_next_available integer;
BEGIN
  IF TG_OP = 'INSERT' THEN
    PERFORM public.create_notification(
      NEW.seller_id,
      'new_order',
      'New Order',
      'You received a new order for ' || COALESCE(NEW.listing_name, 'a motorcycle') || '.',
      '/seller/orders/' || NEW.order_number,
      'order',
      NEW.id
    );

    IF NEW.status IN ('pending', 'confirmed') THEN
      v_next_available := public.listing_available_quantity(NEW.listing_id);
      v_prev_available := v_next_available + NEW.quantity;
      PERFORM public.notify_listing_low_inventory(NEW.listing_id, v_prev_available, v_next_available);
    END IF;
    RETURN NEW;
  END IF;

  IF TG_OP = 'UPDATE' AND OLD.status IS DISTINCT FROM NEW.status THEN
    IF OLD.status = 'pending' AND NEW.status = 'confirmed' THEN
      PERFORM public.create_notification(
        NEW.buyer_id,
        'order_confirmed',
        'Order Confirmed',
        'Your order for ' || COALESCE(NEW.listing_name, 'a motorcycle') || ' has been confirmed by the seller.',
        '/orders/' || NEW.order_number,
        'order',
        NEW.id
      );
    ELSIF OLD.status = 'confirmed' AND NEW.status = 'completed' THEN
      PERFORM public.create_notification(
        NEW.buyer_id,
        'order_completed',
        'Order Completed',
        'Your order for ' || COALESCE(NEW.listing_name, 'a motorcycle') || ' has been completed.',
        '/orders/' || NEW.order_number,
        'order',
        NEW.id
      );
      PERFORM public.create_notification(
        NEW.buyer_id,
        'review_reminder',
        'Rate Your Purchase',
        'How was your experience with your ' || COALESCE(NEW.listing_name, 'motorcycle') || '?',
        '/orders/' || NEW.order_number || '#review',
        'order',
        NEW.id
      );
    ELSIF OLD.status = 'pending' AND NEW.status = 'cancelled' THEN
      PERFORM public.create_notification(
        NEW.buyer_id,
        'order_cancelled',
        'Order Cancelled',
        'Your order for ' || COALESCE(NEW.listing_name, 'a motorcycle') || ' has been cancelled.',
        '/orders/' || NEW.order_number,
        'order',
        NEW.id
      );
    END IF;
  END IF;

  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS notify_on_order_change ON public.orders;
CREATE TRIGGER notify_on_order_change
  AFTER INSERT OR UPDATE OF status ON public.orders
  FOR EACH ROW
  EXECUTE FUNCTION public.notify_on_order_change();

CREATE OR REPLACE FUNCTION public.notify_on_listing_change()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF NEW.status = 'sold' AND OLD.status IS DISTINCT FROM 'sold' THEN
    PERFORM public.create_notification(
      NEW.seller_id,
      'listing_sold',
      'Motorcycle Sold',
      'Your ' || NEW.name || ' is now sold out.',
      '/seller/listings/' || NEW.id::text,
      'listing',
      NEW.id
    );
  ELSIF NEW.status IS DISTINCT FROM OLD.status AND NEW.status IS DISTINCT FROM 'sold' THEN
    PERFORM public.create_notification(
      NEW.seller_id,
      'listing_status',
      'Listing Updated',
      'Your ' || NEW.name || ' listing is now ' || lower(NEW.status) || '.',
      '/seller/listings/' || NEW.id::text,
      'listing',
      NEW.id
    );
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS notify_on_listing_change ON public.listings;
CREATE TRIGGER notify_on_listing_change
  AFTER UPDATE OF status ON public.listings
  FOR EACH ROW
  EXECUTE FUNCTION public.notify_on_listing_change();

CREATE OR REPLACE FUNCTION public.notify_on_listing_quantity_change()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_next integer;
  v_prev integer;
BEGIN
  IF NEW.quantity IS NOT DISTINCT FROM OLD.quantity THEN
    RETURN NEW;
  END IF;
  v_next := public.listing_available_quantity(NEW.id);
  v_prev := v_next + (OLD.quantity - NEW.quantity);
  PERFORM public.notify_listing_low_inventory(NEW.id, v_prev, v_next);
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS notify_on_listing_quantity_change ON public.listings;
CREATE TRIGGER notify_on_listing_quantity_change
  AFTER UPDATE OF quantity ON public.listings
  FOR EACH ROW
  EXECUTE FUNCTION public.notify_on_listing_quantity_change();

CREATE OR REPLACE FUNCTION public.notify_on_message_insert()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_conv public.conversations;
  v_target uuid;
  v_link text;
  v_label text;
BEGIN
  SELECT * INTO v_conv FROM public.conversations WHERE id = NEW.conversation_id;
  IF v_conv.id IS NULL THEN
    RETURN NEW;
  END IF;

  IF NEW.sender_id = v_conv.buyer_id THEN
    v_target := v_conv.seller_id;
    v_link := '/seller/messages/' || v_conv.id::text;
    SELECT COALESCE(NULLIF(btrim(p.full_name), ''), 'A buyer') INTO v_label
    FROM public.profiles p
    WHERE p.id = NEW.sender_id;
    PERFORM public.create_notification(
      v_target,
      'new_message',
      'New Message',
      v_label || ' sent you a message about ' || COALESCE(v_conv.listing_name, 'this motorcycle') || '.',
      v_link,
      'conversation',
      v_conv.id
    );
  ELSIF NEW.sender_id = v_conv.seller_id THEN
    v_target := v_conv.buyer_id;
    v_link := '/messages/' || v_conv.id::text;
    SELECT COALESCE(NULLIF(btrim(sp.business_name), ''), 'The seller') INTO v_label
    FROM public.seller_profiles sp
    WHERE sp.id = NEW.sender_id;
    PERFORM public.create_notification(
      v_target,
      'new_message',
      'New Message',
      v_label || ' replied to your message about ' || COALESCE(v_conv.listing_name, 'this motorcycle') || '.',
      v_link,
      'conversation',
      v_conv.id
    );
  END IF;

  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS notify_on_message_insert ON public.messages;
CREATE TRIGGER notify_on_message_insert
  AFTER INSERT ON public.messages
  FOR EACH ROW
  EXECUTE FUNCTION public.notify_on_message_insert();

CREATE OR REPLACE FUNCTION public.notify_on_seller_profile_change()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_admin uuid;
  v_reason text;
BEGIN
  IF TG_OP = 'INSERT' THEN
    FOR v_admin IN SELECT id FROM public.profiles WHERE role = 'admin' LOOP
      PERFORM public.create_notification(
        v_admin,
        'seller_registration',
        'New Seller Registration',
        'A new seller is waiting for verification.',
        '/admin/sellers/' || NEW.id::text,
        'seller',
        NEW.id
      );
    END LOOP;
    RETURN NEW;
  END IF;

  IF NEW.seller_status IS DISTINCT FROM OLD.seller_status THEN
    IF NEW.seller_status = 'approved' THEN
      PERFORM public.create_notification(
        NEW.id,
        'seller_approved',
        'Seller application approved',
        'Your Motodo seller application has been approved. You can now start managing your listings.',
        '/seller/dashboard',
        'seller',
        NEW.id
      );
    ELSIF NEW.seller_status = 'rejected' THEN
      v_reason := NULLIF(btrim(COALESCE(NEW.rejection_reason, '')), '');
      PERFORM public.create_notification(
        NEW.id,
        'seller_rejected',
        'Seller application rejected',
        CASE
          WHEN v_reason IS NOT NULL THEN 'Your Motodo seller application was not approved. ' || left(v_reason, 900)
          ELSE 'Your Motodo seller application was not approved.'
        END,
        '/seller/dashboard',
        'seller',
        NEW.id
      );
    END IF;
  END IF;

  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS notify_on_seller_profile_change ON public.seller_profiles;
CREATE TRIGGER notify_on_seller_profile_change
  AFTER INSERT OR UPDATE OF seller_status, rejection_reason ON public.seller_profiles
  FOR EACH ROW
  EXECUTE FUNCTION public.notify_on_seller_profile_change();

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
    RAISE EXCEPTION 'not authenticated';
  END IF;

  UPDATE public.notifications
  SET
    is_read = true,
    read_at = COALESCE(read_at, now())
  WHERE id = p_notification_id AND user_id = v_actor
  RETURNING * INTO v_row;

  IF v_row.id IS NULL THEN
    RAISE EXCEPTION 'notification not found';
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
    RAISE EXCEPTION 'not authenticated';
  END IF;

  UPDATE public.notifications
  SET
    is_read = false,
    read_at = NULL
  WHERE id = p_notification_id AND user_id = v_actor
  RETURNING * INTO v_row;

  IF v_row.id IS NULL THEN
    RAISE EXCEPTION 'notification not found';
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
    RAISE EXCEPTION 'not authenticated';
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

ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS notifications_select_own ON public.notifications;
CREATE POLICY notifications_select_own
  ON public.notifications
  FOR SELECT
  TO authenticated
  USING (user_id = auth.uid());

DROP POLICY IF EXISTS notifications_insert_deny ON public.notifications;
CREATE POLICY notifications_insert_deny
  ON public.notifications
  FOR INSERT
  TO authenticated
  WITH CHECK (false);

DROP POLICY IF EXISTS notifications_update_deny ON public.notifications;
CREATE POLICY notifications_update_deny
  ON public.notifications
  FOR UPDATE
  TO authenticated
  USING (false)
  WITH CHECK (false);

DROP POLICY IF EXISTS notifications_delete_deny ON public.notifications;
CREATE POLICY notifications_delete_deny
  ON public.notifications
  FOR DELETE
  TO authenticated
  USING (false);

REVOKE ALL ON TABLE public.notifications FROM PUBLIC, anon, authenticated;
GRANT SELECT ON TABLE public.notifications TO authenticated;

REVOKE ALL ON FUNCTION public.mark_notification_read(uuid) FROM PUBLIC;
REVOKE ALL ON FUNCTION public.mark_notification_unread(uuid) FROM PUBLIC;
REVOKE ALL ON FUNCTION public.mark_all_notifications_read() FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.mark_notification_read(uuid) TO authenticated;
GRANT EXECUTE ON FUNCTION public.mark_notification_unread(uuid) TO authenticated;
GRANT EXECUTE ON FUNCTION public.mark_all_notifications_read() TO authenticated;

ALTER TABLE public.notifications REPLICA IDENTITY FULL;

DO $$
BEGIN
  BEGIN
    ALTER PUBLICATION supabase_realtime ADD TABLE public.notifications;
  EXCEPTION
    WHEN duplicate_object THEN NULL;
    WHEN undefined_object THEN NULL;
  END;
END $$;
