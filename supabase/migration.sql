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
