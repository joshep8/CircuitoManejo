import { useEffect, useRef, useState } from "react";
import { Loader2, CheckCircle2, AlertCircle } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import type { BookingDraft } from "./types";

interface Props {
  cliente: BookingDraft["cliente"];
  onChange: (c: BookingDraft["cliente"]) => void;
}

type LookupState =
  | { status: "idle" }
  | { status: "loading" }
  | { status: "ok" }
  | { status: "error"; message: string };

export function StepDatos({ cliente, onChange }: Props) {
  const [lookup, setLookup] = useState<LookupState>({ status: "idle" });
  const lastQueriedDni = useRef<string>("");

  const set = (k: keyof BookingDraft["cliente"], v: string) =>
    onChange({ ...cliente, [k]: v });

  // Autocompletar nombres/apellidos al ingresar 8 dígitos del DNI
  useEffect(() => {
    const dni = cliente.dni;
    if (dni.length !== 8) {
      lastQueriedDni.current = "";
      if (lookup.status !== "idle") setLookup({ status: "idle" });
      return;
    }
    if (lastQueriedDni.current === dni) return;
    lastQueriedDni.current = dni;

    const ctrl = new AbortController();
    setLookup({ status: "loading" });

    (async () => {
      try {
        const res = await fetch(`/api/dni/${dni}`, { signal: ctrl.signal });
        const json = await res.json();
        if (!res.ok || !json.success) {
          setLookup({
            status: "error",
            message: json.error ?? "DNI no encontrado",
          });
          return;
        }
        // Solo rellenar si los campos están vacíos para no pisar ediciones
        onChange({
          ...cliente,
          dni,
          nombres: cliente.nombres.trim() ? cliente.nombres : json.nombres ?? "",
          apellidos: cliente.apellidos.trim()
            ? cliente.apellidos
            : json.apellidos ?? "",
        });
        setLookup({ status: "ok" });
      } catch (err) {
        if ((err as Error).name === "AbortError") return;
        setLookup({
          status: "error",
          message: "No se pudo validar el DNI",
        });
      }
    })();

    return () => ctrl.abort();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [cliente.dni]);

  return (
    <div>
      <h2 className="font-display text-2xl font-bold">Tus datos</h2>
      <p className="mt-1 text-sm text-muted-foreground">
        Necesitamos esta información para confirmar tu reserva y crear tu
        cuenta.
      </p>

      <div className="mt-6 grid gap-4 sm:grid-cols-2">
        <div className="space-y-2 sm:col-span-2">
          <Label htmlFor="dni">DNI *</Label>
          <div className="relative">
            <Input
              id="dni"
              inputMode="numeric"
              maxLength={8}
              placeholder="12345678"
              value={cliente.dni}
              onChange={(e) => set("dni", e.target.value.replace(/\D/g, ""))}
              className="pr-10"
            />
            <div className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2">
              {lookup.status === "loading" && (
                <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />
              )}
              {lookup.status === "ok" && (
                <CheckCircle2 className="h-4 w-4 text-emerald-500" />
              )}
              {lookup.status === "error" && (
                <AlertCircle className="h-4 w-4 text-destructive" />
              )}
            </div>
          </div>
          {lookup.status === "error" ? (
            <p className="text-xs text-destructive">{lookup.message}. Puedes ingresar tus datos manualmente.</p>
          ) : (
            <p className="text-xs text-muted-foreground">
              Al ingresar tu DNI completaremos tus nombres automáticamente. Tu
              DNI será tu contraseña de acceso.
            </p>
          )}
        </div>

        <div className="space-y-2">
          <Label htmlFor="nombres">Nombres *</Label>
          <Input
            id="nombres"
            placeholder="Joshep Ruben"
            value={cliente.nombres}
            onChange={(e) => set("nombres", e.target.value)}
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="apellidos">Apellidos *</Label>
          <Input
            id="apellidos"
            placeholder="Pérez García"
            value={cliente.apellidos}
            onChange={(e) => set("apellidos", e.target.value)}
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="correo">Correo personal *</Label>
          <Input
            id="correo"
            type="email"
            placeholder="tu@correo.com"
            value={cliente.correo}
            onChange={(e) => set("correo", e.target.value)}
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="telefono">Teléfono *</Label>
          <Input
            id="telefono"
            inputMode="numeric"
            maxLength={9}
            placeholder="987654321"
            value={cliente.telefono}
            onChange={(e) => set("telefono", e.target.value.replace(/\D/g, ""))}
          />
        </div>
      </div>
    </div>
  );
}
