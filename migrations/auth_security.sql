-- Enable RLS on public tables
ALTER TABLE public.clientes_maestra ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.inv_docs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.contactos ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.crm_gestion ENABLE ROW LEVEL SECURITY;

-- Create Profiles Table (Extension of auth.users)
CREATE TABLE IF NOT EXISTS public.profiles (
  id uuid REFERENCES auth.users(id) ON DELETE CASCADE PRIMARY KEY,
  tenant_id uuid NOT NULL,
  email text,
  full_name text,
  role text CHECK (role IN ('ADMIN', 'SUPERVISOR', 'AGENTE')),
  created_at timestamp with time zone DEFAULT now()
);

ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

-- Add tenant_id to key tables (if not exists)
-- Note: 'clientes_maestra' already has 'tenant' (text), we ideally want uuid, but for now we might map it or convert. 
-- The user request said "Add tenant_id (UUID)".
-- Let's add it as a new column. We will need to migrate data later or set defaults.
DO $$ 
BEGIN 
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'clientes_maestra' AND column_name = 'tenant_id') THEN
        ALTER TABLE public.clientes_maestra ADD COLUMN tenant_id uuid;
    END IF;

    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'inv_docs' AND column_name = 'tenant_id') THEN
        ALTER TABLE public.inv_docs ADD COLUMN tenant_id uuid;
    END IF;

    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'contactos' AND column_name = 'tenant_id') THEN
        ALTER TABLE public.contactos ADD COLUMN tenant_id uuid;
    END IF;

    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'crm_gestion' AND column_name = 'tenant_id') THEN
        ALTER TABLE public.crm_gestion ADD COLUMN tenant_id uuid;
    END IF;
END $$;

-- Create Policies

-- 1. Profiles: Users can see their own profile
CREATE POLICY "Users can view own profile" ON public.profiles
  FOR SELECT USING (auth.uid() = id);

-- 2. Data Access: Users can view data where tenant_id matches their profile's tenant_id
-- We need a helper function or a join. A common pattern is `auth.uid() IN ...` or using a claim. 
-- For complex RLS, a function is better for performance.

CREATE OR REPLACE FUNCTION get_auth_tenant_id()
RETURNS uuid LANGUAGE sql SECURITY DEFINER STABLE AS $$
  SELECT tenant_id FROM public.profiles WHERE id = auth.uid();
$$;

-- Policies using the function

-- Clientes
CREATE POLICY "Tenant Isolation Select Clientes" ON public.clientes_maestra
  FOR SELECT USING (tenant_id = get_auth_tenant_id());

CREATE POLICY "Tenant Isolation Insert Clientes" ON public.clientes_maestra
  FOR INSERT WITH CHECK (tenant_id = get_auth_tenant_id());

CREATE POLICY "Tenant Isolation Update Clientes" ON public.clientes_maestra
  FOR UPDATE USING (tenant_id = get_auth_tenant_id());

CREATE POLICY "Tenant Isolation Delete Clientes" ON public.clientes_maestra
  FOR DELETE USING (tenant_id = get_auth_tenant_id());

-- Inv Docs
CREATE POLICY "Tenant Isolation Select Invoices" ON public.inv_docs
  FOR SELECT USING (tenant_id = get_auth_tenant_id());
  
CREATE POLICY "Tenant Isolation Insert Invoices" ON public.inv_docs
  FOR INSERT WITH CHECK (tenant_id = get_auth_tenant_id());

CREATE POLICY "Tenant Isolation Update Invoices" ON public.inv_docs
  FOR UPDATE USING (tenant_id = get_auth_tenant_id());

-- Contactos
CREATE POLICY "Tenant Isolation Select Contactos" ON public.contactos
  FOR SELECT USING (tenant_id = get_auth_tenant_id());

CREATE POLICY "Tenant Isolation Insert Contactos" ON public.contactos
  FOR INSERT WITH CHECK (tenant_id = get_auth_tenant_id());
  
-- CRM
CREATE POLICY "Tenant Isolation Select CRM" ON public.crm_gestion
  FOR SELECT USING (tenant_id = get_auth_tenant_id());

CREATE POLICY "Tenant Isolation Insert CRM" ON public.crm_gestion
  FOR INSERT WITH CHECK (tenant_id = get_auth_tenant_id());

