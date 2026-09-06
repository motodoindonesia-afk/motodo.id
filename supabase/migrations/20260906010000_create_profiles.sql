-- Motodo.id Phase B — profiles
-- Apply in the Supabase SQL editor or CLI. Do not run from the Vite app.

CREATE TABLE IF NOT EXISTS public.profiles (
  id uuid PRIMARY KEY REFERENCES auth.users (id) ON DELETE CASCADE,
  full_name text NOT NULL,
  account_type text NOT NULL CHECK (account_type IN ('buyer', 'seller')),
  role text NOT NULL DEFAULT 'user' CHECK (role IN ('user', 'admin')),
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

COMMENT ON TABLE public.profiles IS 'Motodo account profile. role is never set from client signup metadata.';
COMMENT ON COLUMN public.profiles.account_type IS 'Product intent: buyer or seller. Not an authorization role.';
COMMENT ON COLUMN public.profiles.role IS 'Authorization: user or admin. Never email-based.';

-- Automatic profile on Auth signup. role is always user.
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  meta_account text;
  meta_name text;
BEGIN
  meta_account := lower(coalesce(NEW.raw_user_meta_data ->> 'account_type', ''));
  meta_name := nullif(btrim(coalesce(NEW.raw_user_meta_data ->> 'full_name', '')), '');

  INSERT INTO public.profiles (id, full_name, account_type, role)
  VALUES (
    NEW.id,
    coalesce(meta_name, split_part(NEW.email, '@', 1), 'Motodo user'),
    CASE WHEN meta_account IN ('buyer', 'seller') THEN meta_account ELSE 'buyer' END,
    'user'
  )
  ON CONFLICT (id) DO NOTHING;

  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_new_user();

-- Block client privilege escalation. Dashboard SQL (auth.uid() is null) may set role = admin.
CREATE OR REPLACE FUNCTION public.protect_profile_columns()
RETURNS trigger
LANGUAGE plpgsql
AS $$
BEGIN
  NEW.updated_at := now();

  IF auth.uid() IS NOT NULL AND NEW.role IS DISTINCT FROM OLD.role THEN
    RAISE EXCEPTION 'profiles.role cannot be changed by the authenticated client';
  END IF;

  IF auth.uid() IS NOT NULL AND NEW.account_type IS DISTINCT FROM OLD.account_type THEN
    IF NOT (OLD.account_type = 'buyer' AND NEW.account_type = 'seller') THEN
      RAISE EXCEPTION 'account_type can only change from buyer to seller';
    END IF;
  END IF;

  NEW.id := OLD.id;

  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS protect_profile_columns ON public.profiles;
CREATE TRIGGER protect_profile_columns
  BEFORE UPDATE ON public.profiles
  FOR EACH ROW
  EXECUTE FUNCTION public.protect_profile_columns();

CREATE OR REPLACE FUNCTION public.is_admin()
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.profiles
    WHERE id = auth.uid() AND role = 'admin'
  );
$$;

REVOKE ALL ON FUNCTION public.is_admin() FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.is_admin() TO authenticated;

ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS profiles_select_own_or_admin ON public.profiles;
CREATE POLICY profiles_select_own_or_admin
  ON public.profiles
  FOR SELECT
  TO authenticated
  USING (id = auth.uid() OR public.is_admin());

DROP POLICY IF EXISTS profiles_update_own ON public.profiles;
CREATE POLICY profiles_update_own
  ON public.profiles
  FOR UPDATE
  TO authenticated
  USING (id = auth.uid())
  WITH CHECK (id = auth.uid());

GRANT SELECT, UPDATE ON public.profiles TO authenticated;
