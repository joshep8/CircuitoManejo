// Edge function: admin crea un instructor (usuario auth + perfil + rol + registro instructors)
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

function buildEmail(nombres: string, dni: string) {
  const slug = nombres
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z]/g, "");
  return `${slug}${dni.slice(0, 2)}@drivepro.pe`;
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS")
    return new Response(null, { headers: corsHeaders });

  try {
    const url = Deno.env.get("SUPABASE_URL")!;
    const serviceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const anonKey = Deno.env.get("SUPABASE_ANON_KEY")!;

    // Verificar que quien llama es administrador
    const authHeader = req.headers.get("Authorization");
    if (!authHeader) {
      return new Response(
        JSON.stringify({ error: "No autorizado" }),
        { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } },
      );
    }

    const userClient = createClient(url, anonKey, {
      global: { headers: { Authorization: authHeader } },
    });
    const { data: userData, error: userErr } = await userClient.auth.getUser();
    if (userErr || !userData.user) {
      return new Response(
        JSON.stringify({ error: "Sesión inválida" }),
        { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } },
      );
    }

    const admin = createClient(url, serviceKey);
    const { data: roleRow } = await admin
      .from("user_roles")
      .select("role")
      .eq("user_id", userData.user.id)
      .eq("role", "administrador")
      .maybeSingle();

    if (!roleRow) {
      return new Response(
        JSON.stringify({ error: "Solo administradores" }),
        { status: 403, headers: { ...corsHeaders, "Content-Type": "application/json" } },
      );
    }

    const body = await req.json();
    const {
      nombres,
      apellidos,
      dni,
      telefono,
      bio,
      licencias,
    }: {
      nombres: string;
      apellidos: string;
      dni: string;
      telefono?: string;
      bio?: string;
      licencias: ("A-I" | "A-IIa" | "A-IIb")[];
    } = body;

    // Validaciones
    if (!nombres?.trim() || !apellidos?.trim() || !dni?.trim()) {
      return new Response(
        JSON.stringify({ error: "Nombres, apellidos y DNI son obligatorios" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } },
      );
    }
    const dniClean = dni.replace(/\D/g, "");
    if (dniClean.length !== 8) {
      return new Response(
        JSON.stringify({ error: "El DNI debe tener 8 dígitos" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } },
      );
    }
    if (!licencias?.length) {
      return new Response(
        JSON.stringify({ error: "Selecciona al menos una licencia" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } },
      );
    }

    // Verificar DNI único
    const { data: existing } = await admin
      .from("instructors")
      .select("id")
      .eq("dni", dniClean)
      .maybeSingle();

    if (existing) {
      return new Response(
        JSON.stringify({ error: "Ya existe un instructor con ese DNI" }),
        { status: 409, headers: { ...corsHeaders, "Content-Type": "application/json" } },
      );
    }

    const email = buildEmail(nombres, dniClean);
    const password = dniClean;

    // Crear usuario auth
    const { data: created, error: createErr } =
      await admin.auth.admin.createUser({
        email,
        password,
        email_confirm: true,
        user_metadata: {
          role: "instructor",
          dni: dniClean,
          nombres,
          apellidos,
          telefono: telefono ?? "",
        },
      });

    if (createErr || !created.user) {
      return new Response(
        JSON.stringify({ error: createErr?.message ?? "No se pudo crear el usuario" }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } },
      );
    }

    const userId = created.user.id;

    // Asignar rol instructor (eliminar 'usuario' por defecto si quieres, pero mantenemos ambos sin problema)
    await admin
      .from("user_roles")
      .insert({ user_id: userId, role: "instructor" });

    // Crear registro en instructors
    const { error: insErr } = await admin.from("instructors").insert({
      user_id: userId,
      nombres,
      apellidos,
      dni: dniClean,
      correo: email,
      telefono: telefono ?? null,
      licencias,
      bio: bio ?? null,
      activo: true,
    });

    if (insErr) {
      // Rollback: eliminar el usuario creado
      await admin.auth.admin.deleteUser(userId);
      return new Response(
        JSON.stringify({ error: `Error creando instructor: ${insErr.message}` }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } },
      );
    }

    return new Response(
      JSON.stringify({
        ok: true,
        instructor: { email, password, nombres, apellidos, dni: dniClean },
      }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } },
    );
  } catch (err) {
    console.error("admin-create-instructor:", err);
    return new Response(
      JSON.stringify({ error: String(err) }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } },
    );
  }
});
