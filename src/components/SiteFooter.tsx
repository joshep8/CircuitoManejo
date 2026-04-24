export function SiteFooter() {
  return (
    <footer className="border-t border-border bg-muted/30">
      <div className="container mx-auto px-4 py-10">
        <div className="grid gap-8 md:grid-cols-3">
          <div>
            <h4 className="font-display text-lg font-bold text-foreground">
              Drive<span className="text-primary">Pro</span>
            </h4>
            <p className="mt-2 text-sm text-muted-foreground">
              Escuela de manejo profesional. Formando conductores responsables
              desde el día uno.
            </p>
          </div>
          <div>
            <h5 className="text-sm font-semibold text-foreground">Contacto</h5>
            <ul className="mt-2 space-y-1 text-sm text-muted-foreground">
              <li>+51 999 888 777</li>
              <li>contacto@drivepro.pe</li>
              <li>Av. Javier Prado 1234, Lima</li>
            </ul>
          </div>
          <div>
            <h5 className="text-sm font-semibold text-foreground">Horarios</h5>
            <ul className="mt-2 space-y-1 text-sm text-muted-foreground">
              <li>Lunes a Viernes: 7:00 — 20:00</li>
              <li>Sábados: 8:00 — 14:00</li>
            </ul>
          </div>
        </div>
        <div className="mt-8 border-t border-border pt-6 text-center text-xs text-muted-foreground">
          © {new Date().getFullYear()} DrivePro. Todos los derechos reservados.
        </div>
      </div>
    </footer>
  );
}
