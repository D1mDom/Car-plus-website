-- Cloud persistence for admin-created users (survives Vercel deploys / new browsers).
-- Stores role in auth.users metadata + profiles; directory reads from Supabase, not localStorage.

CREATE OR REPLACE FUNCTION public.sync_user_app_role(_target_user_id uuid, _role text)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, auth
AS $$
BEGIN
  IF _role NOT IN ('owner', 'admin', 'staff', 'customer') THEN
    RAISE EXCEPTION 'Invalid role';
  END IF;

  UPDATE auth.users
  SET raw_user_meta_data = COALESCE(raw_user_meta_data, '{}'::jsonb)
    || jsonb_build_object('app_role', _role)
  WHERE id = _target_user_id;
END;
$$;

CREATE OR REPLACE FUNCTION public.resolve_directory_role(_user_id uuid, _meta jsonb, _admin_role text)
RETURNS text
LANGUAGE sql
IMMUTABLE
AS $$
  SELECT COALESCE(
    NULLIF(_admin_role, ''),
    NULLIF(_meta->>'app_role', ''),
    'customer'
  );
$$;

CREATE OR REPLACE FUNCTION public.admin_sync_directory_user(
  _target_user_id uuid,
  _full_name text DEFAULT NULL,
  _phone text DEFAULT NULL,
  _role text DEFAULT 'customer'
)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, auth
AS $$
DECLARE
  owner_count integer;
BEGIN
  IF auth.uid() IS NULL THEN
    RAISE EXCEPTION 'Not authenticated';
  END IF;

  IF public.is_owner(auth.uid()) THEN
    NULL;
  ELSIF public.is_admin(auth.uid()) THEN
    IF _role NOT IN ('admin', 'staff', 'customer') THEN
      RAISE EXCEPTION 'Admins can assign admin, staff, or customer only';
    END IF;
    IF EXISTS (
      SELECT 1 FROM public.admin_users
      WHERE user_id = _target_user_id AND role = 'owner'
    ) THEN
      RAISE EXCEPTION 'Cannot change owner role';
    END IF;
  ELSE
    RAISE EXCEPTION 'Admin access required';
  END IF;

  IF _role NOT IN ('owner', 'admin', 'staff', 'customer') THEN
    RAISE EXCEPTION 'Invalid role';
  END IF;

  IF _target_user_id = auth.uid() AND _role = 'customer' THEN
    RAISE EXCEPTION 'You cannot remove your own staff access';
  END IF;

  INSERT INTO public.profiles (user_id, full_name, phone, updated_at)
  VALUES (
    _target_user_id,
    NULLIF(trim(_full_name), ''),
    NULLIF(trim(_phone), ''),
    now()
  )
  ON CONFLICT (user_id) DO UPDATE SET
    full_name = COALESCE(NULLIF(trim(EXCLUDED.full_name), ''), public.profiles.full_name),
    phone = COALESCE(NULLIF(trim(EXCLUDED.phone), ''), public.profiles.phone),
    updated_at = now();

  PERFORM public.sync_user_app_role(_target_user_id, _role);

  IF _role IN ('owner', 'admin') THEN
    INSERT INTO public.admin_users (user_id, role)
    VALUES (_target_user_id, _role)
    ON CONFLICT (user_id) DO UPDATE SET role = EXCLUDED.role;
    RETURN;
  END IF;

  IF _role = 'customer' THEN
    IF EXISTS (
      SELECT 1 FROM public.admin_users
      WHERE user_id = _target_user_id AND role = 'owner'
    ) THEN
      SELECT COUNT(*) INTO owner_count FROM public.admin_users WHERE role = 'owner';
      IF owner_count <= 1 THEN
        RAISE EXCEPTION 'Cannot remove the last owner';
      END IF;
    END IF;
  END IF;

  DELETE FROM public.admin_users WHERE user_id = _target_user_id;
END;
$$;

CREATE OR REPLACE FUNCTION public.list_directory_users()
RETURNS TABLE (
  user_id uuid,
  email text,
  full_name text,
  phone text,
  role text,
  created_at timestamptz
)
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public, auth
AS $$
  SELECT
    u.id AS user_id,
    u.email::text,
    COALESCE(p.full_name, u.raw_user_meta_data->>'full_name') AS full_name,
    p.phone,
    public.resolve_directory_role(u.id, u.raw_user_meta_data, au.role) AS role,
    COALESCE(p.created_at, u.created_at) AS created_at
  FROM auth.users u
  LEFT JOIN public.profiles p ON p.user_id = u.id
  LEFT JOIN public.admin_users au ON au.user_id = u.id
  WHERE public.is_admin(auth.uid())
    AND u.email IS NOT NULL
  ORDER BY
    CASE public.resolve_directory_role(u.id, u.raw_user_meta_data, au.role)
      WHEN 'owner' THEN 0
      WHEN 'admin' THEN 1
      WHEN 'staff' THEN 2
      WHEN 'customer' THEN 3
      ELSE 4
    END,
    COALESCE(p.created_at, u.created_at) DESC;
$$;

GRANT EXECUTE ON FUNCTION public.sync_user_app_role(uuid, text) TO authenticated;
GRANT EXECUTE ON FUNCTION public.admin_sync_directory_user(uuid, text, text, text) TO authenticated;
