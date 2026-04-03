
ALTER TABLE public.session_reports
  ADD COLUMN age_group text,
  ADD COLUMN daily_screen_time text,
  ADD COLUMN screen_use_before_test text,
  ADD COLUMN wears_glasses boolean,
  ADD COLUMN lighting_condition text;
