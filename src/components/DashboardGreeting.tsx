import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ShieldCheck, GraduationCap, User as UserIcon } from "lucide-react";
import type { AppRole } from "@/hooks/use-auth";

interface Props {
  userId: string;
  role: AppRole;
  fallbackEmail?: string | null;
}

const roleMeta: Record<AppRole, { label: string; icon: typeof UserIcon; color: string }> = {
  administrador: { label: "Administrador", icon: ShieldCheck, color: "bg-primary/10 text-primary border-primary/20" },
  instructor: { label: "Instructor", icon: GraduationCap, color: "bg-amber-500/10 text-amber-700 border-amber-500/20" },
  usuario: { label: "Usuario", icon: UserIcon, color: "bg-emerald-500/10 text-emerald-700 border-emerald-500/20" },
};

export function DashboardGreeting({ userId, role, fallbackEmail }: Props) {
  const [name, setName] = useState<string | null>(null);

  useEffect(() => {
    let mounted = true;
    (async () => {
      // Para instructores intentamos primero la tabla instructors (datos completos),
      // luego caemos al profile.
      if (role === "instructor") {
        const { data: ins } = await supabase
          .from("instructors")
          .select("nombres, apellidos")
          .eq("user_id", userId)
          .maybeSingle();
        if (ins && mounted) {
          setName(`${ins.nombres} ${ins.apellidos}`);
          return;
        }
      }
      // Para administradores, leer de admins; para usuarios, de alumnos.
      const tabla = role === "administrador" ? "admins" : "alumnos";
      const { data: prof } = await supabase
        .from(tabla)
        .select("nombres, apellidos")
        .eq("user_id", userId)
        .maybeSingle();
      if (mounted) {
        if (prof?.nombres) setName(`${prof.nombres} ${prof.apellidos ?? ""}`.trim());
        else setName(fallbackEmail ?? "Bienvenido");
      }
    })();
    return () => {
      mounted = false;
    };
  }, [userId, role, fallbackEmail]);

  const meta = roleMeta[role];
  const Icon = meta.icon;

  return (
    <Card className="mb-6 border-primary/10 bg-gradient-to-r from-primary/5 via-background to-background">
      <CardContent className="flex flex-wrap items-center justify-between gap-4 py-5">
        <div className="flex items-center gap-4">
          <div className="flex h-12 w-12 items-center justify-center rounded-full bg-primary/10 text-primary">
            <Icon className="h-6 w-6" />
          </div>
          <div>
            <p className="text-sm text-muted-foreground">Bienvenido de nuevo</p>
            <p className="font-display text-xl font-bold capitalize tracking-tight">
              {name ?? "..."}
            </p>
          </div>
        </div>
        <Badge variant="outline" className={`${meta.color} px-3 py-1 text-sm font-medium`}>
          {meta.label}
        </Badge>
      </CardContent>
    </Card>
  );
}
