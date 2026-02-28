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
  role                            TEXT NOT NULL DEFAULT 'project_owner'
                                    CHECK (role IN ('super_admin', 'admin', 'moderator', 'contractor', 'project_owner')),
  is_verified                     BOOLEAN NOT NULL DEFAULT false,
  is_banned                       BOOLEAN NOT NULL DEFAULT false,
  trust_score                     INTEGER NOT NULL DEFAULT 0,
  last_login_at                   TIMESTAMPTZ,
  deleted_at                      TIMESTAMPTZ,
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
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS is_verified BOOLEAN NOT NULL DEFAULT false;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS is_banned BOOLEAN NOT NULL DEFAULT false;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS trust_score INTEGER NOT NULL DEFAULT 0;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS last_login_at TIMESTAMPTZ;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS deleted_at TIMESTAMPTZ;

ALTER TABLE public.profiles DROP CONSTRAINT IF EXISTS profiles_role_check;
ALTER TABLE public.profiles ADD CONSTRAINT profiles_role_check CHECK (
  role IN ('super_admin', 'admin', 'moderator', 'contractor', 'project_owner')
);

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
    CASE
      WHEN COALESCE(NEW.raw_user_meta_data->>'role', 'project_owner') = 'owner' THEN 'project_owner'
      ELSE COALESCE(NEW.raw_user_meta_data->>'role', 'project_owner')
    END
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
DROP POLICY IF EXISTS "Owners can delete own projects" ON public.projects;
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

CREATE POLICY "Owners can delete own projects"
  ON public.projects FOR DELETE
  TO authenticated
  USING (auth.uid() = owner_id);

CREATE POLICY "Owners can read own projects"
  ON public.projects FOR SELECT
  USING (auth.uid() = owner_id);

CREATE POLICY "Authenticated users can read active projects"
  ON public.projects FOR SELECT
  TO authenticated
  USING (status = 'active' AND deadline > now());

CREATE POLICY "Anonymous users can read active projects"
  ON public.projects FOR SELECT
  TO anon
  USING (status = 'active' AND deadline > now());

-- Cleanup helper: hard-delete expired tenders.
CREATE OR REPLACE FUNCTION public.cleanup_expired_projects()
RETURNS INTEGER AS $$
DECLARE
  deleted_count INTEGER;
BEGIN
  DELETE FROM public.projects
  WHERE deadline <= now();

  GET DIAGNOSTICS deleted_count = ROW_COUNT;
  RETURN deleted_count;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

REVOKE ALL ON FUNCTION public.cleanup_expired_projects() FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.cleanup_expired_projects() TO authenticated, anon;

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

-- 9. Offers table
CREATE TABLE IF NOT EXISTS public.offers (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id    UUID NOT NULL REFERENCES public.projects(id) ON DELETE CASCADE,
  contractor_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  owner_id      UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  price_chf     NUMERIC(12,2) NOT NULL,
  message       TEXT NOT NULL,
  attachments   JSONB NOT NULL DEFAULT '[]'::jsonb,
  status        TEXT NOT NULL DEFAULT 'submitted' CHECK (status IN ('submitted', 'accepted', 'rejected')),
  created_at    TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.offers ADD COLUMN IF NOT EXISTS owner_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE;
ALTER TABLE public.offers ADD COLUMN IF NOT EXISTS price_chf NUMERIC(12,2);
ALTER TABLE public.offers ADD COLUMN IF NOT EXISTS message TEXT;
ALTER TABLE public.offers ADD COLUMN IF NOT EXISTS attachments JSONB NOT NULL DEFAULT '[]'::jsonb;
ALTER TABLE public.offers ADD COLUMN IF NOT EXISTS status TEXT NOT NULL DEFAULT 'submitted';

CREATE INDEX IF NOT EXISTS idx_offers_project_id ON public.offers(project_id);
CREATE INDEX IF NOT EXISTS idx_offers_contractor_id ON public.offers(contractor_id);
CREATE INDEX IF NOT EXISTS idx_offers_owner_id ON public.offers(owner_id);

ALTER TABLE public.offers ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Contractors can insert own offers" ON public.offers;
DROP POLICY IF EXISTS "Contractors can read own offers" ON public.offers;
DROP POLICY IF EXISTS "Owners can read offers on own projects" ON public.offers;

CREATE POLICY "Contractors can insert own offers"
  ON public.offers FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = contractor_id);

CREATE POLICY "Contractors can read own offers"
  ON public.offers FOR SELECT
  TO authenticated
  USING (auth.uid() = contractor_id);

CREATE POLICY "Owners can read offers on own projects"
  ON public.offers FOR SELECT
  TO authenticated
  USING (auth.uid() = owner_id);

-- 10. Offer files bucket
INSERT INTO storage.buckets (id, name, public)
VALUES ('offer-files', 'offer-files', true)
ON CONFLICT (id) DO NOTHING;

DROP POLICY IF EXISTS "Offer files public read" ON storage.objects;
DROP POLICY IF EXISTS "Contractors upload offer files" ON storage.objects;
DROP POLICY IF EXISTS "Contractors update offer files" ON storage.objects;
DROP POLICY IF EXISTS "Contractors delete offer files" ON storage.objects;

CREATE POLICY "Offer files public read"
  ON storage.objects FOR SELECT
  USING (bucket_id = 'offer-files');

CREATE POLICY "Contractors upload offer files"
  ON storage.objects FOR INSERT
  TO authenticated
  WITH CHECK (
    bucket_id = 'offer-files'
    AND (storage.foldername(name))[1] = auth.uid()::text
  );

CREATE POLICY "Contractors update offer files"
  ON storage.objects FOR UPDATE
  TO authenticated
  USING (
    bucket_id = 'offer-files'
    AND (storage.foldername(name))[1] = auth.uid()::text
  )
  WITH CHECK (
    bucket_id = 'offer-files'
    AND (storage.foldername(name))[1] = auth.uid()::text
  );

CREATE POLICY "Contractors delete offer files"
  ON storage.objects FOR DELETE
  TO authenticated
  USING (
    bucket_id = 'offer-files'
    AND (storage.foldername(name))[1] = auth.uid()::text
  );

-- 11. Chat tables for live messaging between owner and contractor
CREATE TABLE IF NOT EXISTS public.chats (
  id                       UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id               UUID NOT NULL REFERENCES public.projects(id) ON DELETE CASCADE,
  offer_id                 UUID REFERENCES public.offers(id) ON DELETE SET NULL,
  owner_id                 UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  contractor_id            UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  owner_company_name       TEXT,
  contractor_company_name  TEXT,
  project_title            TEXT,
  created_at               TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at               TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (project_id, owner_id, contractor_id)
);

CREATE TABLE IF NOT EXISTS public.chat_messages (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  chat_id     UUID NOT NULL REFERENCES public.chats(id) ON DELETE CASCADE,
  sender_id   UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  message     TEXT NOT NULL,
  attachments JSONB NOT NULL DEFAULT '[]'::jsonb,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_chats_owner_id ON public.chats(owner_id);
CREATE INDEX IF NOT EXISTS idx_chats_contractor_id ON public.chats(contractor_id);
CREATE INDEX IF NOT EXISTS idx_chat_messages_chat_id ON public.chat_messages(chat_id);

DROP TRIGGER IF EXISTS chats_updated_at ON public.chats;
CREATE TRIGGER chats_updated_at
  BEFORE UPDATE ON public.chats
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at();

ALTER TABLE public.chats ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.chat_messages ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Participants can read chats" ON public.chats;
DROP POLICY IF EXISTS "Participants can insert chats" ON public.chats;
DROP POLICY IF EXISTS "Participants can read chat messages" ON public.chat_messages;
DROP POLICY IF EXISTS "Participants can insert chat messages" ON public.chat_messages;

CREATE POLICY "Participants can read chats"
  ON public.chats FOR SELECT
  TO authenticated
  USING (auth.uid() = owner_id OR auth.uid() = contractor_id);

CREATE POLICY "Participants can insert chats"
  ON public.chats FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = owner_id OR auth.uid() = contractor_id);

CREATE POLICY "Participants can read chat messages"
  ON public.chat_messages FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.chats c
      WHERE c.id = chat_id
        AND (c.owner_id = auth.uid() OR c.contractor_id = auth.uid())
    )
  );

CREATE POLICY "Participants can insert chat messages"
  ON public.chat_messages FOR INSERT
  TO authenticated
  WITH CHECK (
    auth.uid() = sender_id
    AND EXISTS (
      SELECT 1 FROM public.chats c
      WHERE c.id = chat_id
        AND (c.owner_id = auth.uid() OR c.contractor_id = auth.uid())
    )
  );

-- 11b. Per-user chat preferences (mute/favorite/hide)
CREATE TABLE IF NOT EXISTS public.chat_user_settings (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  chat_id      UUID NOT NULL REFERENCES public.chats(id) ON DELETE CASCADE,
  user_id      UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  is_muted     BOOLEAN NOT NULL DEFAULT false,
  is_favorite  BOOLEAN NOT NULL DEFAULT false,
  is_hidden    BOOLEAN NOT NULL DEFAULT false,
  created_at   TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at   TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (chat_id, user_id)
);

CREATE INDEX IF NOT EXISTS idx_chat_user_settings_user_id ON public.chat_user_settings(user_id);
CREATE INDEX IF NOT EXISTS idx_chat_user_settings_chat_id ON public.chat_user_settings(chat_id);

DROP TRIGGER IF EXISTS chat_user_settings_updated_at ON public.chat_user_settings;
CREATE TRIGGER chat_user_settings_updated_at
  BEFORE UPDATE ON public.chat_user_settings
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at();

ALTER TABLE public.chat_user_settings ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can read own chat settings" ON public.chat_user_settings;
DROP POLICY IF EXISTS "Users can insert own chat settings" ON public.chat_user_settings;
DROP POLICY IF EXISTS "Users can update own chat settings" ON public.chat_user_settings;
DROP POLICY IF EXISTS "Users can delete own chat settings" ON public.chat_user_settings;

CREATE POLICY "Users can read own chat settings"
  ON public.chat_user_settings FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own chat settings"
  ON public.chat_user_settings FOR INSERT
  TO authenticated
  WITH CHECK (
    auth.uid() = user_id
    AND EXISTS (
      SELECT 1 FROM public.chats c
      WHERE c.id = chat_id
        AND (c.owner_id = auth.uid() OR c.contractor_id = auth.uid())
    )
  );

CREATE POLICY "Users can update own chat settings"
  ON public.chat_user_settings FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete own chat settings"
  ON public.chat_user_settings FOR DELETE
  TO authenticated
  USING (auth.uid() = user_id);

-- 11c. Blocked users map
CREATE TABLE IF NOT EXISTS public.blocked_users (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  blocker_id  UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  blocked_id  UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (blocker_id, blocked_id),
  CHECK (blocker_id <> blocked_id)
);

CREATE INDEX IF NOT EXISTS idx_blocked_users_blocker_id ON public.blocked_users(blocker_id);
CREATE INDEX IF NOT EXISTS idx_blocked_users_blocked_id ON public.blocked_users(blocked_id);

ALTER TABLE public.blocked_users ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can read related blocks" ON public.blocked_users;
DROP POLICY IF EXISTS "Users can create own blocks" ON public.blocked_users;
DROP POLICY IF EXISTS "Users can remove own blocks" ON public.blocked_users;

CREATE POLICY "Users can read related blocks"
  ON public.blocked_users FOR SELECT
  TO authenticated
  USING (auth.uid() = blocker_id OR auth.uid() = blocked_id);

CREATE POLICY "Users can create own blocks"
  ON public.blocked_users FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = blocker_id AND blocker_id <> blocked_id);

CREATE POLICY "Users can remove own blocks"
  ON public.blocked_users FOR DELETE
  TO authenticated
  USING (auth.uid() = blocker_id);

-- Override insert policy to prevent sending messages while either side is blocked
DROP POLICY IF EXISTS "Participants can insert chat messages" ON public.chat_messages;
CREATE POLICY "Participants can insert chat messages"
  ON public.chat_messages FOR INSERT
  TO authenticated
  WITH CHECK (
    auth.uid() = sender_id
    AND EXISTS (
      SELECT 1 FROM public.chats c
      WHERE c.id = chat_id
        AND (c.owner_id = auth.uid() OR c.contractor_id = auth.uid())
        AND NOT EXISTS (
          SELECT 1
          FROM public.blocked_users b
          WHERE
            (b.blocker_id = auth.uid()
             AND b.blocked_id = CASE WHEN c.owner_id = auth.uid() THEN c.contractor_id ELSE c.owner_id END)
            OR
            (b.blocked_id = auth.uid()
             AND b.blocker_id = CASE WHEN c.owner_id = auth.uid() THEN c.contractor_id ELSE c.owner_id END)
        )
    )
  );

-- 12. Realtime support for live project and chat updates
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

-- 22. Security events hardening (append-only + indexes + retention helper)
ALTER TABLE public.security_events ALTER COLUMN details SET DEFAULT '{}'::jsonb;

CREATE INDEX IF NOT EXISTS idx_security_events_severity_created
  ON public.security_events(severity, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_security_events_actor_created
  ON public.security_events(actor_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_security_events_ip_created
  ON public.security_events(ip_address, created_at DESC);

-- Strict append-only enforcement on updates/deletes.
CREATE OR REPLACE FUNCTION public.prevent_security_events_mutation()
RETURNS trigger AS $$
BEGIN
  IF auth.role() = 'service_role' THEN
    RETURN CASE WHEN TG_OP = 'DELETE' THEN OLD ELSE NEW END;
  END IF;
  RAISE EXCEPTION 'security_events is append-only';
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_security_events_no_update ON public.security_events;
CREATE TRIGGER trg_security_events_no_update
  BEFORE UPDATE ON public.security_events
  FOR EACH ROW
  EXECUTE FUNCTION public.prevent_security_events_mutation();

DROP TRIGGER IF EXISTS trg_security_events_no_delete ON public.security_events;
CREATE TRIGGER trg_security_events_no_delete
  BEFORE DELETE ON public.security_events
  FOR EACH ROW
  EXECUTE FUNCTION public.prevent_security_events_mutation();

-- Retention helper (call from scheduled job/cron).
CREATE OR REPLACE FUNCTION public.cleanup_security_events_older_than(days_old integer DEFAULT 180)
RETURNS integer AS $$
DECLARE
  deleted_count integer;
BEGIN
  DELETE FROM public.security_events
  WHERE created_at < now() - make_interval(days => days_old);

  GET DIAGNOSTICS deleted_count = ROW_COUNT;
  RETURN deleted_count;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

REVOKE ALL ON FUNCTION public.cleanup_security_events_older_than(integer) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.cleanup_security_events_older_than(integer) TO service_role;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM pg_publication_tables
    WHERE pubname = 'supabase_realtime'
      AND schemaname = 'public'
      AND tablename = 'chat_user_settings'
  ) THEN
    ALTER PUBLICATION supabase_realtime ADD TABLE public.chat_user_settings;
  END IF;
END $$;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM pg_publication_tables
    WHERE pubname = 'supabase_realtime'
      AND schemaname = 'public'
      AND tablename = 'blocked_users'
  ) THEN
    ALTER PUBLICATION supabase_realtime ADD TABLE public.blocked_users;
  END IF;
END $$;

-- 15. Chat files bucket (attachments in live chat)
INSERT INTO storage.buckets (id, name, public)
VALUES ('chat-files', 'chat-files', true)
ON CONFLICT (id) DO NOTHING;

DROP POLICY IF EXISTS "Chat files public read" ON storage.objects;
DROP POLICY IF EXISTS "Users upload chat files" ON storage.objects;
DROP POLICY IF EXISTS "Users update chat files" ON storage.objects;
DROP POLICY IF EXISTS "Users delete chat files" ON storage.objects;

CREATE POLICY "Chat files public read"
  ON storage.objects FOR SELECT
  USING (bucket_id = 'chat-files');

CREATE POLICY "Users upload chat files"
  ON storage.objects FOR INSERT
  TO authenticated
  WITH CHECK (
    bucket_id = 'chat-files'
    AND (storage.foldername(name))[1] = auth.uid()::text
  );

CREATE POLICY "Users update chat files"
  ON storage.objects FOR UPDATE
  TO authenticated
  USING (
    bucket_id = 'chat-files'
    AND (storage.foldername(name))[1] = auth.uid()::text
  )
  WITH CHECK (
    bucket_id = 'chat-files'
    AND (storage.foldername(name))[1] = auth.uid()::text
  );

CREATE POLICY "Users delete chat files"
  ON storage.objects FOR DELETE
  TO authenticated
  USING (
    bucket_id = 'chat-files'
    AND (storage.foldername(name))[1] = auth.uid()::text
  );

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

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM pg_publication_tables
    WHERE pubname = 'supabase_realtime'
      AND schemaname = 'public'
      AND tablename = 'chats'
  ) THEN
    ALTER PUBLICATION supabase_realtime ADD TABLE public.chats;
  END IF;
END $$;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM pg_publication_tables
    WHERE pubname = 'supabase_realtime'
      AND schemaname = 'public'
      AND tablename = 'chat_messages'
  ) THEN
    ALTER PUBLICATION supabase_realtime ADD TABLE public.chat_messages;
  END IF;
END $$;

-- Profile enrichment fields for detailed dashboard profiles
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS bio TEXT;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS phone TEXT;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS website TEXT;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS city TEXT;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS address_line TEXT;
ALTER TABLE public.projects ADD COLUMN IF NOT EXISTS custom_category TEXT;

-- 13. Notifications table
CREATE TABLE IF NOT EXISTS public.notifications (
  id         UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id    UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  type       TEXT NOT NULL CHECK (type IN ('project', 'message')),
  title      TEXT NOT NULL,
  body       TEXT,
  meta       JSONB NOT NULL DEFAULT '{}'::jsonb,
  is_read    BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_notifications_user_id ON public.notifications(user_id);
CREATE INDEX IF NOT EXISTS idx_notifications_is_read ON public.notifications(user_id, is_read);

ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can read own notifications" ON public.notifications;
DROP POLICY IF EXISTS "Users can update own notifications" ON public.notifications;
DROP POLICY IF EXISTS "System can insert notifications" ON public.notifications;

CREATE POLICY "Users can read own notifications"
  ON public.notifications FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can update own notifications"
  ON public.notifications FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- Used for client-side MVP inserts; can be tightened later behind server APIs
CREATE POLICY "System can insert notifications"
  ON public.notifications FOR INSERT
  TO authenticated
  WITH CHECK (true);

-- 14. Notification triggers
CREATE OR REPLACE FUNCTION public.notify_pro_contractors_on_project()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.notifications (user_id, type, title, body, meta)
  SELECT
    p.id,
    'project',
    'New project published',
    NEW.title,
    jsonb_build_object('project_id', NEW.id)
  FROM public.profiles p
  WHERE p.role = 'contractor'
    AND p.subscription_status = 'active'
    AND p.plan_type = 'pro'
    AND p.id <> NEW.owner_id;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE OR REPLACE FUNCTION public.notify_chat_recipient_on_message()
RETURNS TRIGGER AS $$
DECLARE
  recipient_id UUID;
  project_title_text TEXT;
BEGIN
  SELECT
    CASE
      WHEN c.owner_id = NEW.sender_id THEN c.contractor_id
      ELSE c.owner_id
    END,
    c.project_title
  INTO recipient_id, project_title_text
  FROM public.chats c
  WHERE c.id = NEW.chat_id;

  IF recipient_id IS NOT NULL AND recipient_id <> NEW.sender_id THEN
    INSERT INTO public.notifications (user_id, type, title, body, meta)
    VALUES (
      recipient_id,
      'message',
      'New message',
      COALESCE(project_title_text, 'Conversation'),
      jsonb_build_object('chat_id', NEW.chat_id, 'message_id', NEW.id)
    );
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS on_project_created_notify ON public.projects;
CREATE TRIGGER on_project_created_notify
  AFTER INSERT ON public.projects
  FOR EACH ROW
  EXECUTE FUNCTION public.notify_pro_contractors_on_project();

DROP TRIGGER IF EXISTS on_chat_message_notify ON public.chat_messages;
CREATE TRIGGER on_chat_message_notify
  AFTER INSERT ON public.chat_messages
  FOR EACH ROW
  EXECUTE FUNCTION public.notify_chat_recipient_on_message();

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM pg_publication_tables
    WHERE pubname = 'supabase_realtime'
      AND schemaname = 'public'
      AND tablename = 'notifications'
  ) THEN
    ALTER PUBLICATION supabase_realtime ADD TABLE public.notifications;
  END IF;
END $$;

-- 16. Bookmarks (saved projects)
CREATE TABLE IF NOT EXISTS public.bookmarks (
  id         UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id    UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  project_id UUID NOT NULL REFERENCES public.projects(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (user_id, project_id)
);

CREATE INDEX IF NOT EXISTS idx_bookmarks_user_id ON public.bookmarks(user_id);
CREATE INDEX IF NOT EXISTS idx_bookmarks_project_id ON public.bookmarks(project_id);

ALTER TABLE public.bookmarks ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can read own bookmarks" ON public.bookmarks;
DROP POLICY IF EXISTS "Users can insert own bookmarks" ON public.bookmarks;
DROP POLICY IF EXISTS "Users can delete own bookmarks" ON public.bookmarks;

CREATE POLICY "Users can read own bookmarks"
  ON public.bookmarks FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own bookmarks"
  ON public.bookmarks FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete own bookmarks"
  ON public.bookmarks FOR DELETE
  TO authenticated
  USING (auth.uid() = user_id);

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM pg_publication_tables
    WHERE pubname = 'supabase_realtime'
      AND schemaname = 'public'
      AND tablename = 'bookmarks'
  ) THEN
    ALTER PUBLICATION supabase_realtime ADD TABLE public.bookmarks;
  END IF;
END $$;

-- 17. Reports table
CREATE TABLE IF NOT EXISTS public.reports (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  reporter_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  target_type TEXT NOT NULL CHECK (target_type IN ('project', 'user', 'message')),
  target_id   UUID NOT NULL,
  reason      TEXT NOT NULL,
  status      TEXT NOT NULL DEFAULT 'open' CHECK (status IN ('open', 'resolved')),
  resolved_by UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
  resolved_at TIMESTAMPTZ,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_reports_status ON public.reports(status);
CREATE INDEX IF NOT EXISTS idx_reports_target ON public.reports(target_type, target_id);
CREATE INDEX IF NOT EXISTS idx_reports_reporter ON public.reports(reporter_id);

ALTER TABLE public.reports ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can read own reports" ON public.reports;
DROP POLICY IF EXISTS "Users can create own reports" ON public.reports;

CREATE POLICY "Users can read own reports"
  ON public.reports FOR SELECT
  TO authenticated
  USING (auth.uid() = reporter_id);

CREATE POLICY "Users can create own reports"
  ON public.reports FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = reporter_id);

-- 18. Feature flags
CREATE TABLE IF NOT EXISTS public.feature_flags (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name        TEXT NOT NULL UNIQUE,
  enabled     BOOLEAN NOT NULL DEFAULT false,
  description TEXT,
  updated_by  UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
  updated_at  TIMESTAMPTZ NOT NULL DEFAULT now(),
  created_at  TIMESTAMPTZ NOT NULL DEFAULT now()
);

DROP TRIGGER IF EXISTS feature_flags_updated_at ON public.feature_flags;
CREATE TRIGGER feature_flags_updated_at
  BEFORE UPDATE ON public.feature_flags
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at();

ALTER TABLE public.feature_flags ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Authenticated users can read feature flags" ON public.feature_flags;
CREATE POLICY "Authenticated users can read feature flags"
  ON public.feature_flags FOR SELECT
  TO authenticated, anon
  USING (true);

-- 19. System settings
CREATE TABLE IF NOT EXISTS public.settings (
  key        TEXT PRIMARY KEY,
  value      JSONB NOT NULL DEFAULT '{}'::jsonb,
  updated_by UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

DROP TRIGGER IF EXISTS settings_updated_at ON public.settings;
CREATE TRIGGER settings_updated_at
  BEFORE UPDATE ON public.settings
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at();

ALTER TABLE public.settings ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Authenticated users can read settings" ON public.settings;
CREATE POLICY "Authenticated users can read settings"
  ON public.settings FOR SELECT
  TO authenticated, anon
  USING (true);

-- 20. Security and audit events
CREATE TABLE IF NOT EXISTS public.security_events (
  id               UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  event_type       TEXT NOT NULL,
  actor_id         UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
  target_user_id   UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
  ip_address       TEXT,
  user_agent       TEXT,
  details          JSONB NOT NULL DEFAULT '{}'::jsonb,
  severity         TEXT NOT NULL DEFAULT 'info' CHECK (severity IN ('info', 'warning', 'critical')),
  created_at       TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_security_events_type_created ON public.security_events(event_type, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_security_events_target_user ON public.security_events(target_user_id);

ALTER TABLE public.security_events ENABLE ROW LEVEL SECURITY;

-- write through server-only service role, not directly by users
DROP POLICY IF EXISTS "No direct read on security_events" ON public.security_events;
CREATE POLICY "No direct read on security_events"
  ON public.security_events FOR SELECT
  TO authenticated
  USING (false);

-- 21. Default feature flags and settings seeds
INSERT INTO public.feature_flags (name, enabled, description)
VALUES
  ('chat_enabled', true, 'Enable/disable chat features'),
  ('free_offers_enabled', false, 'Allow free offer submissions'),
  ('beta_ui', false, 'Enable beta interface'),
  ('country_rollout', true, 'Enable staged country rollout')
ON CONFLICT (name) DO NOTHING;

INSERT INTO public.settings (key, value)
VALUES
  ('subscription_pricing_display', '{"basic":79,"pro":149,"currency":"CHF"}'::jsonb),
  ('offer_limits_per_plan', '{"basic":10,"pro":null}'::jsonb),
  ('homepage_content', '{"heroTitle":"ProBau.ch","heroSubtitle":"Swiss marketplace"}'::jsonb),
  ('footer_content', '{"company":"ProBau.ch","email":"info@probau.ch"}'::jsonb),
  ('maintenance_banner', '{"enabled":false,"message":""}'::jsonb)
ON CONFLICT (key) DO NOTHING;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM pg_publication_tables
    WHERE pubname = 'supabase_realtime'
      AND schemaname = 'public'
      AND tablename = 'feature_flags'
  ) THEN
    ALTER PUBLICATION supabase_realtime ADD TABLE public.feature_flags;
  END IF;
END $$;
