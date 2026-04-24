import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect, useState, useCallback } from "react";
import { SiteHeader } from "@/components/SiteHeader";
import { SiteFooter } from "@/components/SiteFooter";
import { useAuth } from "@/hooks/use-auth";
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "@/components/ui/tabs";
import { Card, CardContent } from "@/components/ui/card";
import { Users, Calendar, DollarSign, TrendingUp } from "lucide-react";
import { InstructorsModule } from "@/components/admin/InstructorsModule";
import { BookingsModule } from "@/components/admin/BookingsModule";
import { PaymentsModule } from "@/components/admin/PaymentsModule";
import { DashboardGreeting } from "@/components/DashboardGreeting";

export const Route = createFileRoute("/admin")({
  head: () => ({ meta: [{ title: "Panel administrativo — DrivePro" }] }),
  component: AdminPage,
});

function AdminPage() {
  const { user, loading, hasRole } = useAuth();
  const navigate = useNavigate();
  const [instructorStats, setInstructorStats] = useState({ total: 0, activos: 0 });
  const [bookingStats, setBookingStats] = useState({
    total: 0,
    confirmadas: 0,
    ingresos: 0,
  });

  useEffect(() => {
    if (loading) return;
    if (!user) navigate({ to: "/login" });
    else if (!hasRole("administrador")) navigate({ to: "/" });
  }, [loading, user, hasRole, navigate]);

  const handleInstructorStats = useCallback(
    (s: { total: number; activos: number }) => setInstructorStats(s),
    [],
  );
  const handleBookingStats = useCallback(
    (s: { total: number; confirmadas: number; ingresos: number }) =>
      setBookingStats(s),
    [],
  );

  return (
    <div className="flex min-h-screen flex-col">
      <SiteHeader />
      <main className="container mx-auto flex-1 px-4 py-10">
        {user && (
          <DashboardGreeting
            userId={user.id}
            role="administrador"
            fallbackEmail={user.email}
          />
        )}
        <div className="mb-8">
          <h1 className="font-display text-3xl font-bold tracking-tight">
            Panel administrativo
          </h1>
          <p className="mt-1 text-muted-foreground">
            Gestiona instructores y supervisa las reservas de la escuela.
          </p>
        </div>

        {/* Stats */}
        <div className="mb-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <StatCard
            icon={Users}
            label="Instructores"
            value={`${instructorStats.activos} / ${instructorStats.total}`}
            hint="activos del total"
          />
          <StatCard
            icon={Calendar}
            label="Reservas totales"
            value={String(bookingStats.total)}
          />
          <StatCard
            icon={TrendingUp}
            label="Confirmadas"
            value={String(bookingStats.confirmadas)}
            color="text-emerald-600"
          />
          <StatCard
            icon={DollarSign}
            label="Ingresos confirmados"
            value={`S/ ${bookingStats.ingresos.toFixed(2)}`}
            color="text-primary"
          />
        </div>

        <Tabs defaultValue="instructors">
          <TabsList>
            <TabsTrigger value="instructors">Instructores</TabsTrigger>
            <TabsTrigger value="bookings">Reservas</TabsTrigger>
            <TabsTrigger value="payments">Pagos</TabsTrigger>
          </TabsList>

          <TabsContent value="instructors" className="mt-4">
            <InstructorsModule onStatsChange={handleInstructorStats} />
          </TabsContent>

          <TabsContent value="bookings" className="mt-4">
            <BookingsModule onStatsChange={handleBookingStats} />
          </TabsContent>

          <TabsContent value="payments" className="mt-4">
            <PaymentsModule />
          </TabsContent>
        </Tabs>
      </main>
      <SiteFooter />
    </div>
  );
}

function StatCard({
  icon: Icon,
  label,
  value,
  hint,
  color = "text-foreground",
}: {
  icon: React.ComponentType<{ className?: string }>;
  label: string;
  value: string;
  hint?: string;
  color?: string;
}) {
  return (
    <Card>
      <CardContent className="pt-6">
        <div className="flex items-center justify-between">
          <p className="text-sm font-medium text-muted-foreground">{label}</p>
          <Icon className="h-5 w-5 text-muted-foreground/60" />
        </div>
        <p className={`mt-2 font-display text-3xl font-bold ${color}`}>{value}</p>
        {hint && <p className="mt-1 text-xs text-muted-foreground">{hint}</p>}
      </CardContent>
    </Card>
  );
}
