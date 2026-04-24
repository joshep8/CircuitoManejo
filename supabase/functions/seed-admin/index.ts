// Edge function para crear/restaurar el administrador semilla.
// Idempotente: si el usuario ya existe en Auth, reinserta sus registros en
// `admins` y `user_roles` cuando falten (útil tras limpiar las tablas públicas).
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

const ADMIN_DNI = "00000001";
const ADMIN_NOMBRES = "admin";
const ADMIN_APELLIDOS = "principal";
const ADMIN_EMAIL = "admin00@drivepro.pe";
const ADMIN_PASSWORD = ADMIN_DNI;

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const serviceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const admin = createClient(supabaseUrl, serviceKey);

    // 1. ¿Existe el usuario en Auth?
    let userId: string | null = null;
    const { data: list, error: listErr } = await admin.auth.admin.listUsers({
      page: 1,
      perPage: 200,
    });
    if (listErr) throw listErr;
    const existingUser = list.users.find((u) => u.email === ADMIN_EMAIL);

    if (existingUser) {
      userId = existingUser.id;
    } else {
      // Crear usuario admin en Auth
      const { data: created, error: createErr } =
        await admin.auth.admin.createUser({
          email: ADMIN_EMAIL,
          password: ADMIN_PASSWORD,
          email_confirm: true,
          user_metadata: {
            dni: ADMIN_DNI,
            nombres: ADMIN_NOMBRES,
            apellidos: ADMIN_APELLIDOS,
            telefono: "",
          },
        });
      if (createErr) throw createErr;
      userId = created.user!.id;
    }

    // 2. Asegurar registro en `admins`
    const { data: adminRow } = await admin
      .from("admins")
      .select("id")
      .eq("user_id", userId)
      .maybeSingle();

    if (!adminRow) {
      const { error: insAdminErr } = await admin.from("admins").insert({
        user_id: userId,
        dni: ADMIN_DNI,
        nombres: ADMIN_NOMBRES,
        apellidos: ADMIN_APELLIDOS,
        correo: ADMIN_EMAIL,
        telefono: "",
      });
      if (insAdminErr) throw insAdminErr;
    }

    // 3. Asegurar rol "administrador" en user_roles
    const { data: roleRow } = await admin
      .from("user_roles")
      .select("id")
      .eq("user_id", userId)
      .eq("role", "administrador")
      .maybeSingle();

    if (!roleRow) {
      const { error: roleErr } = await admin
        .from("user_roles")
        .insert({ user_id: userId, role: "administrador" });
      if (roleErr) throw roleErr;
    }

    // 4. Quitar registro residual en `alumnos` (el trigger handle_new_user
    // pudo haberlo creado en el pasado). El admin no debe estar como alumno.
    await admin.from("alumnos").delete().eq("user_id", userId);
    await admin
      .from("user_roles")
      .delete()
      .eq("user_id", userId)
      .eq("role", "usuario");

    return new Response(
      JSON.stringify({
        ok: true,
        email: ADMIN_EMAIL,
        password: ADMIN_PASSWORD,
        userId,
      }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } },
    );
  } catch (err) {
    console.error("seed-admin error:", err);
    return new Response(JSON.stringify({ ok: false, error: String(err) }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
