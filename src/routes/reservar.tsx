import { createFileRoute } from "@tanstack/react-router";
import { SiteHeader } from "@/components/SiteHeader";
import { SiteFooter } from "@/components/SiteFooter";
import { BookingWizard } from "@/components/booking/BookingWizard";

export const Route = createFileRoute("/reservar")({
  head: () => ({
    meta: [
      { title: "Reservar clase de manejo — DrivePro" },
      {
        name: "description",
        content:
          "Reserva tu clase de manejo paso a paso: licencia, instructor, fecha, datos y pago.",
      },
    ],
  }),
  component: ReservarPage,
});

function ReservarPage() {
  return (
    <div className="flex min-h-screen flex-col bg-gradient-soft">
      <SiteHeader />
      <main className="container mx-auto flex-1 px-4 py-10 md:py-14">
        <div className="mb-8 max-w-2xl">
          <h1 className="font-display text-3xl font-bold tracking-tight md:text-4xl">
            Reserva tu clase
          </h1>
          <p className="mt-2 text-muted-foreground">
            Completa los 5 pasos. Te toma menos de 3 minutos.
          </p>
        </div>
        <BookingWizard />
      </main>
      <SiteFooter />
    </div>
  );
}
