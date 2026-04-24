import { Link, useNavigate } from "@tanstack/react-router";
import { Button } from "@/components/ui/button";
import { useAuth, dashboardPathFor, pickPrimaryRole } from "@/hooks/use-auth";
import { Car, LogOut, LayoutDashboard } from "lucide-react";

export function SiteHeader() {
  const { user, roles, signOut } = useAuth();
  const navigate = useNavigate();

  const dashboardPath = user ? dashboardPathFor(pickPrimaryRole(roles)) : null;

  return (
    <header className="sticky top-0 z-50 w-full border-b border-border/60 bg-background/80 backdrop-blur-md">
      <div className="container mx-auto flex h-16 items-center justify-between px-4">
        <Link to="/" className="flex items-center gap-2">
          <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-gradient-hero shadow-elegant">
            <Car className="h-5 w-5 text-primary-foreground" />
          </div>
          <span className="font-display text-xl font-bold tracking-tight text-foreground">
            Drive<span className="text-primary">Pro</span>
          </span>
        </Link>

        <nav className="hidden items-center gap-6 md:flex">
          <Link
            to="/"
            className="text-sm font-medium text-muted-foreground transition-smooth hover:text-foreground"
            activeProps={{ className: "text-foreground" }}
            activeOptions={{ exact: true }}
          >
            Inicio
          </Link>
          <a
            href="#nosotros"
            className="text-sm font-medium text-muted-foreground transition-smooth hover:text-foreground"
          >
            Nosotros
          </a>
          <a
            href="#servicios"
            className="text-sm font-medium text-muted-foreground transition-smooth hover:text-foreground"
          >
            Servicios
          </a>
        </nav>

        <div className="flex items-center gap-2">
          {user ? (
            <>
              {dashboardPath && (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => navigate({ to: dashboardPath })}
                >
                  <LayoutDashboard className="mr-1 h-4 w-4" />
                  Mi panel
                </Button>
              )}
              <Button
                variant="outline"
                size="sm"
                onClick={async () => {
                  await signOut();
                  navigate({ to: "/" });
                }}
              >
                <LogOut className="mr-1 h-4 w-4" />
                Salir
              </Button>
            </>
          ) : (
            <>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => navigate({ to: "/login" })}
              >
                Iniciar sesión
              </Button>
              <Button
                variant="hero"
                size="sm"
                onClick={() => navigate({ to: "/reservar" })}
              >
                Reservar
              </Button>
            </>
          )}
        </div>
      </div>
    </header>
  );
}
