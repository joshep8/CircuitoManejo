
-- 1) Limpiar datos existentes
DELETE FROM public.payments;
DELETE FROM public.bookings;
DELETE FROM public.profiles;

-- 2) Eliminar tabla profiles
DROP TABLE IF EXISTS public.profiles CASCADE;

-- 3) Crear tabla alumnos
CREATE TABLE public.alumnos (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL UNIQUE REFERENCES auth.users(id) ON DELETE CASCADE,
  dni TEXT NOT NULL,
  nombres TEXT NOT NULL,
  apellidos TEXT NOT NULL,
  correo TEXT NOT NULL,
  telefono TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.alumnos ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Alumnos pueden ver su info"
ON public.alumnos FOR SELECT
USING (auth.uid() = user_id);

CREATE POLICY "Alumnos pueden insertar su info"
ON public.alumnos FOR INSERT
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Alumnos pueden actualizar su info"
ON public.alumnos FOR UPDATE
USING (auth.uid() = user_id);

CREATE POLICY "Admins pueden ver todos los alumnos"
ON public.alumnos FOR SELECT
USING (public.has_role(auth.uid(), 'administrador'));

CREATE POLICY "Admins pueden gestionar alumnos"
ON public.alumnos FOR ALL
USING (public.has_role(auth.uid(), 'administrador'))
WITH CHECK (public.has_role(auth.uid(), 'administrador'));

CREATE TRIGGER update_alumnos_updated_at
BEFORE UPDATE ON public.alumnos
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE INDEX idx_alumnos_user ON public.alumnos(user_id);
CREATE INDEX idx_alumnos_dni ON public.alumnos(dni);

-- 4) Crear tabla admins
CREATE TABLE public.admins (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL UNIQUE REFERENCES auth.users(id) ON DELETE CASCADE,
  dni TEXT NOT NULL,
  nombres TEXT NOT NULL,
  apellidos TEXT NOT NULL,
  correo TEXT NOT NULL,
  telefono TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.admins ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admin puede ver su info"
ON public.admins FOR SELECT
USING (auth.uid() = user_id);

CREATE POLICY "Admin puede actualizar su info"
ON public.admins FOR UPDATE
USING (auth.uid() = user_id);

CREATE POLICY "Administradores ven todos los admins"
ON public.admins FOR SELECT
USING (public.has_role(auth.uid(), 'administrador'));

CREATE POLICY "Administradores gestionan admins"
ON public.admins FOR ALL
USING (public.has_role(auth.uid(), 'administrador'))
WITH CHECK (public.has_role(auth.uid(), 'administrador'));

CREATE TRIGGER update_admins_updated_at
BEFORE UPDATE ON public.admins
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE INDEX idx_admins_user ON public.admins(user_id);

-- 5) Trigger handle_new_user → ahora inserta en alumnos
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
BEGIN
  INSERT INTO public.alumnos (user_id, dni, nombres, apellidos, correo, telefono)
  VALUES (
    NEW.id,
    COALESCE(NEW.raw_user_meta_data->>'dni', ''),
    COALESCE(NEW.raw_user_meta_data->>'nombres', ''),
    COALESCE(NEW.raw_user_meta_data->>'apellidos', ''),
    NEW.email,
    COALESCE(NEW.raw_user_meta_data->>'telefono', '')
  )
  ON CONFLICT (user_id) DO NOTHING;

  INSERT INTO public.user_roles (user_id, role)
  VALUES (NEW.id, 'usuario'::app_role)
  ON CONFLICT (user_id, role) DO NOTHING;

  RETURN NEW;
END;
$function$;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
AFTER INSERT ON auth.users
FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();
