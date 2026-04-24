import { useEffect, useState, useCallback } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Loader2, Calendar } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { BookingStatusBadge } from "@/components/BookingStatusBadge";
import { toast } from "sonner";

export interface BookingFull {
  id: string;
  fecha: string;
  hora: string;
  licencia: string;
  estado: "pendiente" | "confirmada" | "cancelada" | "expirada" | "completada";
  precio: number;
  cliente_nombres: string;
  cliente_apellidos: string;
  cliente_dni: string;
  cliente_telefono: string;
  instructor: { nombres: string; apellidos: string } | null;
}

type Filter = "todos" | "pendiente" | "confirmada" | "completada" | "cancelada";

interface Props {
  onStatsChange?: (stats: {
    total: number;
    confirmadas: number;
    ingresos: number;
  }) => void;
}

export function BookingsModule({ onStatsChange }: Props) {
  const [bookings, setBookings] = useState<BookingFull[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<Filter>("todos");

  const load = useCallback(async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from("bookings")
      .select(
        "id, fecha, hora, licencia, estado, precio, cliente_nombres, cliente_apellidos, cliente_dni, cliente_telefono, instructor:instructors(nombres, apellidos)",
      )
      .order("created_at", { ascending: false });

    if (error) {
      console.error("Error loading bookings:", error);
      toast.error("No se pudieron cargar las reservas");
    } else {
      const list = (data ?? []) as unknown as BookingFull[];
      setBookings(list);
      onStatsChange?.({
        total: list.length,
        confirmadas: list.filter((b) => b.estado === "confirmada").length,
        ingresos: list
          .filter((b) => b.estado === "confirmada" || b.estado === "completada")
          .reduce((sum, b) => sum + Number(b.precio), 0),
      });
    }
    setLoading(false);
  }, [onStatsChange]);

  useEffect(() => {
    load();
  }, [load]);

  const visible = bookings.filter((b) =>
    filter === "todos" ? true : b.estado === filter,
  );

  const filters: { key: Filter; label: string }[] = [
    { key: "todos", label: "Todas" },
    { key: "pendiente", label: "Pendientes" },
    { key: "confirmada", label: "Confirmadas" },
    { key: "completada", label: "Completadas" },
    { key: "cancelada", label: "Canceladas" },
  ];

  return (
    <Card>
      <CardHeader className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <CardTitle className="flex items-center gap-2">
          <Calendar className="h-5 w-5 text-primary" />
          Todas las reservas
          <Badge variant="secondary" className="ml-2">
            {bookings.length}
          </Badge>
        </CardTitle>
        <div className="flex flex-wrap gap-2">
          {filters.map((f) => (
            <Button
              key={f.key}
              size="sm"
              variant={filter === f.key ? "default" : "outline"}
              onClick={() => setFilter(f.key)}
            >
              {f.label}
            </Button>
          ))}
        </div>
      </CardHeader>
      <CardContent>
        {loading ? (
          <div className="flex items-center gap-2 py-8 text-muted-foreground">
            <Loader2 className="h-4 w-4 animate-spin" /> Cargando reservas...
          </div>
        ) : visible.length === 0 ? (
          <div className="flex flex-col items-center gap-3 py-12 text-center text-muted-foreground">
            <Calendar className="h-12 w-12 opacity-30" />
            <p>No hay reservas en esta vista.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Fecha</TableHead>
                  <TableHead>Hora</TableHead>
                  <TableHead>Cliente</TableHead>
                  <TableHead>DNI</TableHead>
                  <TableHead>Instructor</TableHead>
                  <TableHead>Lic.</TableHead>
                  <TableHead>Precio</TableHead>
                  <TableHead>Estado</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {visible.map((b) => (
                  <TableRow key={b.id}>
                    <TableCell className="font-medium">
                      {new Date(b.fecha + "T00:00:00").toLocaleDateString("es-PE", {
                        day: "2-digit",
                        month: "short",
                      })}
                    </TableCell>
                    <TableCell>{b.hora.slice(0, 5)}</TableCell>
                    <TableCell className="capitalize">
                      {b.cliente_nombres} {b.cliente_apellidos}
                    </TableCell>
                    <TableCell>{b.cliente_dni}</TableCell>
                    <TableCell className="capitalize">
                      {b.instructor
                        ? `${b.instructor.nombres} ${b.instructor.apellidos}`
                        : "—"}
                    </TableCell>
                    <TableCell>{b.licencia}</TableCell>
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
  );
}
