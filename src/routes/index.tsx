import { createFileRoute, Link } from "@tanstack/react-router";
import { Button } from "@/components/ui/button";
import { SiteHeader } from "@/components/SiteHeader";
import { SiteFooter } from "@/components/SiteFooter";
import {
  Award,
  Calendar,
  CheckCircle2,
  Clock,
  ShieldCheck,
  Users,
} from "lucide-react";
import heroImg from "@/assets/hero-driving.jpg";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      {
        title: "DrivePro — Escuela de manejo profesional en Lima",
      },
      {
        name: "description",
        content:
          "Aprende a manejar con instructores certificados. Reserva tu clase de licencia A-I, A-IIa o A-IIb online en minutos.",
      },
      { property: "og:title", content: "DrivePro — Escuela de manejo" },
      {
        property: "og:description",
        content:
          "Reserva tu clase de manejo online con instructores certificados.",
      },
    ],
  }),
  component: HomePage,
});

function HomePage() {
  return (
    <div className="flex min-h-screen flex-col">
      <SiteHeader />
      <main className="flex-1">
        {/* Hero */}
        <section className="relative overflow-hidden bg-gradient-hero text-primary-foreground">
          <div className="container relative mx-auto grid gap-10 px-4 py-20 md:grid-cols-2 md:items-center md:py-28">
            <div className="space-y-6">
              <div className="inline-flex items-center gap-2 rounded-full border border-white/20 bg-white/10 px-3 py-1 text-xs font-medium backdrop-blur">
                <ShieldCheck className="h-3.5 w-3.5" />
                Autorizado por el MTC
              </div>
              <h1 className="font-display text-4xl font-bold leading-tight tracking-tight md:text-6xl">
                Maneja con{" "}
                <span className="text-accent">confianza</span> desde tu primera
                clase
              </h1>
              <p className="max-w-lg text-lg text-white/85">
                Más de 15 años formando conductores en Lima. Instructores
                certificados, autos modernos y un sistema online que se adapta a
                tu horario.
              </p>
              <div className="flex flex-wrap gap-3">
                <Link to="/reservar">
                  <Button variant="hero" size="xl">
                    Reservar ahora
                  </Button>
                </Link>
                <a href="#nosotros">
                  <Button
                    variant="outline"
                    size="xl"
                    className="border-white/30 bg-white/10 text-white hover:bg-white/20 hover:text-white"
                  >
                    Conoce más
                  </Button>
                </a>
              </div>
              <div className="flex flex-wrap gap-6 pt-4 text-sm">
                <Stat value="+5,000" label="Alumnos formados" />
                <Stat value="15+" label="Años de experiencia" />
                <Stat value="98%" label="Aprueban a la primera" />
              </div>
            </div>

            <div className="relative">
              <div className="absolute -inset-4 rounded-3xl bg-accent/20 blur-3xl" />
              <img
                src={heroImg}
                alt="Instructor de manejo profesional junto a vehículo de práctica"
                width={1536}
                height={1024}
                className="relative rounded-3xl shadow-glow"
              />
            </div>
          </div>
        </section>

        {/* Historia / Nosotros */}
        <section id="nosotros" className="bg-background py-20">
          <div className="container mx-auto grid gap-12 px-4 md:grid-cols-2 md:items-center">
            <div>
              <span className="text-sm font-semibold uppercase tracking-wider text-primary">
                Nuestra historia
              </span>
              <h2 className="mt-2 font-display text-3xl font-bold tracking-tight md:text-4xl">
                Una escuela construida sobre la confianza
              </h2>
              <div className="mt-6 space-y-4 text-muted-foreground">
                <p>
                  DrivePro nació en 2009 con una misión clara: enseñar a manejar
                  de forma <strong className="text-foreground">segura,
                  responsable y humana</strong>. Lo que comenzó con un solo auto
                  y dos instructores hoy es una de las escuelas de manejo más
                  reconocidas de Lima.
                </p>
                <p>
                  Hemos formado a más de 5,000 conductores que hoy circulan con
                  seguridad por las calles del Perú. Nuestro método combina
                  teoría moderna, práctica progresiva y acompañamiento
                  personalizado.
                </p>
                <p>
                  Creemos que detrás de cada licencia hay una historia: la de
                  alguien que decidió ser independiente, conseguir un nuevo
                  empleo o cuidar mejor de su familia. Ese es el motor que nos
                  mueve.
                </p>
              </div>
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
              <FeatureCard
                icon={<Award className="h-5 w-5" />}
                title="Instructores certificados"
                desc="Con experiencia comprobable y vocación pedagógica."
              />
              <FeatureCard
                icon={<Calendar className="h-5 w-5" />}
                title="Reserva 100% online"
                desc="Elige día, hora e instructor en menos de 2 minutos."
              />
              <FeatureCard
                icon={<Clock className="h-5 w-5" />}
                title="Horarios flexibles"
                desc="Clases desde las 7 AM hasta las 8 PM."
              />
              <FeatureCard
                icon={<Users className="h-5 w-5" />}
                title="Trato personalizado"
                desc="Aprende a tu ritmo, sin presiones."
              />
            </div>
          </div>
        </section>

        {/* Servicios / Licencias */}
        <section id="servicios" className="bg-gradient-soft py-20">
          <div className="container mx-auto px-4">
            <div className="mx-auto max-w-2xl text-center">
              <span className="text-sm font-semibold uppercase tracking-wider text-primary">
                Nuestros servicios
              </span>
              <h2 className="mt-2 font-display text-3xl font-bold tracking-tight md:text-4xl">
                Elige la licencia que necesitas
              </h2>
              <p className="mt-4 text-muted-foreground">
                Te preparamos para cualquiera de las categorías de licencia
                particular en el Perú.
              </p>
            </div>

            <div className="mt-12 grid gap-6 md:grid-cols-3">
              <LicenseCard
                code="A-I"
                title="Vehículo automático"
                desc="Ideal para quienes inician. Más fácil de manejar en tráfico."
                bullets={["Auto sedán moderno", "10 horas de práctica", "Apto para Lima"]}
              />
              <LicenseCard
                code="A-IIa"
                title="Vehículo mecánico"
                desc="La licencia tradicional. Te abre las puertas a más vehículos."
                bullets={["Caja manual", "Dominio de embrague", "Habilitado para taxi"]}
                featured
              />
              <LicenseCard
                code="A-IIb"
                title="Mecánico avanzado"
                desc="Para quienes buscan conducir vehículos de mayor capacidad."
                bullets={["Vehículos hasta 4T", "Mayor empleabilidad", "Práctica en ruta"]}
              />
            </div>

            <div className="mt-12 text-center">
              <Link to="/reservar">
                <Button variant="cta" size="xl">
                  Reservar mi clase
                </Button>
              </Link>
            </div>
          </div>
        </section>
      </main>
      <SiteFooter />
    </div>
  );
}

function Stat({ value, label }: { value: string; label: string }) {
  return (
    <div>
      <div className="font-display text-2xl font-bold text-accent">{value}</div>
      <div className="text-xs text-white/70">{label}</div>
    </div>
  );
}

function FeatureCard({
  icon,
  title,
  desc,
}: {
  icon: React.ReactNode;
  title: string;
  desc: string;
}) {
  return (
    <div className="rounded-2xl border border-border bg-card p-5 shadow-card transition-smooth hover:shadow-elegant">
      <div className="mb-3 flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10 text-primary">
        {icon}
      </div>
      <h3 className="font-display text-base font-semibold">{title}</h3>
      <p className="mt-1 text-sm text-muted-foreground">{desc}</p>
    </div>
  );
}

function LicenseCard({
  code,
  title,
  desc,
  bullets,
  featured,
}: {
  code: string;
  title: string;
  desc: string;
  bullets: string[];
  featured?: boolean;
}) {
  return (
    <div
      className={`relative flex flex-col rounded-2xl border bg-card p-6 transition-smooth ${
        featured
          ? "border-primary shadow-elegant md:scale-105"
          : "border-border shadow-card hover:shadow-elegant"
      }`}
    >
      {featured && (
        <span className="absolute -top-3 left-1/2 -translate-x-1/2 rounded-full bg-accent px-3 py-1 text-xs font-semibold text-accent-foreground">
          Más popular
        </span>
      )}
      <div className="mb-4 inline-flex w-fit items-center rounded-lg bg-primary/10 px-3 py-1 font-display text-lg font-bold text-primary">
        {code}
      </div>
      <h3 className="font-display text-xl font-bold">{title}</h3>
      <p className="mt-2 text-sm text-muted-foreground">{desc}</p>
      <ul className="mt-4 flex-1 space-y-2 text-sm">
        {bullets.map((b) => (
          <li key={b} className="flex items-start gap-2">
            <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-success" />
            <span>{b}</span>
          </li>
        ))}
      </ul>
    </div>
  );
}
