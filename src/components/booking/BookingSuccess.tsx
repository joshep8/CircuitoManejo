import { useNavigate } from "@tanstack/react-router";
import { Clock4 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { LICENSE_INFO, type BookingDraft } from "./types";

interface Props {
  draft: BookingDraft;
  email: string;
}

export function BookingSuccess({ draft, email }: Props) {
  const navigate = useNavigate();
  return (
    <div className="rounded-3xl border border-warning/30 bg-card p-8 text-center shadow-elegant">
      <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-warning/10 text-warning">
        <Clock4 className="h-9 w-9" />
      </div>
      <h2 className="mt-4 font-display text-2xl font-bold">
        ¡Pago registrado!
      </h2>
      <p className="mt-2 text-muted-foreground">
        Estás a punto de confirmar tu reserva. El administrador está validando
        tu pago. Te enviaremos un SMS al{" "}
        <span className="font-semibold">{draft.cliente.telefono}</span> apenas
        sea aprobado.
      </p>

      <div className="mx-auto mt-6 max-w-md rounded-2xl border border-border bg-muted/40 p-5 text-left text-sm">
        <Row label="Licencia" value={`${draft.licencia} · ${LICENSE_INFO[draft.licencia!].vehiculo}`} />
        <Row
          label="Instructor"
          value={`${draft.instructor!.nombres} ${draft.instructor!.apellidos}`}
        />
        <Row label="Fecha" value={draft.fecha!} />
        <Row label="Hora" value={draft.hora!.slice(0, 5)} />
      </div>

      <div className="mx-auto mt-5 max-w-md rounded-2xl border border-primary/30 bg-primary/5 p-5 text-left text-sm">
        <p className="font-semibold text-foreground">
          Tu cuenta de acceso fue creada:
        </p>
        <p className="mt-2">
          <span className="text-muted-foreground">Correo:</span>{" "}
          <span className="font-mono font-semibold">{email}</span>
        </p>
        <p className="mt-1">
          <span className="text-muted-foreground">Contraseña:</span>{" "}
          <span className="font-mono font-semibold">tu DNI completo</span>
        </p>
      </div>

      <div className="mt-6 flex flex-wrap justify-center gap-3">
        <Button variant="cta" onClick={() => navigate({ to: "/dashboard" })}>
          Ver mis reservas
        </Button>
        <Button variant="outline" onClick={() => navigate({ to: "/" })}>
          Volver al inicio
        </Button>
      </div>
    </div>
  );
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex justify-between border-b border-border/60 py-2 last:border-0">
      <span className="text-muted-foreground">{label}</span>
      <span className="font-medium capitalize">{value}</span>
    </div>
  );
}
