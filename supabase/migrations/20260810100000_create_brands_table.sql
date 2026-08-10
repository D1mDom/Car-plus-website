-- Brands table (Popular brands on home page)
-- Safe to re-run. Until this is applied, the app stores brands via team_members fallback.

CREATE TABLE IF NOT EXISTS public.brands (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL UNIQUE,
  logo TEXT NOT NULL,
  sort_order INTEGER NOT NULL DEFAULT 0,
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

ALTER TABLE public.brands ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Anyone can view active brands" ON public.brands;
DROP POLICY IF EXISTS "Admins can view all brands" ON public.brands;
DROP POLICY IF EXISTS "Admins can insert brands" ON public.brands;
DROP POLICY IF EXISTS "Admins can update brands" ON public.brands;
DROP POLICY IF EXISTS "Admins can delete brands" ON public.brands;

CREATE POLICY "Anyone can view active brands" ON public.brands FOR SELECT USING (is_active = true);
CREATE POLICY "Admins can view all brands" ON public.brands FOR SELECT USING (public.is_admin(auth.uid()));
CREATE POLICY "Admins can insert brands" ON public.brands FOR INSERT WITH CHECK (public.is_admin(auth.uid()));
CREATE POLICY "Admins can update brands" ON public.brands FOR UPDATE USING (public.is_admin(auth.uid()));
CREATE POLICY "Admins can delete brands" ON public.brands FOR DELETE USING (public.is_admin(auth.uid()));

CREATE OR REPLACE TRIGGER update_brands_updated_at
  BEFORE UPDATE ON public.brands
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE INDEX IF NOT EXISTS idx_brands_sort ON public.brands(sort_order);
CREATE INDEX IF NOT EXISTS idx_brands_active ON public.brands(is_active);

NOTIFY pgrst, 'reload schema';
