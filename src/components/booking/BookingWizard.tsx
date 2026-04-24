import { useMemo, useState } from "react";
import { ArrowLeft, ArrowRight, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Stepper } from "./Stepper";
import { BookingSummary } from "./BookingSummary";
import { StepLicencia } from "./StepLicencia";
import { StepInstructor } from "./StepInstructor";
import { StepFechaHora } from "./StepFechaHora";
import { StepDatos } from "./StepDatos";
import { StepPago } from "./StepPago";
import { BookingSuccess } from "./BookingSuccess";
import { emptyDraft, PRECIO_POR_LICENCIA, type BookingDraft } from "./types";
import { supabase } from "@/integrations/supabase/client";
import {
  buildInstitutionalEmail,
  buildInstitutionalPassword,
} from "@/lib/credentials";
import { sendSms, normalizePeruPhone } from "@/lib/sms";
import { toast } from "sonner";

const STEPS = [
  { id: 1, label: "Licencia" },
  { id: 2, label: "Instructor" },
  { id: 3, label: "Fecha y hora" },
  { id: 4, label: "Tus datos" },
  { id: 5, label: "Pago" },
];

const PAGO_DURATION_MS = 60_000; // 1 minuto

export function BookingWizard() {
  const [step, setStep] = useState(1);
  const [draft, setDraft] = useState<BookingDraft>(emptyDraft());
  const [pagoExpiresAt, setPagoExpiresAt] = useState<number | null>(null);
  const [bookingId, setBookingId] = useState<string | null>(null);
  const [creating, setCreating] = useState(false);
  const [paying, setPaying] = useState(false);
  const [done, setDone] = useState(false);
  const [accountEmail, setAccountEmail] = useState("");

  const canNext = useMemo(() => {
    switch (step) {
      case 1:
        return !!draft.licencia;
      case 2:
        return !!draft.instructor;
      case 3:
        return !!draft.fecha && !!draft.hora;
      case 4: {
        const c = draft.cliente;
        return (
          c.dni.length === 8 &&
          c.nombres.trim().length >= 2 &&
          c.apellidos.trim().length >= 2 &&
          /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(c.correo) &&
          c.telefono.length >= 7
        );
      }
      default:
        return false;
    }
  }, [step, draft]);

  /**
   * Al pasar de "Datos" (4) a "Pago" (5):
   * 1. Asegurar sesión (signUp con correo institucional, o signIn si ya existe)
   * 2. Crear booking con estado 'pendiente'
   * 3. Crear payment con expires_at = ahora + 60s
   * 4. Iniciar el temporizador
   */
  const handleGoToPayment = async () => {
    setCreating(true);
    try {
      const { dni, nombres, apellidos, correo, telefono } = draft.cliente;
      const institutionalEmail = buildInstitutionalEmail(nombres, dni);
      const password = buildInstitutionalPassword(dni);
      setAccountEmail(institutionalEmail);

      // 1. Asegurar sesión
      const { data: sessionData } = await supabase.auth.getSession();
      let userId = sessionData.session?.user.id;

      if (!userId) {
        // Intentar signUp; si el correo ya existe -> signIn
        const { data: signUpData, error: signUpErr } = await supabase.auth.signUp({
          email: institutionalEmail,
          password,
          options: {
            data: { role: "usuario", dni, nombres, apellidos, telefono },
            emailRedirectTo: `${window.location.origin}/dashboard`,
          },
        });

        if (signUpErr && !signUpErr.message.toLowerCase().includes("registered")) {
          throw signUpErr;
        }

        if (signUpData?.user) {
          userId = signUpData.user.id;
        } else {
          // Ya existía: iniciar sesión
          const { data: signInData, error: signInErr } =
            await supabase.auth.signInWithPassword({
              email: institutionalEmail,
              password,
            });
          if (signInErr) throw signInErr;
          userId = signInData.user.id;
        }
      }

      if (!userId) throw new Error("No se pudo crear la sesión");

      // 2. Crear booking
      const { data: booking, error: bookingErr } = await supabase
        .from("bookings")
        .insert({
          user_id: userId,
          instructor_id: draft.instructor!.id,
          licencia: draft.licencia!,
          fecha: draft.fecha!,
          hora: draft.hora!,
          cliente_dni: dni,
          cliente_nombres: nombres,
          cliente_apellidos: apellidos,
          cliente_correo: correo,
          cliente_telefono: telefono,
          precio: draft.precio,
          estado: "pendiente",
        })
        .select()
        .single();

      if (bookingErr) {
        if (bookingErr.code === "23505") {
          throw new Error(
            "Ese horario acaba de ser tomado. Elige otro por favor.",
          );
        }
        throw bookingErr;
      }

      const expires = Date.now() + PAGO_DURATION_MS;

      // 3. Crear payment pendiente
      const { error: payErr } = await supabase.from("payments").insert({
        booking_id: booking.id,
        user_id: userId,
        monto: draft.precio,
        metodo: "yape",
        estado: "pendiente",
        expires_at: new Date(expires).toISOString(),
      });
      if (payErr) throw payErr;

      setBookingId(booking.id);
      setPagoExpiresAt(expires);
      setStep(5);
    } catch (err) {
      console.error(err);
      toast.error("No pudimos preparar tu reserva", {
        description:
          err instanceof Error ? err.message : "Intenta nuevamente.",
      });
    } finally {
      setCreating(false);
    }
  };

  const handlePay = async (codigoOperacion: string) => {
    if (!bookingId) return;
    setPaying(true);
    try {
      const { error: payUpdErr } = await supabase
        .from("payments")
        .update({
          estado: "pagado",
          codigo_operacion: codigoOperacion,
          paid_at: new Date().toISOString(),
        })
        .eq("booking_id", bookingId);
      if (payUpdErr) throw payUpdErr;

      // El booking queda 'pendiente' a la espera de validación del administrador.
      // No lo marcamos como 'confirmada' aquí: eso lo hace el admin al validar el pago.

      // Enviar SMS al usuario informando que el admin está validando
      const phone = normalizePeruPhone(draft.cliente.telefono);
      if (phone) {
        sendSms(
          phone,
          `Hola ${draft.cliente.nombres}, registramos tu pago por S/ ${draft.precio.toFixed(2)} en DrivePro. Estás a punto de confirmar tu reserva: el administrador está validando tu pago. Te avisaremos en cuanto sea aprobado.`,
        ).catch((e) => console.error("SMS pendiente fallo:", e));
      }

      toast.success("¡Pago registrado!", {
        description: "El administrador validará tu pago en breve.",
      });
      setDone(true);
    } catch (err) {
      console.error(err);
      toast.error("No pudimos confirmar el pago", {
        description: err instanceof Error ? err.message : "",
      });
    } finally {
      setPaying(false);
    }
  };

  const handleExpire = async () => {
    if (!bookingId) return;
    try {
      await supabase
        .from("payments")
        .update({ estado: "expirado" })
        .eq("booking_id", bookingId);
      await supabase
        .from("bookings")
        .update({ estado: "expirada" })
        .eq("id", bookingId);
      toast.error("Tu reserva expiró", {
        description: "Si quieres, comienza una nueva.",
      });
    } catch (err) {
      console.error(err);
    }
  };

  const handleNext = async () => {
    if (step === 4) {
      await handleGoToPayment();
    } else {
      setStep((s) => s + 1);
    }
  };

  if (done) {
    return <BookingSuccess draft={draft} email={accountEmail} />;
  }

  return (
    <div className="grid gap-6 lg:grid-cols-[1fr_340px]">
      <div className="rounded-3xl border border-border bg-card p-6 shadow-card md:p-8">
        <Stepper steps={STEPS} current={step} />

        <div className="mt-8">
          {step === 1 && (
            <StepLicencia
              value={draft.licencia}
              onChange={(v) =>
                setDraft({
                  ...draft,
                  licencia: v,
                  instructor: null,
                  precio: PRECIO_POR_LICENCIA[v],
                })
              }
            />
          )}
          {step === 2 && draft.licencia && (
            <StepInstructor
              licencia={draft.licencia}
              value={draft.instructor}
              onChange={(i) =>
                setDraft({ ...draft, instructor: i, fecha: null, hora: null })
              }
            />
          )}
          {step === 3 && draft.instructor && (
            <StepFechaHora
              instructorId={draft.instructor.id}
              fecha={draft.fecha}
              hora={draft.hora}
              onChange={(f, h) => setDraft({ ...draft, fecha: f, hora: h })}
            />
          )}
          {step === 4 && (
            <StepDatos
              cliente={draft.cliente}
              onChange={(c) => setDraft({ ...draft, cliente: c })}
            />
          )}
          {step === 5 && pagoExpiresAt && (
            <StepPago
              monto={draft.precio}
              expiresAt={pagoExpiresAt}
              onPay={handlePay}
              onExpire={handleExpire}
              paying={paying}
            />
          )}
        </div>

        {step < 5 && (
          <div className="mt-8 flex items-center justify-between gap-3 border-t border-border pt-6">
            <Button
              variant="ghost"
              onClick={() => setStep((s) => Math.max(1, s - 1))}
              disabled={step === 1 || creating}
            >
              <ArrowLeft className="mr-1 h-4 w-4" />
              Atrás
            </Button>
            <Button
              variant="cta"
              size="lg"
              onClick={handleNext}
              disabled={!canNext || creating}
            >
              {creating ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Preparando pago...
                </>
              ) : step === 4 ? (
                <>Ir a pago <ArrowRight className="ml-1 h-4 w-4" /></>
              ) : (
                <>Siguiente <ArrowRight className="ml-1 h-4 w-4" /></>
              )}
            </Button>
          </div>
        )}
      </div>

      <aside className="lg:sticky lg:top-24 lg:self-start">
        <BookingSummary draft={draft} />
      </aside>
    </div>
  );
}
