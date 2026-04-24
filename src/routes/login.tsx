import { createFileRoute, useNavigate, Link } from "@tanstack/react-router";
import { useState, useEffect, type FormEvent } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { SiteHeader } from "@/components/SiteHeader";
import { SiteFooter } from "@/components/SiteFooter";
import { supabase } from "@/integrations/supabase/client";
import {
  useAuth,
  dashboardPathFor,
  pickPrimaryRole,
  type AppRole,
} from "@/hooks/use-auth";
import { toast } from "sonner";
import { Car, Loader2, ShieldCheck, GraduationCap, User as UserIcon } from "lucide-react";

export const Route = createFileRoute("/login")({
  head: () => ({
    meta: [
      { title: "Iniciar sesión — DrivePro" },
      {
        name: "description",
        content: "Accede a tu cuenta de DrivePro para gestionar tus reservas.",
      },
    ],
  }),
  component: LoginPage,
});

const roleOptions: {
  value: AppRole;
  label: string;
  description: string;
  icon: typeof UserIcon;
}[] = [
  {
    value: "usuario",
    label: "Usuario",
    description: "Reservar y ver mis clases",
    icon: UserIcon,
  },
  {
    value: "instructor",
    label: "Instructor",
    description: "Ver mis clases asignadas",
    icon: GraduationCap,
  },
  {
    value: "administrador",
    label: "Administrador",
    description: "Gestionar la plataforma",
    icon: ShieldCheck,
  },
];

function LoginPage() {
  const navigate = useNavigate();
  const { user, roles, loading } = useAuth();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [selectedRole, setSelectedRole] = useState<AppRole>("usuario");
  const [submitting, setSubmitting] = useState(false);

  // Si ya está logueado, redirige según su rol primario (sin forzar)
  useEffect(() => {
    if (!loading && user && roles.length > 0) {
      navigate({ to: dashboardPathFor(pickPrimaryRole(roles)) });
    }
  }, [loading, user, roles, navigate]);

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setSubmitting(true);

    const { data, error } = await supabase.auth.signInWithPassword({
      email: email.trim().toLowerCase(),
      password,
    });

    if (error || !data.user) {
      setSubmitting(false);
      toast.error("Credenciales incorrectas", {
        description: "Revisa tu correo y contraseña e intenta de nuevo.",
      });
      return;
    }

    // Verificar que tenga el rol seleccionado
    const { data: rolesData } = await supabase
      .from("user_roles")
      .select("role")
      .eq("user_id", data.user.id);

    const userRoles = (rolesData?.map((r) => r.role as AppRole) ?? []);

    if (!userRoles.includes(selectedRole)) {
      await supabase.auth.signOut();
      setSubmitting(false);
      const tieneRoles = userRoles.length > 0
        ? `Tu cuenta tiene el rol: ${userRoles.join(", ")}.`
        : "Tu cuenta no tiene roles asignados.";
      toast.error(`No tienes permisos de ${selectedRole}`, {
        description: tieneRoles,
      });
      return;
    }

    setSubmitting(false);
    toast.success("¡Bienvenido de vuelta!");
    navigate({ to: dashboardPathFor(selectedRole) });
  };

  return (
    <div className="flex min-h-screen flex-col bg-gradient-soft">
      <SiteHeader />
      <main className="flex flex-1 items-center justify-center px-4 py-12">
        <div className="w-full max-w-md">
          <div className="rounded-3xl border border-border bg-card p-8 shadow-elegant">
            <div className="mb-6 flex flex-col items-center text-center">
              <div className="mb-3 flex h-12 w-12 items-center justify-center rounded-xl bg-gradient-hero shadow-elegant">
                <Car className="h-6 w-6 text-primary-foreground" />
              </div>
              <h1 className="font-display text-2xl font-bold">
                Bienvenido a DrivePro
              </h1>
              <p className="mt-1 text-sm text-muted-foreground">
                Selecciona tu rol e ingresa tus credenciales
              </p>
            </div>

            <form onSubmit={handleSubmit} className="space-y-5">
              {/* Selector de rol */}
              <div className="space-y-2">
                <Label>Ingresar como</Label>
                <RadioGroup
                  value={selectedRole}
                  onValueChange={(v) => setSelectedRole(v as AppRole)}
                  className="grid gap-2"
                >
                  {roleOptions.map((opt) => {
                    const Icon = opt.icon;
                    const active = selectedRole === opt.value;
                    return (
                      <label
                        key={opt.value}
                        htmlFor={`role-${opt.value}`}
                        className={`flex cursor-pointer items-center gap-3 rounded-xl border p-3 transition-smooth ${
                          active
                            ? "border-primary bg-primary/5 shadow-sm"
                            : "border-border hover:border-primary/40 hover:bg-muted/40"
                        }`}
                      >
                        <RadioGroupItem
                          value={opt.value}
                          id={`role-${opt.value}`}
                        />
                        <div
                          className={`flex h-9 w-9 items-center justify-center rounded-lg ${
                            active
                              ? "bg-primary text-primary-foreground"
                              : "bg-muted text-muted-foreground"
                          }`}
                        >
                          <Icon className="h-4 w-4" />
                        </div>
                        <div className="flex-1">
                          <p className="text-sm font-semibold leading-tight">
                            {opt.label}
                          </p>
                          <p className="text-xs text-muted-foreground">
                            {opt.description}
                          </p>
                        </div>
                      </label>
                    );
                  })}
                </RadioGroup>
              </div>

              <div className="space-y-2">
                <Label htmlFor="email">Correo</Label>
                <Input
                  id="email"
                  type="email"
                  required
                  autoComplete="email"
                  placeholder="tu@correo.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="password">Contraseña</Label>
                <Input
                  id="password"
                  type="password"
                  required
                  autoComplete="current-password"
                  placeholder="••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                />
              </div>

              <Button
                type="submit"
                variant="cta"
                size="lg"
                className="w-full"
                disabled={submitting}
              >
                {submitting ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Ingresando...
                  </>
                ) : (
                  "Iniciar sesión"
                )}
              </Button>
            </form>

            <div className="mt-6 rounded-xl border border-dashed border-border bg-muted/40 p-4 text-xs text-muted-foreground">
              <p className="font-semibold text-foreground">
                ¿Aún no tienes cuenta?
              </p>
              <p className="mt-1">
                Tu cuenta de usuario se crea automáticamente al hacer tu primera
                reserva.{" "}
                <Link
                  to="/reservar"
                  className="font-medium text-primary hover:underline"
                >
                  Reservar ahora →
                </Link>
              </p>
            </div>
          </div>
        </div>
      </main>
      <SiteFooter />
    </div>
  );
}
