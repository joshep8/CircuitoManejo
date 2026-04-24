import { useEffect, useState } from "react";
import { Loader2, Smartphone, Timer } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import qrImg from "@/assets/yape-qr.png";
import { cn } from "@/lib/utils";

interface Props {
  monto: number;
  expiresAt: number; // timestamp ms
  onPay: (codigoOperacion: string) => void;
  onExpire: () => void;
  paying: boolean;
}

export function StepPago({ monto, expiresAt, onPay, onExpire, paying }: Props) {
  const [now, setNow] = useState(Date.now());
  const [codigo, setCodigo] = useState("");
  const [expired, setExpired] = useState(false);

  useEffect(() => {
    const id = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(id);
  }, []);

  const remainingMs = Math.max(0, expiresAt - now);
  const remainingSec = Math.floor(remainingMs / 1000);
  const mm = String(Math.floor(remainingSec / 60)).padStart(2, "0");
  const ss = String(remainingSec % 60).padStart(2, "0");

  useEffect(() => {
    if (remainingMs === 0 && !expired) {
      setExpired(true);
      onExpire();
    }
  }, [remainingMs, expired, onExpire]);

  const handlePay = () => {
    const op = codigo.trim() || `YP${Math.floor(Math.random() * 1_000_000)}`;
    onPay(op);
  };

  const isLow = remainingSec <= 15;

  return (
    <div>
      <h2 className="font-display text-2xl font-bold">Realizar pago con Yape</h2>
      <p className="mt-1 text-sm text-muted-foreground">
        Escanea el código QR desde tu app de Yape y completa el pago antes de
        que expire el tiempo.
      </p>

      {/* Temporizador */}
      <div
        className={cn(
          "mt-5 flex items-center justify-between rounded-2xl border-2 p-4 transition-smooth",
          expired
            ? "border-destructive bg-destructive/5"
            : isLow
              ? "border-warning bg-warning/10 animate-pulse"
              : "border-primary/30 bg-primary/5",
        )}
      >
        <div className="flex items-center gap-3">
          <div
            className={cn(
              "flex h-10 w-10 items-center justify-center rounded-full",
              expired
                ? "bg-destructive text-destructive-foreground"
                : isLow
                  ? "bg-warning text-warning-foreground"
                  : "bg-primary text-primary-foreground",
            )}
          >
            <Timer className="h-5 w-5" />
          </div>
          <div>
            <div className="text-xs font-medium text-muted-foreground">
              {expired ? "Tiempo agotado" : "Tiempo restante"}
            </div>
            <div
              className={cn(
                "font-display text-xl font-bold tabular-nums",
                expired ? "text-destructive" : "text-foreground",
              )}
            >
              {mm}:{ss}
            </div>
          </div>
        </div>
        <div className="text-right">
          <div className="text-xs text-muted-foreground">Monto</div>
          <div className="font-display text-xl font-bold text-primary">
            S/ {monto.toFixed(2)}
          </div>
        </div>
      </div>

      <div className="mt-6 grid gap-6 md:grid-cols-2 md:items-start">
        {/* QR */}
        <div className="rounded-2xl border border-border bg-card p-5 text-center shadow-card">
          <div className="mb-3 inline-flex items-center gap-2 rounded-full bg-[#742583]/10 px-3 py-1 text-xs font-bold text-[#742583]">
            <Smartphone className="h-3.5 w-3.5" /> Pago Yape simulado
          </div>
          <div className="mx-auto aspect-square w-full max-w-[220px] overflow-hidden rounded-xl border border-border bg-white p-3">
            <img
              src={qrImg}
              alt="Código QR Yape simulado"
              className="h-full w-full object-contain"
            />
          </div>
          <div className="mt-3 text-sm">
            <div className="font-semibold">DrivePro Escuela</div>
            <div className="text-muted-foreground">+51 999 888 777</div>
          </div>
        </div>

        {/* Confirmación */}
        <div className="space-y-4">
          <div className="rounded-2xl border border-border bg-card p-5 shadow-card">
            <h3 className="font-display text-base font-bold">
              Confirmar pago
            </h3>
            <p className="mt-1 text-xs text-muted-foreground">
              Ingresa el código de operación que te dio Yape (opcional para la
              simulación).
            </p>
            <div className="mt-3 space-y-2">
              <Label htmlFor="op">Código de operación</Label>
              <Input
                id="op"
                placeholder="Ej: 12345678"
                value={codigo}
                onChange={(e) => setCodigo(e.target.value)}
                disabled={expired || paying}
              />
            </div>
            <Button
              variant="cta"
              size="lg"
              className="mt-4 w-full"
              onClick={handlePay}
              disabled={expired || paying}
            >
              {paying ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Procesando pago...
                </>
              ) : (
                "He realizado el pago"
              )}
            </Button>
          </div>

          {expired && (
            <div className="rounded-xl border border-destructive/30 bg-destructive/5 p-4 text-sm text-destructive">
              <strong>Tu reserva no se completó.</strong> El tiempo de pago
              expiró. Por favor inicia una nueva reserva.
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
