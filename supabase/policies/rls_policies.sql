-- supabase/policies/rls_policies.sql
-- Row Level Security policies for TelStudy tables
-- Ensures users can only access their own data

-- =============================================
-- QUESTION_SETS RLS
-- =============================================

ALTER TABLE public.question_sets ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own question sets" ON public.question_sets
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own question sets" ON public.question_sets
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own question sets" ON public.question_sets
  FOR UPDATE USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete own question sets" ON public.question_sets
  FOR DELETE USING (auth.uid() = user_id);

-- =============================================
-- QUIZ_SESSIONS RLS
-- =============================================

ALTER TABLE public.quiz_sessions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own quiz sessions" ON public.quiz_sessions
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own quiz sessions" ON public.quiz_sessions
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own quiz sessions" ON public.quiz_sessions
  FOR UPDATE USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete own quiz sessions" ON public.quiz_sessions
  FOR DELETE USING (auth.uid() = user_id);

-- =============================================
-- QUIZ_ANSWERS RLS (via session ownership)
-- =============================================

ALTER TABLE public.quiz_answers ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own answers" ON public.quiz_answers
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM public.quiz_sessions s
      WHERE s.id = quiz_answers.session_id AND s.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can insert own answers" ON public.quiz_answers
  FOR INSERT WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.quiz_sessions s
      WHERE s.id = quiz_answers.session_id AND s.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can update own answers" ON public.quiz_answers
  FOR UPDATE USING (
    EXISTS (
      SELECT 1 FROM public.quiz_sessions s
      WHERE s.id = quiz_answers.session_id AND s.user_id = auth.uid()
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.quiz_sessions s
      WHERE s.id = quiz_answers.session_id AND s.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can delete own answers" ON public.quiz_answers
  FOR DELETE USING (
    EXISTS (
      SELECT 1 FROM public.quiz_sessions s
      WHERE s.id = quiz_answers.session_id AND s.user_id = auth.uid()
    )
  );
