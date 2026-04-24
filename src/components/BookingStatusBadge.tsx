import { Badge } from "@/components/ui/badge";
import type { Database } from "@/integrations/supabase/types";

type Estado = Database["public"]["Enums"]["booking_status"];

const MAP: Record<Estado, { label: string; className: string }> = {
  pendiente: {
    label: "Pendiente",
    className: "bg-amber-100 text-amber-900 hover:bg-amber-100 border-amber-300",
  },
  confirmada: {
    label: "Confirmada",
    className: "bg-emerald-100 text-emerald-900 hover:bg-emerald-100 border-emerald-300",
  },
  cancelada: {
    label: "Cancelada",
    className: "bg-rose-100 text-rose-900 hover:bg-rose-100 border-rose-300",
  },
  expirada: {
    label: "Expirada",
    className: "bg-slate-200 text-slate-700 hover:bg-slate-200 border-slate-300",
  },
  completada: {
    label: "Completada",
    className: "bg-primary/15 text-primary hover:bg-primary/15 border-primary/30",
  },
};

export function BookingStatusBadge({ estado }: { estado: Estado }) {
  const m = MAP[estado];
  return (
    <Badge variant="outline" className={m.className}>
      {m.label}
    </Badge>
  );
}
