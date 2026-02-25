-- ============================================================
-- ProBau.ch Database Schema
-- Run this in Supabase SQL Editor (Dashboard → SQL Editor → New Query)
-- ============================================================

-- 1. Create profiles table (extends Supabase auth.users)
CREATE TABLE IF NOT EXISTS public.profiles (
  id                              UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email                           TEXT NOT NULL,
  name                            TEXT NOT NULL DEFAULT '',
  company_name                    TEXT NOT NULL DEFAULT '',
  profile_title                   TEXT,
  avatar_url                      TEXT,
  role                            TEXT NOT NULL DEFAULT 'owner'
                                    CHECK (role IN ('owner', 'contractor')),
  stripe_customer_id              TEXT UNIQUE,
  subscription_status             TEXT NOT NULL DEFAULT 'none'
                                    CHECK (subscription_status IN ('active', 'canceled', 'past_due', 'none')),
  plan_type                       TEXT CHECK (plan_type IN ('basic', 'pro')),
  offer_count_this_month          INTEGER NOT NULL DEFAULT 0,
  subscription_current_period_end TIMESTAMPTZ,
  created_at                      TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at                      TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS profile_title TEXT;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS avatar_url TEXT;

-- 2. Enable Row Level Security
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

-- 3. RLS Policies (drop first to avoid conflicts)
DROP POLICY IF EXISTS "Users can read own profile" ON public.profiles;
DROP POLICY IF EXISTS "Users can update own profile" ON public.profiles;

CREATE POLICY "Users can read own profile"
  ON public.profiles FOR SELECT
  USING (auth.uid() = id);

CREATE POLICY "Users can update own profile"
  ON public.profiles FOR UPDATE
  USING (auth.uid() = id)
  WITH CHECK (auth.uid() = id);

-- 4. Auto-create profile on signup
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (id, email, name, company_name, profile_title, avatar_url, role)
  VALUES (
    NEW.id,
    NEW.email,
    COALESCE(NEW.raw_user_meta_data->>'name', ''),
    COALESCE(NEW.raw_user_meta_data->>'company_name', ''),
    NULLIF(COALESCE(NEW.raw_user_meta_data->>'profile_title', ''), ''),
    NULLIF(COALESCE(NEW.raw_user_meta_data->>'avatar_url', ''), ''),
    COALESCE(NEW.raw_user_meta_data->>'role', 'owner')
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_new_user();

-- 5. Auto-update updated_at timestamp
CREATE OR REPLACE FUNCTION public.update_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS profiles_updated_at ON public.profiles;
CREATE TRIGGER profiles_updated_at
  BEFORE UPDATE ON public.profiles
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at();

-- 6. Atomic offer count increment function
CREATE OR REPLACE FUNCTION public.increment_offer_count(user_id UUID)
RETURNS INTEGER AS $$
DECLARE
  new_count INTEGER;
BEGIN
  UPDATE public.profiles
    SET offer_count_this_month = offer_count_this_month + 1,
        updated_at = now()
    WHERE id = user_id
    RETURNING offer_count_this_month INTO new_count;
  RETURN new_count;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 7. Projects table (published tenders)
CREATE TABLE IF NOT EXISTS public.projects (
  id                 UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  owner_id           UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  title              TEXT NOT NULL,
  address            TEXT NOT NULL,
  category           TEXT NOT NULL,
  project_type       TEXT,
  service            TEXT NOT NULL,
  deadline           TIMESTAMPTZ NOT NULL,
  status             TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'closed')),
  attachments        JSONB NOT NULL DEFAULT '[]'::jsonb,
  owner_company_name TEXT,
  owner_profile_title TEXT,
  owner_avatar_url   TEXT,
  created_at         TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at         TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_projects_owner_id ON public.projects(owner_id);
CREATE INDEX IF NOT EXISTS idx_projects_status ON public.projects(status);
CREATE INDEX IF NOT EXISTS idx_projects_deadline ON public.projects(deadline);

DROP TRIGGER IF EXISTS projects_updated_at ON public.projects;
CREATE TRIGGER projects_updated_at
  BEFORE UPDATE ON public.projects
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at();

ALTER TABLE public.projects ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Owners can insert own projects" ON public.projects;
DROP POLICY IF EXISTS "Owners can update own projects" ON public.projects;
DROP POLICY IF EXISTS "Owners can read own projects" ON public.projects;
DROP POLICY IF EXISTS "Authenticated users can read active projects" ON public.projects;
DROP POLICY IF EXISTS "Anonymous users can read active projects" ON public.projects;

CREATE POLICY "Owners can insert own projects"
  ON public.projects FOR INSERT
  WITH CHECK (auth.uid() = owner_id);

CREATE POLICY "Owners can update own projects"
  ON public.projects FOR UPDATE
  USING (auth.uid() = owner_id)
  WITH CHECK (auth.uid() = owner_id);

CREATE POLICY "Owners can read own projects"
  ON public.projects FOR SELECT
  USING (auth.uid() = owner_id);

CREATE POLICY "Authenticated users can read active projects"
  ON public.projects FOR SELECT
  TO authenticated
  USING (status = 'active');

CREATE POLICY "Anonymous users can read active projects"
  ON public.projects FOR SELECT
  TO anon
  USING (status = 'active');

-- 8. Files bucket for project attachments
INSERT INTO storage.buckets (id, name, public)
VALUES ('project-files', 'project-files', true)
ON CONFLICT (id) DO NOTHING;

DROP POLICY IF EXISTS "Project files public read" ON storage.objects;
DROP POLICY IF EXISTS "Owners upload project files" ON storage.objects;
DROP POLICY IF EXISTS "Owners update project files" ON storage.objects;
DROP POLICY IF EXISTS "Owners delete project files" ON storage.objects;

CREATE POLICY "Project files public read"
  ON storage.objects FOR SELECT
  USING (bucket_id = 'project-files');

CREATE POLICY "Owners upload project files"
  ON storage.objects FOR INSERT
  TO authenticated
  WITH CHECK (
    bucket_id = 'project-files'
    AND (storage.foldername(name))[1] = auth.uid()::text
  );

CREATE POLICY "Owners update project files"
  ON storage.objects FOR UPDATE
  TO authenticated
  USING (
    bucket_id = 'project-files'
    AND (storage.foldername(name))[1] = auth.uid()::text
  )
  WITH CHECK (
    bucket_id = 'project-files'
    AND (storage.foldername(name))[1] = auth.uid()::text
  );

CREATE POLICY "Owners delete project files"
  ON storage.objects FOR DELETE
  TO authenticated
  USING (
    bucket_id = 'project-files'
    AND (storage.foldername(name))[1] = auth.uid()::text
  );

-- 9. Realtime support for project live updates
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM pg_publication_tables
    WHERE pubname = 'supabase_realtime'
      AND schemaname = 'public'
      AND tablename = 'projects'
  ) THEN
    ALTER PUBLICATION supabase_realtime ADD TABLE public.projects;
  END IF;
END $$;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM pg_publication_tables
    WHERE pubname = 'supabase_realtime'
      AND schemaname = 'public'
      AND tablename = 'offers'
  ) THEN
    ALTER PUBLICATION supabase_realtime ADD TABLE public.offers;
  END IF;
END $$;
