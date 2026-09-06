-- Motodo.id Phase F — conversations + messages + Realtime
-- Apply in the Supabase SQL editor or CLI. Do not run from the Vite app.

CREATE TABLE IF NOT EXISTS public.conversations (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  listing_id uuid REFERENCES public.listings (id) ON DELETE SET NULL,
  buyer_id uuid NOT NULL REFERENCES public.profiles (id) ON DELETE CASCADE,
  seller_id uuid NOT NULL REFERENCES public.seller_profiles (id) ON DELETE CASCADE,
  listing_name text,
  listing_image text,
  buyer_name text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT conversations_buyer_not_seller CHECK (buyer_id <> seller_id),
  CONSTRAINT conversations_buyer_seller_listing_key UNIQUE (buyer_id, seller_id, listing_id)
);

COMMENT ON TABLE public.conversations IS 'Buyer–seller threads. Always listing-based at creation. listing_id may become null if the listing is deleted.';
COMMENT ON COLUMN public.conversations.listing_name IS 'Display snapshot set by start_conversation. Not client-writable.';
COMMENT ON COLUMN public.conversations.buyer_name IS 'Display snapshot of the buyer full name at conversation start.';

CREATE TABLE IF NOT EXISTS public.messages (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  conversation_id uuid NOT NULL REFERENCES public.conversations (id) ON DELETE CASCADE,
  sender_id uuid NOT NULL REFERENCES public.profiles (id) ON DELETE CASCADE,
  body text NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  read_at timestamptz,
  CONSTRAINT messages_body_length CHECK (char_length(btrim(body)) BETWEEN 1 AND 5000)
);

COMMENT ON TABLE public.messages IS 'Chat messages. Insert/read-state only via RPCs. sender_id is always auth.uid().';

CREATE INDEX IF NOT EXISTS conversations_buyer_id_idx ON public.conversations (buyer_id);
CREATE INDEX IF NOT EXISTS conversations_seller_id_idx ON public.conversations (seller_id);
CREATE INDEX IF NOT EXISTS conversations_listing_id_idx ON public.conversations (listing_id);
CREATE INDEX IF NOT EXISTS conversations_updated_at_idx ON public.conversations (updated_at DESC);
CREATE INDEX IF NOT EXISTS messages_conversation_id_created_idx ON public.messages (conversation_id, created_at);
CREATE INDEX IF NOT EXISTS messages_unread_idx ON public.messages (conversation_id) WHERE read_at IS NULL;

CREATE OR REPLACE FUNCTION public.set_conversations_updated_at()
RETURNS trigger
LANGUAGE plpgsql
AS $$
BEGIN
  NEW.updated_at := now();
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS conversations_set_updated_at ON public.conversations;
CREATE TRIGGER conversations_set_updated_at
  BEFORE UPDATE ON public.conversations
  FOR EACH ROW
  EXECUTE FUNCTION public.set_conversations_updated_at();

CREATE OR REPLACE FUNCTION public.is_conversation_participant(p_conversation_id uuid)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.conversations c
    WHERE c.id = p_conversation_id
      AND (c.buyer_id = auth.uid() OR c.seller_id = auth.uid())
  );
$$;

CREATE OR REPLACE VIEW public.conversation_inbox AS
SELECT
  c.id,
  c.listing_id,
  c.buyer_id,
  c.seller_id,
  c.listing_name,
  c.listing_image,
  c.buyer_name,
  c.created_at,
  c.updated_at,
  COALESCE(
    (
      SELECT m.body
      FROM public.messages m
      WHERE m.conversation_id = c.id
      ORDER BY m.created_at DESC
      LIMIT 1
    ),
    ''
  ) AS last_message,
  COALESCE(
    (
      SELECT m.created_at
      FROM public.messages m
      WHERE m.conversation_id = c.id
      ORDER BY m.created_at DESC
      LIMIT 1
    ),
    c.created_at
  ) AS last_message_at,
  (
    SELECT COUNT(*)::integer
    FROM public.messages m
    WHERE m.conversation_id = c.id
      AND m.read_at IS NULL
      AND m.sender_id IS DISTINCT FROM c.buyer_id
  ) AS unread_for_buyer,
  (
    SELECT COUNT(*)::integer
    FROM public.messages m
    WHERE m.conversation_id = c.id
      AND m.read_at IS NULL
      AND m.sender_id IS DISTINCT FROM c.seller_id
  ) AS unread_for_seller
FROM public.conversations c;

ALTER VIEW public.conversation_inbox SET (security_invoker = true);

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
    RAISE EXCEPTION 'not authenticated';
  END IF;

  IF p_listing_id IS NULL THEN
    RAISE EXCEPTION 'listing_not_found';
  END IF;

  SELECT * INTO v_listing
  FROM public.listings
  WHERE id = p_listing_id;

  IF v_listing.id IS NULL THEN
    RAISE EXCEPTION 'listing_not_found';
  END IF;

  IF v_listing.status IS DISTINCT FROM 'active' AND v_listing.status IS DISTINCT FROM 'sold' THEN
    RAISE EXCEPTION 'listing_not_found';
  END IF;

  IF v_listing.seller_id = v_buyer_id THEN
    RAISE EXCEPTION 'self_chat';
  END IF;

  IF NOT EXISTS (
    SELECT 1
    FROM public.seller_profiles sp
    WHERE sp.id = v_listing.seller_id AND sp.seller_status = 'approved'
  ) THEN
    RAISE EXCEPTION 'listing_not_found';
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
    RAISE EXCEPTION 'Unable to start conversation.';
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
    RAISE EXCEPTION 'not authenticated';
  END IF;

  IF p_conversation_id IS NULL THEN
    RAISE EXCEPTION 'conversation not found';
  END IF;

  v_body := btrim(COALESCE(p_body, ''));
  IF v_body = '' THEN
    RAISE EXCEPTION 'Enter a message before sending.';
  END IF;
  IF char_length(v_body) > 5000 THEN
    RAISE EXCEPTION 'Message is too long.';
  END IF;

  SELECT * INTO v_conversation
  FROM public.conversations
  WHERE id = p_conversation_id
  FOR UPDATE;

  IF v_conversation.id IS NULL THEN
    RAISE EXCEPTION 'conversation not found';
  END IF;

  IF v_conversation.buyer_id IS DISTINCT FROM v_sender
    AND v_conversation.seller_id IS DISTINCT FROM v_sender
  THEN
    RAISE EXCEPTION 'You don''t have permission to access this conversation.';
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
    RAISE EXCEPTION 'not authenticated';
  END IF;

  SELECT * INTO v_conversation
  FROM public.conversations
  WHERE id = p_conversation_id
  FOR UPDATE;

  IF v_conversation.id IS NULL THEN
    RAISE EXCEPTION 'conversation not found';
  END IF;

  IF v_conversation.buyer_id IS DISTINCT FROM v_actor
    AND v_conversation.seller_id IS DISTINCT FROM v_actor
  THEN
    RAISE EXCEPTION 'You don''t have permission to access this conversation.';
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

ALTER TABLE public.conversations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.messages ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS conversations_select_participant_or_admin ON public.conversations;
CREATE POLICY conversations_select_participant_or_admin
  ON public.conversations
  FOR SELECT
  TO authenticated
  USING (
    buyer_id = auth.uid()
    OR seller_id = auth.uid()
    OR public.is_admin()
  );

DROP POLICY IF EXISTS conversations_insert_deny ON public.conversations;
CREATE POLICY conversations_insert_deny
  ON public.conversations
  FOR INSERT
  TO authenticated
  WITH CHECK (false);

DROP POLICY IF EXISTS conversations_update_deny ON public.conversations;
CREATE POLICY conversations_update_deny
  ON public.conversations
  FOR UPDATE
  TO authenticated
  USING (false)
  WITH CHECK (false);

DROP POLICY IF EXISTS conversations_delete_deny ON public.conversations;
CREATE POLICY conversations_delete_deny
  ON public.conversations
  FOR DELETE
  TO authenticated
  USING (false);

DROP POLICY IF EXISTS messages_select_participant_or_admin ON public.messages;
CREATE POLICY messages_select_participant_or_admin
  ON public.messages
  FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1
      FROM public.conversations c
      WHERE c.id = conversation_id
        AND (
          c.buyer_id = auth.uid()
          OR c.seller_id = auth.uid()
          OR public.is_admin()
        )
    )
  );

DROP POLICY IF EXISTS messages_insert_deny ON public.messages;
CREATE POLICY messages_insert_deny
  ON public.messages
  FOR INSERT
  TO authenticated
  WITH CHECK (false);

DROP POLICY IF EXISTS messages_update_deny ON public.messages;
CREATE POLICY messages_update_deny
  ON public.messages
  FOR UPDATE
  TO authenticated
  USING (false)
  WITH CHECK (false);

DROP POLICY IF EXISTS messages_delete_deny ON public.messages;
CREATE POLICY messages_delete_deny
  ON public.messages
  FOR DELETE
  TO authenticated
  USING (false);

REVOKE ALL ON TABLE public.conversations FROM PUBLIC, anon, authenticated;
REVOKE ALL ON TABLE public.messages FROM PUBLIC, anon, authenticated;
GRANT SELECT ON TABLE public.conversations TO authenticated;
GRANT SELECT ON TABLE public.messages TO authenticated;
GRANT SELECT ON public.conversation_inbox TO authenticated;

REVOKE ALL ON FUNCTION public.is_conversation_participant(uuid) FROM PUBLIC;
REVOKE ALL ON FUNCTION public.start_conversation(uuid) FROM PUBLIC;
REVOKE ALL ON FUNCTION public.send_message(uuid, text) FROM PUBLIC;
REVOKE ALL ON FUNCTION public.mark_messages_read(uuid) FROM PUBLIC;

GRANT EXECUTE ON FUNCTION public.is_conversation_participant(uuid) TO authenticated;
GRANT EXECUTE ON FUNCTION public.start_conversation(uuid) TO authenticated;
GRANT EXECUTE ON FUNCTION public.send_message(uuid, text) TO authenticated;
GRANT EXECUTE ON FUNCTION public.mark_messages_read(uuid) TO authenticated;

-- Realtime: replica identity FULL is required so RLS can be evaluated on payloads.
ALTER TABLE public.conversations REPLICA IDENTITY FULL;
ALTER TABLE public.messages REPLICA IDENTITY FULL;

DO $$
BEGIN
  BEGIN
    ALTER PUBLICATION supabase_realtime ADD TABLE public.conversations;
  EXCEPTION
    WHEN duplicate_object THEN NULL;
    WHEN undefined_object THEN NULL;
  END;
  BEGIN
    ALTER PUBLICATION supabase_realtime ADD TABLE public.messages;
  EXCEPTION
    WHEN duplicate_object THEN NULL;
    WHEN undefined_object THEN NULL;
  END;
END $$;
