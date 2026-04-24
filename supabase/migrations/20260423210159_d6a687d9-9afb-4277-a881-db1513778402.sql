-- Reemplazar trigger handle_new_user para que respete el rol indicado en metadata
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
DECLARE
  meta_role text := COALESCE(NEW.raw_user_meta_data->>'role', 'usuario');
BEGIN
  -- Solo crear alumno + rol 'usuario' para signups normales
  IF meta_role = 'usuario' THEN
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
  END IF;

  RETURN NEW;
END;
$function$;

-- Asegurar que el trigger esté activo en auth.users
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
AFTER INSERT ON auth.users
FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();