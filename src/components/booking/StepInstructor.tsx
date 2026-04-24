import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import type { Instructor, LicenseType } from "./types";
import { cn } from "@/lib/utils";
import { Loader2, UserCircle2 } from "lucide-react";

interface Props {
  licencia: LicenseType;
  value: Instructor | null;
  onChange: (i: Instructor) => void;
}

export function StepInstructor({ licencia, value, onChange }: Props) {
  const [loading, setLoading] = useState(true);
  const [items, setItems] = useState<Instructor[]>([]);

  useEffect(() => {
    let mounted = true;
    setLoading(true);
    supabase
      .from("instructors")
      .select("id, user_id, nombres, apellidos, licencias, bio")
      .eq("activo", true)
      .contains("licencias", [licencia])
      .order("nombres")
      .then(({ data }) => {
        if (!mounted) return;
        setItems((data ?? []) as Instructor[]);
        setLoading(false);
      });
    return () => {
      mounted = false;
    };
  }, [licencia]);

  return (
    <div>
      <h2 className="font-display text-2xl font-bold">Elige tu instructor</h2>
      <p className="mt-1 text-sm text-muted-foreground">
        Todos están certificados para enseñar la licencia {licencia}.
      </p>

      {loading ? (
        <div className="mt-8 flex items-center justify-center text-muted-foreground">
          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
          Cargando instructores...
        </div>
      ) : items.length === 0 ? (
        <div className="mt-8 rounded-xl border border-dashed border-border bg-muted/40 p-6 text-center text-sm text-muted-foreground">
          Aún no hay instructores disponibles para esta licencia.
        </div>
      ) : (
        <div className="mt-6 grid gap-3">
          {items.map((ins) => {
            const selected = value?.id === ins.id;
            return (
              <button
                key={ins.id}
                type="button"
                onClick={() => onChange(ins)}
                className={cn(
                  "flex items-start gap-4 rounded-2xl border-2 p-4 text-left transition-smooth hover:shadow-card",
                  selected
                    ? "border-primary bg-primary/5 shadow-elegant"
                    : "border-border bg-card",
                )}
              >
                <div
                  className={cn(
                    "flex h-12 w-12 shrink-0 items-center justify-center rounded-full",
                    selected ? "bg-primary text-primary-foreground" : "bg-muted text-primary",
                  )}
                >
                  <UserCircle2 className="h-7 w-7" />
                </div>
                <div className="flex-1">
                  <div className="font-display text-base font-bold capitalize">
                    {ins.nombres} {ins.apellidos}
                  </div>
                  {ins.bio && (
                    <p className="mt-1 text-sm text-muted-foreground">
                      {ins.bio}
                    </p>
                  )}
                  <div className="mt-2 flex flex-wrap gap-1">
                    {ins.licencias.map((l) => (
                      <span
                        key={l}
                        className="rounded-md bg-secondary px-2 py-0.5 text-[10px] font-semibold text-secondary-foreground"
                      >
                        {l}
                      </span>
                    ))}
                  </div>
                </div>
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}
