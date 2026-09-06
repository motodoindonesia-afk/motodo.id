-- Motodo.id Phase C — seller_profiles
-- Apply in the Supabase SQL editor or CLI. Do not run from the Vite app.

CREATE TABLE IF NOT EXISTS public.seller_profiles (
  id uuid PRIMARY KEY REFERENCES public.profiles (id) ON DELETE CASCADE,
  business_name text NOT NULL,
  business_type text,
  nib text,
  showroom_name text,
  showroom_address text,
  city text,
  province text,
  phone text,
  description text,
  seller_status text NOT NULL DEFAULT 'pending' CHECK (seller_status IN ('pending', 'approved', 'rejected')),
  rejection_reason text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

COMMENT ON TABLE public.seller_profiles IS 'Seller verification profile. id matches profiles.id / auth.users.id.';
COMMENT ON COLUMN public.seller_profiles.seller_status IS 'pending | approved | rejected. Owners cannot self-approve.';
COMMENT ON COLUMN public.seller_profiles.rejection_reason IS 'Set only by admin reject RPC. Cleared on resubmit or approve.';

CREATE OR REPLACE FUNCTION public.set_seller_profiles_updated_at()
RETURNS trigger
LANGUAGE plpgsql
AS $$
BEGIN
  NEW.updated_at := now();
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS seller_profiles_set_updated_at ON public.seller_profiles;
CREATE TRIGGER seller_profiles_set_updated_at
  BEFORE UPDATE ON public.seller_profiles
  FOR EACH ROW
  EXECUTE FUNCTION public.set_seller_profiles_updated_at();

-- Owners cannot forge id, self-approve, or edit rejection_reason.
-- Owners may resubmit: rejected → pending (reason cleared).
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

  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS protect_seller_profile_columns ON public.seller_profiles;
CREATE TRIGGER protect_seller_profile_columns
  BEFORE INSERT OR UPDATE ON public.seller_profiles
  FOR EACH ROW
  EXECUTE FUNCTION public.protect_seller_profile_columns();

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
    RAISE EXCEPTION 'not authorized';
  END IF;

  UPDATE public.seller_profiles
  SET
    seller_status = 'approved',
    rejection_reason = NULL
  WHERE id = target_id
  RETURNING * INTO result;

  IF result.id IS NULL THEN
    RAISE EXCEPTION 'seller profile not found';
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
    RAISE EXCEPTION 'not authorized';
  END IF;

  trimmed := nullif(btrim(coalesce(reason, '')), '');
  IF trimmed IS NULL THEN
    RAISE EXCEPTION 'rejection reason is required';
  END IF;

  UPDATE public.seller_profiles
  SET
    seller_status = 'rejected',
    rejection_reason = trimmed
  WHERE id = target_id
  RETURNING * INTO result;

  IF result.id IS NULL THEN
    RAISE EXCEPTION 'seller profile not found';
  END IF;

  RETURN result;
END;
$$;

REVOKE ALL ON FUNCTION public.approve_seller_profile(uuid) FROM PUBLIC;
REVOKE ALL ON FUNCTION public.reject_seller_profile(uuid, text) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.approve_seller_profile(uuid) TO authenticated;
GRANT EXECUTE ON FUNCTION public.reject_seller_profile(uuid, text) TO authenticated;

ALTER TABLE public.seller_profiles ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS seller_profiles_select_own_or_admin ON public.seller_profiles;
CREATE POLICY seller_profiles_select_own_or_admin
  ON public.seller_profiles
  FOR SELECT
  TO authenticated
  USING (id = auth.uid() OR public.is_admin());

DROP POLICY IF EXISTS seller_profiles_insert_own ON public.seller_profiles;
CREATE POLICY seller_profiles_insert_own
  ON public.seller_profiles
  FOR INSERT
  TO authenticated
  WITH CHECK (
    id = auth.uid()
    AND seller_status = 'pending'
    AND rejection_reason IS NULL
  );

DROP POLICY IF EXISTS seller_profiles_update_own ON public.seller_profiles;
CREATE POLICY seller_profiles_update_own
  ON public.seller_profiles
  FOR UPDATE
  TO authenticated
  USING (id = auth.uid())
  WITH CHECK (id = auth.uid());

GRANT SELECT, INSERT, UPDATE ON public.seller_profiles TO authenticated;
