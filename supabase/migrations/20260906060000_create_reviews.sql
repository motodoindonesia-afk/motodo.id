-- Motodo.id Phase G — reviews & ratings
-- Apply in the Supabase SQL editor or CLI. Do not run from the Vite app.

CREATE TABLE IF NOT EXISTS public.reviews (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  order_id uuid NOT NULL REFERENCES public.orders (id) ON DELETE CASCADE,
  listing_id uuid NOT NULL REFERENCES public.listings (id) ON DELETE CASCADE,
  seller_id uuid NOT NULL REFERENCES public.seller_profiles (id) ON DELETE CASCADE,
  buyer_id uuid NOT NULL REFERENCES public.profiles (id) ON DELETE CASCADE,
  rating integer NOT NULL CHECK (rating BETWEEN 1 AND 5),
  title text,
  body text,
  status text NOT NULL DEFAULT 'published' CHECK (status IN ('published', 'hidden')),
  order_number text NOT NULL,
  listing_name text,
  buyer_display_name text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT reviews_one_per_order UNIQUE (order_id),
  CONSTRAINT reviews_title_length CHECK (title IS NULL OR char_length(title) <= 200),
  CONSTRAINT reviews_body_length CHECK (body IS NULL OR char_length(body) <= 5000)
);

COMMENT ON TABLE public.reviews IS 'Buyer reviews of completed orders. One review per order. Verified Purchase is derived from completed-order eligibility, not a client flag.';
COMMENT ON COLUMN public.reviews.status IS 'published | hidden. Admin hide/publish only. Hidden reviews are not public.';
COMMENT ON COLUMN public.reviews.order_number IS 'Server snapshot of orders.order_number for client lookup (Order.id).';
COMMENT ON COLUMN public.reviews.buyer_display_name IS 'Safe public name snapshot from profiles.full_name at create time.';

CREATE INDEX IF NOT EXISTS reviews_listing_id_idx ON public.reviews (listing_id);
CREATE INDEX IF NOT EXISTS reviews_seller_id_idx ON public.reviews (seller_id);
CREATE INDEX IF NOT EXISTS reviews_buyer_id_idx ON public.reviews (buyer_id);
CREATE INDEX IF NOT EXISTS reviews_status_idx ON public.reviews (status);
CREATE INDEX IF NOT EXISTS reviews_order_number_idx ON public.reviews (order_number);

CREATE OR REPLACE FUNCTION public.set_reviews_updated_at()
RETURNS trigger
LANGUAGE plpgsql
AS $$
BEGIN
  NEW.updated_at := now();
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS reviews_set_updated_at ON public.reviews;
CREATE TRIGGER reviews_set_updated_at
  BEFORE UPDATE ON public.reviews
  FOR EACH ROW
  EXECUTE FUNCTION public.set_reviews_updated_at();

CREATE OR REPLACE VIEW public.listing_rating_summary AS
SELECT
  listing_id,
  COUNT(*)::integer AS review_count,
  ROUND(AVG(rating)::numeric, 1) AS average_rating
FROM public.reviews
WHERE status = 'published'
GROUP BY listing_id;

CREATE OR REPLACE VIEW public.seller_rating_summary AS
SELECT
  seller_id,
  COUNT(*)::integer AS review_count,
  ROUND(AVG(rating)::numeric, 1) AS average_rating
FROM public.reviews
WHERE status = 'published'
GROUP BY seller_id;

ALTER VIEW public.listing_rating_summary SET (security_invoker = true);
ALTER VIEW public.seller_rating_summary SET (security_invoker = true);

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
    RAISE EXCEPTION 'You must be logged in to leave a review.';
  END IF;

  v_order := public.order_row_by_ref(p_order_ref);

  IF v_order.buyer_id IS DISTINCT FROM v_buyer THEN
    RAISE EXCEPTION 'You don''t have permission to review this order.';
  END IF;

  IF v_order.status IS DISTINCT FROM 'completed' THEN
    RAISE EXCEPTION 'You can only review a completed order.';
  END IF;

  IF NOT EXISTS (SELECT 1 FROM public.listings l WHERE l.id = v_order.listing_id) THEN
    RAISE EXCEPTION 'Motorcycle listing not found.';
  END IF;

  IF NOT EXISTS (SELECT 1 FROM public.seller_profiles sp WHERE sp.id = v_order.seller_id) THEN
    RAISE EXCEPTION 'Seller not found.';
  END IF;

  IF EXISTS (SELECT 1 FROM public.reviews r WHERE r.order_id = v_order.id) THEN
    RAISE EXCEPTION 'You have already reviewed this order.';
  END IF;

  IF p_rating IS NULL OR p_rating < 1 OR p_rating > 5 THEN
    RAISE EXCEPTION 'Select a rating from 1 to 5 stars.';
  END IF;

  v_title := NULLIF(btrim(COALESCE(p_title, '')), '');
  IF v_title IS NOT NULL AND char_length(v_title) > 200 THEN
    RAISE EXCEPTION 'Title must be 200 characters or fewer.';
  END IF;

  v_body := btrim(COALESCE(p_body, ''));
  IF v_body = '' THEN
    RAISE EXCEPTION 'Comment is required.';
  END IF;
  IF char_length(v_body) < 5 THEN
    RAISE EXCEPTION 'Comment must be at least 5 characters.';
  END IF;
  IF char_length(v_body) > 1000 THEN
    RAISE EXCEPTION 'Comment must be 1000 characters or fewer.';
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
    RAISE EXCEPTION 'You have already reviewed this order.';
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
    RAISE EXCEPTION 'not authorized';
  END IF;

  IF p_status IS DISTINCT FROM 'published' AND p_status IS DISTINCT FROM 'hidden' THEN
    RAISE EXCEPTION 'Invalid review status.';
  END IF;

  UPDATE public.reviews
  SET status = p_status
  WHERE id = p_review_id
  RETURNING * INTO v_review;

  IF v_review.id IS NULL THEN
    RAISE EXCEPTION 'Review not found.';
  END IF;

  RETURN v_review;
END;
$$;

ALTER TABLE public.reviews ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS reviews_select_public_own_admin ON public.reviews;
CREATE POLICY reviews_select_public_own_admin
  ON public.reviews
  FOR SELECT
  TO anon, authenticated
  USING (
    status = 'published'
    OR buyer_id = auth.uid()
    OR public.is_admin()
  );

DROP POLICY IF EXISTS reviews_insert_deny ON public.reviews;
CREATE POLICY reviews_insert_deny
  ON public.reviews
  FOR INSERT
  TO authenticated
  WITH CHECK (false);

DROP POLICY IF EXISTS reviews_update_deny ON public.reviews;
CREATE POLICY reviews_update_deny
  ON public.reviews
  FOR UPDATE
  TO authenticated
  USING (false)
  WITH CHECK (false);

DROP POLICY IF EXISTS reviews_delete_deny ON public.reviews;
CREATE POLICY reviews_delete_deny
  ON public.reviews
  FOR DELETE
  TO authenticated
  USING (false);

REVOKE ALL ON TABLE public.reviews FROM PUBLIC, anon, authenticated;
GRANT SELECT ON TABLE public.reviews TO anon, authenticated;
GRANT SELECT ON public.listing_rating_summary TO anon, authenticated;
GRANT SELECT ON public.seller_rating_summary TO anon, authenticated;

REVOKE ALL ON FUNCTION public.create_review(text, integer, text, text) FROM PUBLIC;
REVOKE ALL ON FUNCTION public.set_review_status(uuid, text) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.create_review(text, integer, text, text) TO authenticated;
GRANT EXECUTE ON FUNCTION public.set_review_status(uuid, text) TO authenticated;
