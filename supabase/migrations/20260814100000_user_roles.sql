-- Owner / admin / customer roles for dashboard access.
-- Customers = registered users without a row in admin_users.

ALTER TABLE public.admin_users
  ADD COLUMN IF NOT EXISTS role TEXT NOT NULL DEFAULT 'admin'
  CHECK (role IN ('owner', 'admin'));

-- Promote the first admin to owner if none exists (safe for fresh + existing DBs).
UPDATE public.admin_users
SET role = 'owner'
WHERE user_id = (
  SELECT user_id FROM public.admin_users ORDER BY created_at ASC LIMIT 1
)
AND NOT EXISTS (SELECT 1 FROM public.admin_users WHERE role = 'owner');

CREATE OR REPLACE FUNCTION public.is_owner(_user_id uuid)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.admin_users
    WHERE user_id = _user_id AND role = 'owner'
  )
$$;

CREATE OR REPLACE FUNCTION public.get_my_role()
RETURNS text
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT CASE
    WHEN public.is_owner(auth.uid()) THEN 'owner'
    WHEN public.is_admin(auth.uid()) THEN 'admin'
    ELSE 'customer'
  END
$$;

CREATE OR REPLACE FUNCTION public.set_user_role(_target_user_id uuid, _new_role text)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  owner_count integer;
BEGIN
  IF auth.uid() IS NULL THEN
    RAISE EXCEPTION 'Not authenticated';
  END IF;

  IF NOT public.is_owner(auth.uid()) THEN
    RAISE EXCEPTION 'Only owners can change roles';
  END IF;

  IF _new_role NOT IN ('owner', 'admin', 'customer') THEN
    RAISE EXCEPTION 'Invalid role';
  END IF;

  IF _target_user_id = auth.uid() AND _new_role = 'customer' THEN
    RAISE EXCEPTION 'You cannot remove your own staff access';
  END IF;

  IF _new_role IN ('owner', 'admin') THEN
    IF EXISTS (
      SELECT 1 FROM public.admin_users
      WHERE user_id = _target_user_id AND role = 'owner' AND _new_role = 'admin'
    ) THEN
      SELECT COUNT(*) INTO owner_count FROM public.admin_users WHERE role = 'owner';
      IF owner_count <= 1 THEN
        RAISE EXCEPTION 'Cannot demote the last owner';
      END IF;
    END IF;
  END IF;

  IF _new_role = 'customer' THEN
    IF EXISTS (
      SELECT 1 FROM public.admin_users
      WHERE user_id = _target_user_id AND role = 'owner'
    ) THEN
      SELECT COUNT(*) INTO owner_count FROM public.admin_users WHERE role = 'owner';
      IF owner_count <= 1 THEN
        RAISE EXCEPTION 'Cannot remove the last owner';
      END IF;
    END IF;
    DELETE FROM public.admin_users WHERE user_id = _target_user_id;
    RETURN;
  END IF;

  INSERT INTO public.admin_users (user_id, role)
  VALUES (_target_user_id, _new_role)
  ON CONFLICT (user_id) DO UPDATE SET role = EXCLUDED.role;
END;
$$;

CREATE OR REPLACE FUNCTION public.assign_role_by_email(_email text, _new_role text)
RETURNS uuid
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  _uid uuid;
BEGIN
  IF NOT public.is_owner(auth.uid()) THEN
    RAISE EXCEPTION 'Only owners can assign roles';
  END IF;

  SELECT id INTO _uid
  FROM auth.users
  WHERE lower(trim(email)) = lower(trim(_email))
  LIMIT 1;

  IF _uid IS NULL THEN
    RAISE EXCEPTION 'No account with this email. Ask them to sign up on the website first.';
  END IF;

  PERFORM public.set_user_role(_uid, _new_role);
  RETURN _uid;
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
SET search_path = public
AS $$
  SELECT
    p.user_id,
    u.email::text,
    p.full_name,
    p.phone,
    COALESCE(au.role, 'customer') AS role,
    p.created_at
  FROM public.profiles p
  INNER JOIN auth.users u ON u.id = p.user_id
  LEFT JOIN public.admin_users au ON au.user_id = p.user_id
  WHERE public.is_admin(auth.uid())
  ORDER BY
    CASE COALESCE(au.role, 'customer')
      WHEN 'owner' THEN 0
      WHEN 'admin' THEN 1
      ELSE 2
    END,
    p.created_at DESC;
$$;

GRANT EXECUTE ON FUNCTION public.is_owner(uuid) TO authenticated;
GRANT EXECUTE ON FUNCTION public.get_my_role() TO authenticated;
GRANT EXECUTE ON FUNCTION public.set_user_role(uuid, text) TO authenticated;
GRANT EXECUTE ON FUNCTION public.assign_role_by_email(text, text) TO authenticated;
GRANT EXECUTE ON FUNCTION public.list_directory_users() TO authenticated;
