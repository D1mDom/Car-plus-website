-- Invoice / receipt table for Car Plus (matches invoice UI)
CREATE TABLE IF NOT EXISTS public.receipts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  receipt_no TEXT NOT NULL UNIQUE,
  order_id UUID REFERENCES public.orders(id) ON DELETE SET NULL,
  customer_name TEXT NOT NULL,
  phone TEXT,
  description TEXT,
  car_name TEXT,
  car_code TEXT,
  year TEXT,
  make TEXT,
  model TEXT,
  unit_price NUMERIC(12, 2) NOT NULL DEFAULT 0,
  qty INTEGER NOT NULL DEFAULT 1,
  tax_rate NUMERIC(5, 2) NOT NULL DEFAULT 0,
  amount NUMERIC(12, 2) NOT NULL DEFAULT 0,
  payment_method TEXT NOT NULL DEFAULT 'cash',
  bank_name TEXT,
  account_no TEXT,
  notes TEXT,
  issued_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Upgrade existing installs
ALTER TABLE public.receipts ADD COLUMN IF NOT EXISTS description TEXT;
ALTER TABLE public.receipts ADD COLUMN IF NOT EXISTS year TEXT;
ALTER TABLE public.receipts ADD COLUMN IF NOT EXISTS make TEXT;
ALTER TABLE public.receipts ADD COLUMN IF NOT EXISTS model TEXT;
ALTER TABLE public.receipts ADD COLUMN IF NOT EXISTS unit_price NUMERIC(12, 2) DEFAULT 0;
ALTER TABLE public.receipts ADD COLUMN IF NOT EXISTS qty INTEGER DEFAULT 1;
ALTER TABLE public.receipts ADD COLUMN IF NOT EXISTS tax_rate NUMERIC(5, 2) DEFAULT 0;
ALTER TABLE public.receipts ADD COLUMN IF NOT EXISTS bank_name TEXT;
ALTER TABLE public.receipts ADD COLUMN IF NOT EXISTS account_no TEXT;

CREATE INDEX IF NOT EXISTS receipts_issued_at_idx ON public.receipts (issued_at DESC);
CREATE INDEX IF NOT EXISTS receipts_order_id_idx ON public.receipts (order_id);

ALTER TABLE public.receipts ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Admins manage receipts" ON public.receipts;
CREATE POLICY "Admins manage receipts"
  ON public.receipts
  FOR ALL
  TO authenticated
  USING (true)
  WITH CHECK (true);
