import { useEffect, useState } from "react";
import { format } from "date-fns";
import { es } from "date-fns/locale";
import { CalendarIcon, Loader2 } from "lucide-react";
import { Calendar } from "@/components/ui/calendar";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Button } from "@/components/ui/button";
import { supabase } from "@/integrations/supabase/client";
import { HORAS_DISPONIBLES } from "./types";
import { cn } from "@/lib/utils";

interface Props {
  instructorId: string;
  fecha: string | null;
  hora: string | null;
  onChange: (fecha: string | null, hora: string | null) => void;
}

// Devuelve la fecha/hora actual en zona horaria de Perú (America/Lima, UTC-5)
// como un string "YYYY-MM-DD" y una hora "HH:mm:ss".
function nowInPeru(): { fecha: string; hora: string } {
  const fmt = new Intl.DateTimeFormat("en-CA", {
    timeZone: "America/Lima",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
    hour12: false,
  });
  const parts = fmt.formatToParts(new Date());
  const get = (t: string) => parts.find((p) => p.type === t)?.value ?? "00";
  return {
    fecha: `${get("year")}-${get("month")}-${get("day")}`,
    hora: `${get("hour")}:${get("minute")}:${get("second")}`,
  };
}

export function StepFechaHora({ instructorId, fecha, hora, onChange }: Props) {
  const [loading, setLoading] = useState(false);
  const [ocupadas, setOcupadas] = useState<string[]>([]);
  const [peruNow, setPeruNow] = useState(() => nowInPeru());

  // Refrescar la hora de Perú cada minuto para que se desbloqueen/bloqueen slots
  useEffect(() => {
    const id = setInterval(() => setPeruNow(nowInPeru()), 60_000);
    return () => clearInterval(id);
  }, []);

  useEffect(() => {
    if (!fecha) {
      setOcupadas([]);
      return;
    }
    let mounted = true;
    setLoading(true);
    supabase
      .from("bookings")
      .select("hora")
      .eq("instructor_id", instructorId)
      .eq("fecha", fecha)
      .in("estado", ["pendiente", "confirmada"])
      .then(({ data }) => {
        if (!mounted) return;
        setOcupadas((data ?? []).map((d) => d.hora));
        setLoading(false);
      });
    return () => {
      mounted = false;
    };
  }, [instructorId, fecha]);

  const dateValue = fecha ? new Date(`${fecha}T00:00:00`) : undefined;
  // "Hoy" según hora de Perú, no del navegador del usuario
  const today = new Date(`${peruNow.fecha}T00:00:00`);
  const isToday = fecha === peruNow.fecha;

  return (
    <div>
      <h2 className="font-display text-2xl font-bold">Elige fecha y hora</h2>
      <p className="mt-1 text-sm text-muted-foreground">
        Selecciona un día disponible y luego una hora.
      </p>

      <div className="mt-6 space-y-6">
        <div>
          <label className="mb-2 block text-sm font-medium">Fecha</label>
          <Popover>
            <PopoverTrigger asChild>
              <Button
                variant="outline"
                size="lg"
                className={cn(
                  "w-full justify-start text-left font-normal sm:w-[280px]",
                  !dateValue && "text-muted-foreground",
                )}
              >
                <CalendarIcon className="mr-2 h-4 w-4" />
                {dateValue
                  ? format(dateValue, "EEEE d 'de' MMMM, yyyy", { locale: es })
                  : "Selecciona una fecha"}
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-auto p-0" align="start">
              <Calendar
                mode="single"
                selected={dateValue}
                onSelect={(d) => {
                  if (!d) return;
                  const iso = format(d, "yyyy-MM-dd");
                  onChange(iso, null);
                }}
                disabled={(date) => date < today}
                initialFocus
                locale={es}
                className={cn("p-3 pointer-events-auto")}
              />
            </PopoverContent>
          </Popover>
        </div>

        {fecha && (
          <div>
            <label className="mb-2 block text-sm font-medium">
              Hora disponible
            </label>
            {loading ? (
              <div className="flex items-center text-sm text-muted-foreground">
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Verificando disponibilidad...
              </div>
            ) : (
              <div className="grid grid-cols-3 gap-2 sm:grid-cols-5">
                {HORAS_DISPONIBLES.map((h) => {
                  const busy = ocupadas.includes(h);
                  // Si es hoy en Perú, bloquear horas que ya pasaron
                  const past = isToday && h <= peruNow.hora;
                  const disabled = busy || past;
                  const selected = hora === h;
                  return (
                    <button
                      key={h}
                      type="button"
                      disabled={disabled}
                      onClick={() => onChange(fecha, h)}
                      title={
                        past
                          ? "Esta hora ya pasó"
                          : busy
                            ? "Horario ocupado"
                            : undefined
                      }
                      className={cn(
                        "rounded-lg border-2 px-3 py-2.5 text-sm font-medium transition-smooth",
                        disabled &&
                          "cursor-not-allowed border-border bg-muted text-muted-foreground line-through opacity-60",
                        !disabled &&
                          selected &&
                          "border-primary bg-primary text-primary-foreground shadow-elegant",
                        !disabled &&
                          !selected &&
                          "border-border bg-card hover:border-primary hover:bg-primary/5",
                      )}
                    >
                      {h.slice(0, 5)}
                    </button>
                  );
                })}
              </div>
            )}
            {!loading &&
              HORAS_DISPONIBLES.every(
                (h) => ocupadas.includes(h) || (isToday && h <= peruNow.hora),
              ) && (
                <p className="mt-3 text-sm text-destructive">
                  No quedan horarios disponibles este día. Elige otra fecha.
                </p>
              )}
            {isToday && (
              <p className="mt-3 text-xs text-muted-foreground">
                Hora actual en Perú: {peruNow.hora.slice(0, 5)}. Las horas que
                ya pasaron están bloqueadas.
              </p>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
