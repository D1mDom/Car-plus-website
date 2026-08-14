-- Allow staff admins to assign Admin or Customer roles by email (not Owner).

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

  IF public.is_owner(auth.uid()) THEN
    NULL;
  ELSIF public.is_admin(auth.uid()) THEN
    IF _new_role NOT IN ('admin', 'customer') THEN
      RAISE EXCEPTION 'Admins can assign Admin or Customer only';
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

  IF _new_role NOT IN ('owner', 'admin', 'customer') THEN
    RAISE EXCEPTION 'Invalid role';
  END IF;

  IF _target_user_id = auth.uid() AND _new_role = 'customer' THEN
    RAISE EXCEPTION 'You cannot remove your own staff access';
  END IF;

  IF public.is_owner(auth.uid()) AND _new_role IN ('owner', 'admin') THEN
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
  IF auth.uid() IS NULL THEN
    RAISE EXCEPTION 'Not authenticated';
  END IF;

  IF public.is_owner(auth.uid()) THEN
    NULL;
  ELSIF public.is_admin(auth.uid()) THEN
    IF _new_role NOT IN ('admin', 'customer') THEN
      RAISE EXCEPTION 'Admins can assign Admin or Customer only';
    END IF;
  ELSE
    RAISE EXCEPTION 'Admin access required';
  END IF;

  IF _new_role NOT IN ('owner', 'admin', 'customer') THEN
    RAISE EXCEPTION 'Invalid role';
  END IF;

  SELECT id INTO _uid
  FROM auth.users
  WHERE lower(trim(email)) = lower(trim(_email))
  LIMIT 1;

  IF _uid IS NULL THEN
    RAISE EXCEPTION 'No account with this email.';
  END IF;

  PERFORM public.set_user_role(_uid, _new_role);
  RETURN _uid;
END;
$$;

-- Staff may update phone on profiles when provisioning accounts.
CREATE OR REPLACE FUNCTION public.staff_update_profile_phone(_user_id uuid, _phone text)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF NOT public.is_admin(auth.uid()) THEN
    RAISE EXCEPTION 'Admin access required';
  END IF;

  UPDATE public.profiles
  SET phone = NULLIF(trim(_phone), '')
  WHERE user_id = _user_id;
END;
$$;

GRANT EXECUTE ON FUNCTION public.staff_update_profile_phone(uuid, text) TO authenticated;
