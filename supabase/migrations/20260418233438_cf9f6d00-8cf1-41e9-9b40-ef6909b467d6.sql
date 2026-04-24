-- =========================================
-- ENUMS
-- =========================================
CREATE TYPE public.app_role AS ENUM ('usuario', 'instructor', 'administrador');
CREATE TYPE public.license_type AS ENUM ('A-I', 'A-IIa', 'A-IIb');
CREATE TYPE public.booking_status AS ENUM ('pendiente', 'confirmada', 'cancelada', 'expirada', 'completada');
CREATE TYPE public.payment_status AS ENUM ('pendiente', 'pagado', 'expirado', 'fallido');

-- =========================================
-- PROFILES (datos personales)
-- =========================================
CREATE TABLE public.profiles (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL UNIQUE REFERENCES auth.users(id) ON DELETE CASCADE,
  dni TEXT NOT NULL UNIQUE,
  nombres TEXT NOT NULL,
  apellidos TEXT NOT NULL,
  correo TEXT NOT NULL,
  telefono TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

-- =========================================
-- USER ROLES (separado para evitar escalación)
-- =========================================
CREATE TABLE public.user_roles (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  role app_role NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (user_id, role)
);

ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;

-- Security definer function para verificar roles sin recursión
CREATE OR REPLACE FUNCTION public.has_role(_user_id UUID, _role app_role)
RETURNS BOOLEAN
LANGUAGE SQL
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.user_roles
    WHERE user_id = _user_id AND role = _role
  )
$$;

-- =========================================
-- INSTRUCTORS (info pública de cada instructor)
-- =========================================
CREATE TABLE public.instructors (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL UNIQUE REFERENCES auth.users(id) ON DELETE CASCADE,
  nombres TEXT NOT NULL,
  apellidos TEXT NOT NULL,
  dni TEXT NOT NULL UNIQUE,
  correo TEXT NOT NULL,
  telefono TEXT,
  licencias license_type[] NOT NULL DEFAULT ARRAY['A-I', 'A-IIa', 'A-IIb']::license_type[],
  bio TEXT,
  activo BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.instructors ENABLE ROW LEVEL SECURITY;

-- =========================================
-- BOOKINGS (reservas)
-- =========================================
CREATE TABLE public.bookings (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  instructor_id UUID NOT NULL REFERENCES public.instructors(id) ON DELETE RESTRICT,
  licencia license_type NOT NULL,
  fecha DATE NOT NULL,
  hora TIME NOT NULL,
  -- snapshot de los datos del cliente al momento de la reserva
  cliente_dni TEXT NOT NULL,
  cliente_nombres TEXT NOT NULL,
  cliente_apellidos TEXT NOT NULL,
  cliente_correo TEXT NOT NULL,
  cliente_telefono TEXT NOT NULL,
  estado booking_status NOT NULL DEFAULT 'pendiente',
  precio NUMERIC(10,2) NOT NULL DEFAULT 80.00,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (instructor_id, fecha, hora)
);

ALTER TABLE public.bookings ENABLE ROW LEVEL SECURITY;

CREATE INDEX idx_bookings_user ON public.bookings(user_id);
CREATE INDEX idx_bookings_instructor ON public.bookings(instructor_id);
CREATE INDEX idx_bookings_fecha ON public.bookings(fecha);

-- =========================================
-- PAYMENTS (pagos simulados Yape)
-- =========================================
CREATE TABLE public.payments (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  booking_id UUID NOT NULL UNIQUE REFERENCES public.bookings(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  metodo TEXT NOT NULL DEFAULT 'yape',
  monto NUMERIC(10,2) NOT NULL,
  estado payment_status NOT NULL DEFAULT 'pendiente',
  codigo_operacion TEXT,
  expires_at TIMESTAMPTZ NOT NULL,
  paid_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.payments ENABLE ROW LEVEL SECURITY;

-- =========================================
-- TRIGGER: actualizar updated_at
-- =========================================
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER
LANGUAGE plpgsql
SET search_path = public
AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$;

CREATE TRIGGER update_profiles_updated_at
  BEFORE UPDATE ON public.profiles
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_instructors_updated_at
  BEFORE UPDATE ON public.instructors
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_bookings_updated_at
  BEFORE UPDATE ON public.bookings
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- =========================================
-- TRIGGER: crear perfil automático y rol 'usuario' al registrarse
-- =========================================
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- Crear perfil con metadata pasada en signUp
  INSERT INTO public.profiles (user_id, dni, nombres, apellidos, correo, telefono)
  VALUES (
    NEW.id,
    COALESCE(NEW.raw_user_meta_data->>'dni', ''),
    COALESCE(NEW.raw_user_meta_data->>'nombres', ''),
    COALESCE(NEW.raw_user_meta_data->>'apellidos', ''),
    NEW.email,
    COALESCE(NEW.raw_user_meta_data->>'telefono', '')
  )
  ON CONFLICT (user_id) DO NOTHING;

  -- Asignar rol 'usuario' por defecto (admin/instructor se asignan manualmente)
  INSERT INTO public.user_roles (user_id, role)
  VALUES (NEW.id, 'usuario'::app_role)
  ON CONFLICT (user_id, role) DO NOTHING;

  RETURN NEW;
END;
$$;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- =========================================
-- RLS POLICIES: profiles
-- =========================================
CREATE POLICY "Users can view their own profile"
  ON public.profiles FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Admins can view all profiles"
  ON public.profiles FOR SELECT
  USING (public.has_role(auth.uid(), 'administrador'));

CREATE POLICY "Users can update their own profile"
  ON public.profiles FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own profile"
  ON public.profiles FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- =========================================
-- RLS POLICIES: user_roles
-- =========================================
CREATE POLICY "Users can view their own roles"
  ON public.user_roles FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Admins can view all roles"
  ON public.user_roles FOR SELECT
  USING (public.has_role(auth.uid(), 'administrador'));

CREATE POLICY "Admins can manage roles"
  ON public.user_roles FOR ALL
  USING (public.has_role(auth.uid(), 'administrador'))
  WITH CHECK (public.has_role(auth.uid(), 'administrador'));

-- =========================================
-- RLS POLICIES: instructors
-- =========================================
-- Cualquiera autenticado o no puede ver los instructores activos (para reservar)
CREATE POLICY "Anyone can view active instructors"
  ON public.instructors FOR SELECT
  USING (activo = true OR public.has_role(auth.uid(), 'administrador') OR auth.uid() = user_id);

CREATE POLICY "Admins can manage instructors"
  ON public.instructors FOR ALL
  USING (public.has_role(auth.uid(), 'administrador'))
  WITH CHECK (public.has_role(auth.uid(), 'administrador'));

CREATE POLICY "Instructors can update their own info"
  ON public.instructors FOR UPDATE
  USING (auth.uid() = user_id);

-- =========================================
-- RLS POLICIES: bookings
-- =========================================
CREATE POLICY "Users can view their own bookings"
  ON public.bookings FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Instructors can view their bookings"
  ON public.bookings FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.instructors
      WHERE id = bookings.instructor_id AND user_id = auth.uid()
    )
  );

CREATE POLICY "Admins can view all bookings"
  ON public.bookings FOR SELECT
  USING (public.has_role(auth.uid(), 'administrador'));

CREATE POLICY "Users can create their own bookings"
  ON public.bookings FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own pending bookings"
  ON public.bookings FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Admins can manage all bookings"
  ON public.bookings FOR ALL
  USING (public.has_role(auth.uid(), 'administrador'))
  WITH CHECK (public.has_role(auth.uid(), 'administrador'));

-- Para evitar choques de horario también para los slots disponibles, lectura pública limitada
CREATE POLICY "Anyone can check booked slots"
  ON public.bookings FOR SELECT
  USING (estado IN ('pendiente', 'confirmada'));

-- =========================================
-- RLS POLICIES: payments
-- =========================================
CREATE POLICY "Users can view their own payments"
  ON public.payments FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own payments"
  ON public.payments FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own payments"
  ON public.payments FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Admins can view all payments"
  ON public.payments FOR SELECT
  USING (public.has_role(auth.uid(), 'administrador'));