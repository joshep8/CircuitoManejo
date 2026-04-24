import { createFileRoute, useNavigate, Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { SiteHeader } from "@/components/SiteHeader";
import { SiteFooter } from "@/components/SiteFooter";
import { useAuth } from "@/hooks/use-auth";
import { supabase } from "@/integrations/supabase/client";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Loader2, CalendarPlus, Car } from "lucide-react";
import { BookingStatusBadge } from "@/components/BookingStatusBadge";
import { DashboardGreeting } from "@/components/DashboardGreeting";
import { pickPrimaryRole } from "@/hooks/use-auth";

export const Route = createFileRoute("/dashboard")({
  head: () => ({ meta: [{ title: "Mis reservas — DrivePro" }] }),
  component: DashboardPage,
});

interface BookingRow {
  id: string;
  fecha: string;
  hora: string;
  licencia: string;
  estado: "pendiente" | "confirmada" | "cancelada" | "expirada" | "completada";
  precio: number;
  created_at: string;
  instructor: { nombres: string; apellidos: string } | null;
}

function DashboardPage() {
  const { user, loading, roles } = useAuth();
  const navigate = useNavigate();
  const [bookings, setBookings] = useState<BookingRow[]>([]);
  const [fetching, setFetching] = useState(true);

  useEffect(() => {
    if (!loading && !user) navigate({ to: "/login" });
  }, [loading, user, navigate]);

  useEffect(() => {
    if (!user) return;
    (async () => {
      setFetching(true);
      const { data, error } = await supabase
        .from("bookings")
        .select(
          "id, fecha, hora, licencia, estado, precio, created_at, instructor:instructors(nombres, apellidos)",
        )
        .eq("user_id", user.id)
        .order("fecha", { ascending: false })
        .order("hora", { ascending: false });
      if (!error && data) {
        setBookings(data as unknown as BookingRow[]);
      }
      setFetching(false);
    })();
  }, [user]);

  const stats = {
    total: bookings.length,
    confirmadas: bookings.filter((b) => b.estado === "confirmada").length,
    pendientes: bookings.filter((b) => b.estado === "pendiente").length,
    completadas: bookings.filter((b) => b.estado === "completada").length,
  };

  return (
    <div className="flex min-h-screen flex-col">
      <SiteHeader />
      <main className="container mx-auto flex-1 px-4 py-10">
        {user && (
          <DashboardGreeting
            userId={user.id}
            role={pickPrimaryRole(roles)}
            fallbackEmail={user.email}
          />
        )}
        <div className="mb-8 flex flex-wrap items-end justify-between gap-4">
          <div>
            <h1 className="font-display text-3xl font-bold tracking-tight">
              Mis reservas
            </h1>
            <p className="mt-1 text-muted-foreground">
              Historial completo de tus clases de manejo.
            </p>
          </div>
          <Button asChild variant="hero" size="lg">
            <Link to="/reservar">
              <CalendarPlus className="mr-2 h-5 w-5" />
              Nueva reserva
            </Link>
          </Button>
        </div>

        <div className="mb-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {[
            { label: "Total", value: stats.total, color: "text-foreground" },
            { label: "Confirmadas", value: stats.confirmadas, color: "text-emerald-600" },
            { label: "Pendientes", value: stats.pendientes, color: "text-amber-600" },
            { label: "Completadas", value: stats.completadas, color: "text-primary" },
          ].map((s) => (
            <Card key={s.label}>
              <CardContent className="pt-6">
                <p className="text-sm font-medium text-muted-foreground">
                  {s.label}
                </p>
                <p className={`mt-2 font-display text-3xl font-bold ${s.color}`}>
                  {s.value}
                </p>
              </CardContent>
            </Card>
          ))}
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Historial</CardTitle>
          </CardHeader>
          <CardContent>
            {fetching || loading ? (
              <div className="flex items-center gap-2 py-8 text-muted-foreground">
                <Loader2 className="h-4 w-4 animate-spin" />
                Cargando...
              </div>
            ) : bookings.length === 0 ? (
              <div className="flex flex-col items-center justify-center gap-3 py-12 text-center">
                <Car className="h-12 w-12 text-muted-foreground/40" />
                <p className="text-muted-foreground">
                  Aún no tienes reservas.
                </p>
                <Button asChild variant="hero">
                  <Link to="/reservar">Reservar mi primera clase</Link>
                </Button>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Fecha</TableHead>
                      <TableHead>Hora</TableHead>
                      <TableHead>Licencia</TableHead>
                      <TableHead>Instructor</TableHead>
                      <TableHead>Precio</TableHead>
                      <TableHead>Estado</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {bookings.map((b) => (
                      <TableRow key={b.id}>
                        <TableCell className="font-medium">
                          {new Date(b.fecha + "T00:00:00").toLocaleDateString(
                            "es-PE",
                            { day: "2-digit", month: "short", year: "numeric" },
                          )}
                        </TableCell>
                        <TableCell>{b.hora.slice(0, 5)}</TableCell>
                        <TableCell>{b.licencia}</TableCell>
                        <TableCell className="capitalize">
                          {b.instructor
                            ? `${b.instructor.nombres} ${b.instructor.apellidos}`
                            : "—"}
                        </TableCell>
                        <TableCell>S/ {Number(b.precio).toFixed(2)}</TableCell>
                        <TableCell>
                          <BookingStatusBadge estado={b.estado} />
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            )}
          </CardContent>
        </Card>
      </main>
      <SiteFooter />
    </div>
  );
}
