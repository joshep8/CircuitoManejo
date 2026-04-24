import { LICENSE_INFO, type LicenseType } from "./types";
import { Cog, Sparkles, Truck } from "lucide-react";
import { cn } from "@/lib/utils";

interface Props {
  value: LicenseType | null;
  onChange: (v: LicenseType) => void;
}

const ICONS = {
  "A-I": <Sparkles className="h-6 w-6" />,
  "A-IIa": <Cog className="h-6 w-6" />,
  "A-IIb": <Truck className="h-6 w-6" />,
} as const;

export function StepLicencia({ value, onChange }: Props) {
  return (
    <div>
      <h2 className="font-display text-2xl font-bold">¿Qué licencia te interesa?</h2>
      <p className="mt-1 text-sm text-muted-foreground">
        Elige el tipo de vehículo en el que quieres aprender.
      </p>

      <div className="mt-6 grid gap-4 md:grid-cols-3">
        {(Object.keys(LICENSE_INFO) as LicenseType[]).map((code) => {
          const info = LICENSE_INFO[code];
          const selected = value === code;
          return (
            <button
              key={code}
              type="button"
              onClick={() => onChange(code)}
              className={cn(
                "flex flex-col items-start rounded-2xl border-2 p-5 text-left transition-smooth hover:shadow-elegant",
                selected
                  ? "border-primary bg-primary/5 shadow-elegant"
                  : "border-border bg-card",
              )}
            >
              <div
                className={cn(
                  "flex h-12 w-12 items-center justify-center rounded-xl",
                  selected ? "bg-primary text-primary-foreground" : "bg-muted text-primary",
                )}
              >
                {ICONS[code]}
              </div>
              <div className="mt-3 font-display text-lg font-bold">{code}</div>
              <div className="text-sm font-medium text-foreground">{info.vehiculo}</div>
              <p className="mt-2 text-xs text-muted-foreground">{info.descripcion}</p>
              <div className="mt-3 flex items-baseline gap-1">
                <span className="font-display text-xl font-bold text-primary">
                  S/ {info.precio}
                </span>
                <span className="text-xs text-muted-foreground">/ hora</span>
              </div>
            </button>
          );
        })}
      </div>
    </div>
  );
}
