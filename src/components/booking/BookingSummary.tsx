import { LICENSE_INFO, type BookingDraft } from "./types";
import { Calendar, Clock, User, FileText, Wallet } from "lucide-react";

export function BookingSummary({ draft }: { draft: BookingDraft }) {
  return (
    <div className="rounded-2xl border border-border bg-card p-5 shadow-card">
      <h3 className="font-display text-lg font-bold">Resumen de tu reserva</h3>
      <div className="mt-4 space-y-3 text-sm">
        <Row
          icon={<FileText className="h-4 w-4" />}
          label="Licencia"
          value={
            draft.licencia
              ? `${draft.licencia} · ${LICENSE_INFO[draft.licencia].vehiculo}`
              : "—"
          }
        />
        <Row
          icon={<User className="h-4 w-4" />}
          label="Instructor"
          value={
            draft.instructor
              ? `${draft.instructor.nombres} ${draft.instructor.apellidos}`
              : "—"
          }
        />
        <Row
          icon={<Calendar className="h-4 w-4" />}
          label="Fecha"
          value={draft.fecha ?? "—"}
        />
        <Row
          icon={<Clock className="h-4 w-4" />}
          label="Hora"
          value={draft.hora?.slice(0, 5) ?? "—"}
        />
      </div>

      <div className="mt-5 border-t border-border pt-4">
        <div className="flex items-center justify-between">
          <span className="flex items-center gap-2 text-sm text-muted-foreground">
            <Wallet className="h-4 w-4" />
            Total a pagar
          </span>
          <span className="font-display text-2xl font-bold text-primary">
            S/ {draft.precio.toFixed(2)}
          </span>
        </div>
      </div>
    </div>
  );
}

function Row({
  icon,
  label,
  value,
}: {
  icon: React.ReactNode;
  label: string;
  value: string;
}) {
  return (
    <div className="flex items-start justify-between gap-3">
      <span className="flex items-center gap-2 text-muted-foreground">
        {icon}
        {label}
      </span>
      <span className="text-right font-medium capitalize text-foreground">
        {value}
      </span>
    </div>
  );
}
