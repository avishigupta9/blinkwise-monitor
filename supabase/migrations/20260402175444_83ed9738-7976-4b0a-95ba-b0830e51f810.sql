
CREATE TABLE public.session_reports (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  duration NUMERIC NOT NULL,
  total_blinks INTEGER NOT NULL,
  avg_rate NUMERIC NOT NULL,
  min_rate NUMERIC NOT NULL,
  max_rate NUMERIC NOT NULL,
  percent_below_healthy NUMERIC NOT NULL,
  interpretation TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

ALTER TABLE public.session_reports ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can insert session reports"
  ON public.session_reports FOR INSERT
  WITH CHECK (true);

CREATE POLICY "Anyone can view session reports"
  ON public.session_reports FOR SELECT
  USING (true);
