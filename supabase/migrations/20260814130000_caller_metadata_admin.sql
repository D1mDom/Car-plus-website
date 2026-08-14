-- Allow dashboard admins identified via auth metadata (app_role) to manage users.

CREATE OR REPLACE FUNCTION public.caller_meta_role(_user_id uuid)
RETURNS text
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public, auth
AS $$
  SELECT COALESCE(
    (SELECT raw_user_meta_data->>'app_role' FROM auth.users WHERE id = _user_id),
    ''
  );
$$;

CREATE OR REPLACE FUNCTION public.caller_can_manage_users()
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public, auth
AS $$
  SELECT
    auth.uid() IS NOT NULL
    AND (
      public.is_owner(auth.uid())
      OR public.is_admin(auth.uid())
      OR public.caller_meta_role(auth.uid()) IN ('owner', 'admin')
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
  caller_role text;
BEGIN
  IF auth.uid() IS NULL THEN
    RAISE EXCEPTION 'Not authenticated';
  END IF;

  IF NOT public.caller_can_manage_users() THEN
    RAISE EXCEPTION 'Admin access required';
  END IF;

  caller_role := public.caller_meta_role(auth.uid());
  IF public.is_owner(auth.uid()) OR caller_role = 'owner' THEN
    NULL;
  ELSIF public.is_admin(auth.uid()) OR caller_role = 'admin' THEN
    IF _role NOT IN ('admin', 'staff', 'customer') THEN
      RAISE EXCEPTION 'Admins can assign admin, staff, or customer only';
    END IF;
    IF EXISTS (
      SELECT 1 FROM public.admin_users
      WHERE user_id = _target_user_id AND role = 'owner'
    ) OR public.caller_meta_role(_target_user_id) = 'owner' THEN
      RAISE EXCEPTION 'Cannot change owner role';
    END IF;
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
    ) OR public.caller_meta_role(_target_user_id) = 'owner' THEN
      SELECT COUNT(*) INTO owner_count FROM public.admin_users WHERE role = 'owner';
      IF owner_count <= 1 AND public.caller_meta_role(_target_user_id) = 'owner' THEN
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
  WHERE public.caller_can_manage_users()
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

GRANT EXECUTE ON FUNCTION public.caller_meta_role(uuid) TO authenticated;
GRANT EXECUTE ON FUNCTION public.caller_can_manage_users() TO authenticated;
