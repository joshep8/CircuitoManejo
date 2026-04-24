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
import { Loader2, CheckCircle2, XCircle, DollarSign, Smartphone } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { sendSms, normalizePeruPhone } from "@/lib/sms";
import { toast } from "sonner";

interface PaymentRow {
  id: string;
  booking_id: string;
  monto: number;
  metodo: string;
  estado: "pendiente" | "pagado" | "expirado" | "fallido";
  codigo_operacion: string | null;
  created_at: string;
  paid_at: string | null;
  booking: {
    id: string;
    fecha: string;
    hora: string;
    licencia: string;
    estado: string;
    cliente_nombres: string;
    cliente_apellidos: string;
    cliente_dni: string;
    cliente_telefono: string;
  } | null;
}

export function PaymentsModule() {
  const [payments, setPayments] = useState<PaymentRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [validatingId, setValidatingId] = useState<string | null>(null);
  const [filter, setFilter] = useState<"pendientes" | "todos">("pendientes");

  const load = useCallback(async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from("payments")
      .select(
        `id, booking_id, monto, metodo, estado, codigo_operacion, created_at, paid_at,
         booking:bookings(id, fecha, hora, licencia, estado, cliente_nombres, cliente_apellidos, cliente_dni, cliente_telefono)`,
      )
      .order("created_at", { ascending: false });

    if (error) {
      console.error(error);
      toast.error("No se pudieron cargar los pagos");
    } else {
      setPayments((data ?? []) as unknown as PaymentRow[]);
    }
    setLoading(false);
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const validatePayment = async (p: PaymentRow) => {
    if (!p.booking) {
      toast.error("Reserva no encontrada");
      return;
    }
    setValidatingId(p.id);
    try {
      // 1. Marcar booking como confirmada
      const { error: bookErr } = await supabase
        .from("bookings")
        .update({ estado: "confirmada" })
        .eq("id", p.booking_id);
      if (bookErr) throw bookErr;

      // 2. Enviar SMS de confirmación
      const phone = normalizePeruPhone(p.booking.cliente_telefono);
      if (phone) {
        const ok = await sendSms(
          phone,
          `Hola ${p.booking.cliente_nombres}, tu pago por S/ ${Number(p.monto).toFixed(2)} ha sido validado. Tu clase queda confirmada para el ${p.booking.fecha} a las ${p.booking.hora.slice(0, 5)}. ¡Gracias por reservar con DrivePro!`,
        );
        if (!ok) {
          toast.warning("Pago validado, pero el SMS no se pudo enviar");
        } else {
          toast.success("Pago validado y SMS enviado al cliente");
        }
      } else {
        toast.success("Pago validado");
      }

      await load();
    } catch (err) {
      console.error(err);
      toast.error("No se pudo validar el pago", {
        description: err instanceof Error ? err.message : "",
      });
    } finally {
      setValidatingId(null);
    }
  };

  const rejectPayment = async (p: PaymentRow) => {
    setValidatingId(p.id);
    try {
      await supabase
        .from("payments")
        .update({ estado: "fallido" })
        .eq("id", p.id);
      await supabase
        .from("bookings")
        .update({ estado: "cancelada" })
        .eq("id", p.booking_id);
      toast.success("Pago rechazado");
      await load();
    } catch (err) {
      console.error(err);
      toast.error("No se pudo rechazar el pago");
    } finally {
      setValidatingId(null);
    }
  };

  const visible = payments.filter((p) =>
    filter === "pendientes" ? p.estado === "pagado" && p.booking?.estado === "pendiente" : true,
  );

  const pendingCount = payments.filter(
    (p) => p.estado === "pagado" && p.booking?.estado === "pendiente",
  ).length;

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between gap-3">
        <CardTitle className="flex items-center gap-2">
          <DollarSign className="h-5 w-5 text-primary" />
          Pagos {pendingCount > 0 && (
            <Badge variant="destructive" className="ml-2">
              {pendingCount} por validar
            </Badge>
          )}
        </CardTitle>
        <div className="flex gap-2">
          <Button
            size="sm"
            variant={filter === "pendientes" ? "default" : "outline"}
            onClick={() => setFilter("pendientes")}
          >
            Por validar
          </Button>
          <Button
            size="sm"
            variant={filter === "todos" ? "default" : "outline"}
            onClick={() => setFilter("todos")}
          >
            Todos
          </Button>
        </div>
      </CardHeader>
      <CardContent>
        {loading ? (
          <div className="flex items-center gap-2 py-8 text-muted-foreground">
            <Loader2 className="h-4 w-4 animate-spin" /> Cargando pagos...
          </div>
        ) : visible.length === 0 ? (
          <div className="flex flex-col items-center gap-3 py-12 text-center text-muted-foreground">
            <CheckCircle2 className="h-12 w-12 opacity-30" />
            <p>
              {filter === "pendientes"
                ? "No hay pagos pendientes de validación. ¡Buen trabajo!"
                : "Aún no hay pagos registrados."}
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Cliente</TableHead>
                  <TableHead>DNI</TableHead>
                  <TableHead>Teléfono</TableHead>
                  <TableHead>Reserva</TableHead>
                  <TableHead>Monto</TableHead>
                  <TableHead>Cód. operación</TableHead>
                  <TableHead>Estado</TableHead>
                  <TableHead className="text-right">Acción</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {visible.map((p) => {
                  const needsValidation =
                    p.estado === "pagado" && p.booking?.estado === "pendiente";
                  return (
                    <TableRow key={p.id}>
                      <TableCell className="font-medium capitalize">
                        {p.booking?.cliente_nombres}{" "}
                        {p.booking?.cliente_apellidos}
                      </TableCell>
                      <TableCell>{p.booking?.cliente_dni}</TableCell>
                      <TableCell className="font-mono text-xs">
                        {p.booking?.cliente_telefono}
                      </TableCell>
                      <TableCell>
                        {p.booking?.fecha} · {p.booking?.hora.slice(0, 5)}
                      </TableCell>
                      <TableCell className="font-semibold">
                        S/ {Number(p.monto).toFixed(2)}
                      </TableCell>
                      <TableCell className="font-mono text-xs">
                        {p.codigo_operacion ?? "—"}
                      </TableCell>
                      <TableCell>
                        <PaymentBadge
                          payment={p.estado}
                          booking={p.booking?.estado}
                        />
                      </TableCell>
                      <TableCell className="text-right">
                        {needsValidation ? (
                          <div className="flex justify-end gap-2">
                            <Button
                              size="sm"
                              variant="cta"
                              disabled={validatingId === p.id}
                              onClick={() => validatePayment(p)}
                            >
                              {validatingId === p.id ? (
                                <Loader2 className="h-4 w-4 animate-spin" />
                              ) : (
                                <>
                                  <CheckCircle2 className="mr-1 h-4 w-4" />
                                  Validar
                                </>
                              )}
                            </Button>
                            <Button
                              size="sm"
                              variant="outline"
                              disabled={validatingId === p.id}
                              onClick={() => rejectPayment(p)}
                            >
                              <XCircle className="mr-1 h-4 w-4" />
                              Rechazar
                            </Button>
                          </div>
                        ) : (
                          <span className="text-xs text-muted-foreground">
                            <Smartphone className="mr-1 inline h-3 w-3" />
                            SMS enviado
                          </span>
                        )}
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

function PaymentBadge({
  payment,
  booking,
}: {
  payment: PaymentRow["estado"];
  booking?: string;
}) {
  if (payment === "pagado" && booking === "pendiente") {
    return (
      <Badge className="bg-warning text-warning-foreground hover:bg-warning">
        Por validar
      </Badge>
    );
  }
  if (payment === "pagado" && booking === "confirmada") {
    return (
      <Badge className="bg-success text-success-foreground hover:bg-success">
        Validado
      </Badge>
    );
  }
  if (payment === "fallido") return <Badge variant="destructive">Rechazado</Badge>;
  if (payment === "expirado") return <Badge variant="secondary">Expirado</Badge>;
  return <Badge variant="outline">{payment}</Badge>;
}
