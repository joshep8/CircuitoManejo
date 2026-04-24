CREATE INDEX IF NOT EXISTS idx_bookings_estado_fecha
  ON public.bookings (estado, fecha DESC);

CREATE INDEX IF NOT EXISTS idx_bookings_user_estado
  ON public.bookings (user_id, estado);

CREATE INDEX IF NOT EXISTS idx_bookings_instructor_fecha
  ON public.bookings (instructor_id, fecha DESC);

CREATE INDEX IF NOT EXISTS idx_payments_estado_expires
  ON public.payments (estado, expires_at);

CREATE INDEX IF NOT EXISTS idx_payments_user
  ON public.payments (user_id);

CREATE INDEX IF NOT EXISTS idx_user_roles_user
  ON public.user_roles (user_id);

CREATE INDEX IF NOT EXISTS idx_instructors_activo
  ON public.instructors (activo) WHERE activo = true;