-- ============================================================
-- GovConnect — Supabase PostgreSQL Schema
-- Run this in the Supabase SQL Editor (Dashboard → SQL Editor)
-- ============================================================

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";


-- ────────────────────────────────────────────────────────────
-- PROFILES  (extends Supabase auth.users)
-- ────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.profiles (
  id          UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  name        TEXT        NOT NULL,
  email       TEXT        NOT NULL,
  phone       TEXT,
  role        TEXT        NOT NULL DEFAULT 'citizen'
                CHECK (role IN ('citizen','officer','admin','call_center')),
  department  TEXT,
  badge       TEXT,
  avatar_url  TEXT,
  is_active   BOOLEAN     NOT NULL DEFAULT TRUE,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

-- Users can read their own profile; admins can read all
CREATE POLICY "profiles_select" ON public.profiles
  FOR SELECT USING (
    auth.uid() = id
    OR EXISTS (
      SELECT 1 FROM public.profiles p WHERE p.id = auth.uid() AND p.role = 'admin'
    )
  );

-- Users can update their own profile
CREATE POLICY "profiles_update" ON public.profiles
  FOR UPDATE USING (auth.uid() = id);

-- Allow new profile creation on signup
CREATE POLICY "profiles_insert" ON public.profiles
  FOR INSERT WITH CHECK (auth.uid() = id);


-- ────────────────────────────────────────────────────────────
-- DEPARTMENTS
-- ────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.departments (
  id              UUID        PRIMARY KEY DEFAULT uuid_generate_v4(),
  name            TEXT        NOT NULL UNIQUE,
  code            TEXT        NOT NULL UNIQUE,
  contact_email   TEXT,
  contact_phone   TEXT,
  sla_hours       INTEGER     NOT NULL DEFAULT 48,
  is_active       BOOLEAN     NOT NULL DEFAULT TRUE,
  created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

ALTER TABLE public.departments ENABLE ROW LEVEL SECURITY;
CREATE POLICY "departments_select_all" ON public.departments FOR SELECT USING (TRUE);

-- Seed core departments
INSERT INTO public.departments (name, code, sla_hours) VALUES
  ('Public Works',                 'PWD',    48),
  ('Water Supply',                 'WSD',    24),
  ('Electricity Board',            'ELEC',   12),
  ('Sanitation & Waste',           'SWM',    36),
  ('Public Safety & Police',       'PSP',     6),
  ('Health Department',            'HLTH',   24),
  ('Education Department',         'EDU',    72),
  ('Revenue & Taxation',           'REV',    96),
  ('Noise & Environment',          'ENV',    48),
  ('Encroachment & Land',          'ENC',    72),
  ('General Administration',       'GEN',    96)
ON CONFLICT DO NOTHING;


-- ────────────────────────────────────────────────────────────
-- COMPLAINTS
-- ────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.complaints (
  id                  UUID        PRIMARY KEY DEFAULT uuid_generate_v4(),
  reference_number    TEXT        NOT NULL UNIQUE,

  -- Citizen
  citizen_id          UUID        REFERENCES public.profiles(id),
  citizen_name        TEXT        NOT NULL,
  citizen_phone       TEXT,

  -- Content
  title               TEXT        NOT NULL,
  description         TEXT        NOT NULL,
  original_transcript TEXT,                          -- raw voice transcript
  detected_language   TEXT        DEFAULT 'en',

  -- Classification (AI-filled)
  category            TEXT        NOT NULL DEFAULT 'other'
                        CHECK (category IN (
                          'water_supply','electricity','roads','sanitation',
                          'public_safety','noise','encroachment','taxation',
                          'education','healthcare','other')),
  sub_category        TEXT,
  status              TEXT        NOT NULL DEFAULT 'submitted'
                        CHECK (status IN (
                          'submitted','acknowledged','in_progress',
                          'pending_info','escalated','resolved','closed','rejected')),
  priority            TEXT        NOT NULL DEFAULT 'medium'
                        CHECK (priority IN ('low','medium','high','critical')),
  severity_score      INTEGER     CHECK (severity_score BETWEEN 1 AND 5),
  is_emergency        BOOLEAN     NOT NULL DEFAULT FALSE,

  -- Department & Assignment
  department_id       UUID        REFERENCES public.departments(id),
  department_name     TEXT,
  assigned_officer_id UUID        REFERENCES public.profiles(id),
  assigned_at         TIMESTAMPTZ,

  -- Location
  address             TEXT,
  ward                TEXT,
  district            TEXT,
  pincode             TEXT,
  geo_lat             DOUBLE PRECISION,
  geo_lng             DOUBLE PRECISION,

  -- AI Insights (stored as JSONB)
  ai_insights         JSONB       DEFAULT '{}',

  -- Input mode
  input_mode          TEXT        DEFAULT 'text' CHECK (input_mode IN ('text','audio')),
  audio_url           TEXT,

  -- Timestamps & SLA
  created_at          TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at          TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  resolved_at         TIMESTAMPTZ,
  due_date            TIMESTAMPTZ,

  -- Feedback
  satisfaction_rating INTEGER     CHECK (satisfaction_rating BETWEEN 1 AND 5),
  feedback_note       TEXT
);

ALTER TABLE public.complaints ENABLE ROW LEVEL SECURITY;

-- Citizens see only their own complaints
CREATE POLICY "complaints_citizen_select" ON public.complaints
  FOR SELECT USING (
    citizen_id = auth.uid()
    OR EXISTS (
      SELECT 1 FROM public.profiles p
      WHERE p.id = auth.uid() AND p.role IN ('officer','admin','call_center')
    )
  );

-- Citizens can insert their own complaints
CREATE POLICY "complaints_citizen_insert" ON public.complaints
  FOR INSERT WITH CHECK (citizen_id = auth.uid());

-- Officers and admins can update complaints
CREATE POLICY "complaints_officer_update" ON public.complaints
  FOR UPDATE USING (
    EXISTS (
      SELECT 1 FROM public.profiles p
      WHERE p.id = auth.uid() AND p.role IN ('officer','admin')
    )
  );

-- Reference number generator function
CREATE OR REPLACE FUNCTION generate_reference_number()
RETURNS TRIGGER AS $$
BEGIN
  NEW.reference_number := 'GRV-' || TO_CHAR(NOW(), 'YYYY') || '-' ||
    LPAD(nextval('complaint_ref_seq')::TEXT, 5, '0');
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE SEQUENCE IF NOT EXISTS complaint_ref_seq START 1;

CREATE TRIGGER set_reference_number
  BEFORE INSERT ON public.complaints
  FOR EACH ROW
  WHEN (NEW.reference_number IS NULL OR NEW.reference_number = '')
  EXECUTE FUNCTION generate_reference_number();

-- Auto-update updated_at
CREATE OR REPLACE FUNCTION update_updated_at()
RETURNS TRIGGER AS $$
BEGIN NEW.updated_at = NOW(); RETURN NEW; END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER complaints_updated_at
  BEFORE UPDATE ON public.complaints
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();


-- ────────────────────────────────────────────────────────────
-- COMPLAINT TIMELINE  (status history)
-- ────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.complaint_timeline (
  id            UUID        PRIMARY KEY DEFAULT uuid_generate_v4(),
  complaint_id  UUID        NOT NULL REFERENCES public.complaints(id) ON DELETE CASCADE,
  status        TEXT        NOT NULL,
  note          TEXT,
  updated_by    UUID        REFERENCES public.profiles(id),
  updated_by_name TEXT,
  created_at    TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

ALTER TABLE public.complaint_timeline ENABLE ROW LEVEL SECURITY;
CREATE POLICY "timeline_select" ON public.complaint_timeline
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM public.complaints c
      WHERE c.id = complaint_id AND (
        c.citizen_id = auth.uid()
        OR EXISTS (
          SELECT 1 FROM public.profiles p
          WHERE p.id = auth.uid() AND p.role IN ('officer','admin','call_center')
        )
      )
    )
  );
CREATE POLICY "timeline_insert" ON public.complaint_timeline
  FOR INSERT WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.profiles p
      WHERE p.id = auth.uid() AND p.role IN ('officer','admin','call_center')
    )
  );


-- ────────────────────────────────────────────────────────────
-- ATTACHMENTS
-- ────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.attachments (
  id            UUID        PRIMARY KEY DEFAULT uuid_generate_v4(),
  complaint_id  UUID        NOT NULL REFERENCES public.complaints(id) ON DELETE CASCADE,
  file_name     TEXT        NOT NULL,
  file_type     TEXT,
  file_size     INTEGER,
  storage_path  TEXT        NOT NULL,   -- Supabase Storage path
  public_url    TEXT,
  uploaded_at   TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

ALTER TABLE public.attachments ENABLE ROW LEVEL SECURITY;
CREATE POLICY "attachments_select" ON public.attachments FOR SELECT USING (TRUE);
CREATE POLICY "attachments_insert" ON public.attachments
  FOR INSERT WITH CHECK (auth.uid() IS NOT NULL);


-- ────────────────────────────────────────────────────────────
-- NOTIFICATIONS
-- ────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.notifications (
  id            UUID        PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id       UUID        NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  type          TEXT        NOT NULL,
  title         TEXT        NOT NULL,
  message       TEXT        NOT NULL,
  is_read       BOOLEAN     NOT NULL DEFAULT FALSE,
  link          TEXT,
  metadata      JSONB       DEFAULT '{}',
  created_at    TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;
CREATE POLICY "notifications_own" ON public.notifications
  FOR ALL USING (user_id = auth.uid());


-- ────────────────────────────────────────────────────────────
-- USEFUL VIEWS
-- ────────────────────────────────────────────────────────────

-- Admin dashboard KPIs view
CREATE OR REPLACE VIEW public.complaint_kpis AS
SELECT
  COUNT(*)                                           AS total,
  COUNT(*) FILTER (WHERE status = 'submitted')       AS submitted,
  COUNT(*) FILTER (WHERE status = 'in_progress')     AS in_progress,
  COUNT(*) FILTER (WHERE status = 'escalated')       AS escalated,
  COUNT(*) FILTER (WHERE status = 'resolved')        AS resolved,
  COUNT(*) FILTER (WHERE is_emergency = TRUE)        AS emergencies,
  COUNT(*) FILTER (WHERE assigned_officer_id IS NULL
                     AND status NOT IN ('resolved','closed','rejected')) AS unassigned,
  ROUND(AVG(
    EXTRACT(EPOCH FROM (COALESCE(resolved_at, NOW()) - created_at)) / 3600
  )::NUMERIC, 1)                                     AS avg_resolution_hours,
  COUNT(*) FILTER (
    WHERE created_at >= NOW() - INTERVAL '24 hours'
  )                                                  AS submitted_today
FROM public.complaints;

-- Per-department breakdown view
CREATE OR REPLACE VIEW public.department_stats AS
SELECT
  d.id, d.name, d.code,
  COUNT(c.id)                                          AS total,
  COUNT(c.id) FILTER (WHERE c.status = 'resolved')    AS resolved,
  COUNT(c.id) FILTER (WHERE c.status NOT IN ('resolved','closed','rejected')) AS pending,
  COUNT(c.id) FILTER (WHERE c.status = 'escalated')   AS escalated,
  ROUND(AVG(
    EXTRACT(EPOCH FROM (COALESCE(c.resolved_at, NOW()) - c.created_at)) / 3600
  )::NUMERIC, 1)                                       AS avg_hours
FROM public.departments d
LEFT JOIN public.complaints c ON c.department_id = d.id
GROUP BY d.id, d.name, d.code;
