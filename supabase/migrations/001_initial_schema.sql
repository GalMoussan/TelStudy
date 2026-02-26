-- supabase/migrations/001_initial_schema.sql
-- TelStudy Initial Schema
-- Creates all core tables: question_sets, quiz_sessions, quiz_answers

-- =============================================
-- TABLES
-- =============================================

CREATE TABLE public.question_sets (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id       UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  name          TEXT NOT NULL,
  file_path     TEXT NOT NULL,
  question_count INT NOT NULL DEFAULT 0,
  created_at    TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE public.quiz_sessions (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id       UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  set_id        UUID NOT NULL REFERENCES public.question_sets(id) ON DELETE CASCADE,
  set_name      TEXT NOT NULL,
  started_at    TIMESTAMPTZ NOT NULL DEFAULT now(),
  completed_at  TIMESTAMPTZ,
  grade         NUMERIC(5,2),
  correct_count INT,
  total_count   INT
);

CREATE TABLE public.quiz_answers (
  id                   UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  session_id           UUID NOT NULL REFERENCES public.quiz_sessions(id) ON DELETE CASCADE,
  question_index       INT NOT NULL,
  selected_index       INT NOT NULL CHECK (selected_index BETWEEN 0 AND 3),
  correct_answer_index INT NOT NULL CHECK (correct_answer_index BETWEEN 0 AND 3),
  is_correct           BOOLEAN NOT NULL,
  time_taken_ms        INT NOT NULL CHECK (time_taken_ms >= 0)
);

-- =============================================
-- INDEXES (Performance)
-- =============================================

CREATE INDEX idx_question_sets_user_id ON public.question_sets(user_id);
CREATE INDEX idx_quiz_sessions_user_id ON public.quiz_sessions(user_id);
CREATE INDEX idx_quiz_sessions_set_id  ON public.quiz_sessions(set_id);
CREATE INDEX idx_quiz_answers_session_id ON public.quiz_answers(session_id);
