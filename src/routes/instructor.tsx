import { createFileRoute, useNavigate } from "@tanstack/react-router";
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
import { Loader2, Calendar, Phone, Mail } from "lucide-react";
import { BookingStatusBadge } from "@/components/BookingStatusBadge";
import { DashboardGreeting } from "@/components/DashboardGreeting";

export const Route = createFileRoute("/instructor")({
  head: () => ({ meta: [{ title: "Mis clases — DrivePro" }] }),
  component: InstructorPage,
});

interface Booking {
  id: string;
  fecha: string;
  hora: string;
  licencia: string;
  estado: "pendiente" | "confirmada" | "cancelada" | "expirada" | "completada";
  cliente_nombres: string;
  cliente_apellidos: string;
  cliente_dni: string;
  cliente_telefono: string;
  cliente_correo: string;
}

function InstructorPage() {
  const { user, loading, hasRole } = useAuth();
  const navigate = useNavigate();
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [fetching, setFetching] = useState(true);

  useEffect(() => {
    if (loading) return;
    if (!user) navigate({ to: "/login" });
    else if (!hasRole("instructor") && !hasRole("administrador"))
      navigate({ to: "/" });
  }, [loading, user, hasRole, navigate]);

  useEffect(() => {
    if (!user) return;
    (async () => {
      setFetching(true);
      // Buscar instructor por user_id
      const { data: ins } = await supabase
        .from("instructors")
        .select("id")
        .eq("user_id", user.id)
        .maybeSingle();

      if (!ins) {
        setBookings([]);
        setFetching(false);
        return;
      }

      const { data } = await supabase
        .from("bookings")
        .select(
          "id, fecha, hora, licencia, estado, cliente_nombres, cliente_apellidos, cliente_dni, cliente_telefono, cliente_correo",
        )
        .eq("instructor_id", ins.id)
        .order("fecha", { ascending: false })
        .order("hora", { ascending: false });

      setBookings((data ?? []) as Booking[]);
      setFetching(false);
    })();
  }, [user]);

  const today = new Date().toISOString().slice(0, 10);
  const stats = {
    total: bookings.length,
    proximas: bookings.filter(
      (b) => b.fecha >= today && (b.estado === "confirmada" || b.estado === "pendiente"),
    ).length,
    confirmadas: bookings.filter((b) => b.estado === "confirmada").length,
    completadas: bookings.filter((b) => b.estado === "completada").length,
  };

  return (
    <div className="flex min-h-screen flex-col">
      <SiteHeader />
      <main className="container mx-auto flex-1 px-4 py-10">
        {user && (
          <DashboardGreeting
            userId={user.id}
            role="instructor"
            fallbackEmail={user.email}
          />
        )}
        <div className="mb-8">
          <h1 className="font-display text-3xl font-bold tracking-tight">
            Mis clases asignadas
          </h1>
          <p className="mt-1 text-muted-foreground">
            Reservas que han hecho contigo. Contacta al estudiante si necesitas
            coordinar detalles.
          </p>
        </div>

        <div className="mb-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {[
            { label: "Total clases", value: stats.total, color: "text-foreground" },
            { label: "Próximas", value: stats.proximas, color: "text-primary" },
            { label: "Confirmadas", value: stats.confirmadas, color: "text-emerald-600" },
            { label: "Completadas", value: stats.completadas, color: "text-primary" },
          ].map((s) => (
            <Card key={s.label}>
              <CardContent className="pt-6">
                <p className="text-sm font-medium text-muted-foreground">{s.label}</p>
                <p className={`mt-2 font-display text-3xl font-bold ${s.color}`}>
                  {s.value}
                </p>
              </CardContent>
            </Card>
          ))}
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Reservas</CardTitle>
          </CardHeader>
          <CardContent>
            {fetching || loading ? (
              <div className="flex items-center gap-2 py-8 text-muted-foreground">
                <Loader2 className="h-4 w-4 animate-spin" />
                Cargando...
              </div>
            ) : bookings.length === 0 ? (
              <div className="flex flex-col items-center justify-center gap-3 py-12 text-center">
                <Calendar className="h-12 w-12 text-muted-foreground/40" />
                <p className="text-muted-foreground">
                  Aún no tienes clases reservadas.
                </p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Fecha</TableHead>
                      <TableHead>Hora</TableHead>
                      <TableHead>Licencia</TableHead>
                      <TableHead>Estudiante</TableHead>
                      <TableHead>DNI</TableHead>
                      <TableHead>Contacto</TableHead>
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
                          {b.cliente_nombres} {b.cliente_apellidos}
                        </TableCell>
                        <TableCell>{b.cliente_dni}</TableCell>
                        <TableCell>
                          <div className="flex flex-col gap-0.5 text-xs">
                            <a
                              href={`tel:${b.cliente_telefono}`}
                              className="flex items-center gap-1 text-muted-foreground hover:text-primary"
                            >
                              <Phone className="h-3 w-3" />
                              {b.cliente_telefono}
                            </a>
                            <a
                              href={`mailto:${b.cliente_correo}`}
                              className="flex items-center gap-1 text-muted-foreground hover:text-primary"
                            >
                              <Mail className="h-3 w-3" />
                              {b.cliente_correo}
                            </a>
                          </div>
                        </TableCell>
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
