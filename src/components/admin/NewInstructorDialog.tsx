import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import { Loader2, Copy, CheckCircle2 } from "lucide-react";
import { toast } from "sonner";
import { buildInstitutionalEmail } from "@/lib/credentials";

interface Props {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  onCreated: () => void;
}

const LICENCIAS = ["A-I", "A-IIa", "A-IIb"] as const;

export function NewInstructorDialog({ open, onOpenChange, onCreated }: Props) {
  const [nombres, setNombres] = useState("");
  const [apellidos, setApellidos] = useState("");
  const [dni, setDni] = useState("");
  const [telefono, setTelefono] = useState("");
  const [bio, setBio] = useState("");
  const [licencias, setLicencias] = useState<string[]>(["A-I"]);
  const [submitting, setSubmitting] = useState(false);
  const [created, setCreated] = useState<{
    email: string;
    password: string;
  } | null>(null);

  const previewEmail =
    nombres && dni.length >= 2 ? buildInstitutionalEmail(nombres, dni) : "—";

  const reset = () => {
    setNombres("");
    setApellidos("");
    setDni("");
    setTelefono("");
    setBio("");
    setLicencias(["A-I"]);
    setCreated(null);
  };

  const handleSubmit = async () => {
    if (!nombres.trim() || !apellidos.trim() || !dni.trim()) {
      toast.error("Completa nombres, apellidos y DNI");
      return;
    }
    if (dni.replace(/\D/g, "").length !== 8) {
      toast.error("El DNI debe tener 8 dígitos");
      return;
    }
    if (licencias.length === 0) {
      toast.error("Selecciona al menos una licencia");
      return;
    }

    setSubmitting(true);
    const { data, error } = await supabase.functions.invoke(
      "admin-create-instructor",
      {
        body: {
          nombres: nombres.trim(),
          apellidos: apellidos.trim(),
          dni: dni.replace(/\D/g, ""),
          telefono: telefono.trim() || undefined,
          bio: bio.trim() || undefined,
          licencias,
        },
      },
    );
    setSubmitting(false);

    if (error || data?.error) {
      toast.error(data?.error ?? error?.message ?? "Error creando instructor");
      return;
    }

    toast.success("Instructor creado correctamente");
    setCreated({
      email: data.instructor.email,
      password: data.instructor.password,
    });
    onCreated();
  };

  const handleClose = (v: boolean) => {
    if (!v) reset();
    onOpenChange(v);
  };

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="max-w-lg">
        {created ? (
          <>
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2">
                <CheckCircle2 className="h-5 w-5 text-emerald-600" />
                Instructor creado
              </DialogTitle>
              <DialogDescription>
                Comparte estas credenciales con el instructor. Podrá iniciar
                sesión inmediatamente.
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-3 rounded-lg border bg-muted/30 p-4">
              <CredentialRow label="Correo" value={created.email} />
              <CredentialRow label="Contraseña" value={created.password} />
            </div>
            <DialogFooter>
              <Button onClick={() => handleClose(false)}>Cerrar</Button>
            </DialogFooter>
          </>
        ) : (
          <>
            <DialogHeader>
              <DialogTitle>Registrar nuevo instructor</DialogTitle>
              <DialogDescription>
                Las credenciales se generan automáticamente: correo =
                nombre+2dígitosDNI, contraseña = DNI completo.
              </DialogDescription>
            </DialogHeader>
            <div className="grid gap-4 py-2">
              <div className="grid gap-2 sm:grid-cols-2">
                <div className="space-y-1.5">
                  <Label>Nombres *</Label>
                  <Input
                    value={nombres}
                    onChange={(e) => setNombres(e.target.value)}
                    placeholder="ej. Juan Carlos"
                  />
                </div>
                <div className="space-y-1.5">
                  <Label>Apellidos *</Label>
                  <Input
                    value={apellidos}
                    onChange={(e) => setApellidos(e.target.value)}
                    placeholder="ej. Pérez García"
                  />
                </div>
              </div>
              <div className="grid gap-2 sm:grid-cols-2">
                <div className="space-y-1.5">
                  <Label>DNI * (8 dígitos)</Label>
                  <Input
                    value={dni}
                    onChange={(e) =>
                      setDni(e.target.value.replace(/\D/g, "").slice(0, 8))
                    }
                    placeholder="71885432"
                    inputMode="numeric"
                  />
                </div>
                <div className="space-y-1.5">
                  <Label>Teléfono</Label>
                  <Input
                    value={telefono}
                    onChange={(e) => setTelefono(e.target.value)}
                    placeholder="987654321"
                  />
                </div>
              </div>
              <div className="space-y-1.5">
                <Label>Licencias que enseña *</Label>
                <div className="flex flex-wrap gap-3 rounded-md border bg-muted/20 p-3">
                  {LICENCIAS.map((l) => (
                    <label
                      key={l}
                      className="flex cursor-pointer items-center gap-2 text-sm font-medium"
                    >
                      <Checkbox
                        checked={licencias.includes(l)}
                        onCheckedChange={(c) =>
                          setLicencias((prev) =>
                            c
                              ? [...prev, l]
                              : prev.filter((x) => x !== l),
                          )
                        }
                      />
                      {l}
                    </label>
                  ))}
                </div>
              </div>
              <div className="space-y-1.5">
                <Label>Biografía (opcional)</Label>
                <Textarea
                  value={bio}
                  onChange={(e) => setBio(e.target.value)}
                  placeholder="Experiencia, especialización..."
                  rows={3}
                />
              </div>
              <div className="rounded-md border bg-primary/5 p-3 text-xs">
                <p className="font-medium text-foreground">Credenciales generadas:</p>
                <p className="mt-1 text-muted-foreground">
                  Correo: <span className="font-mono">{previewEmail}</span>
                </p>
                <p className="text-muted-foreground">
                  Contraseña:{" "}
                  <span className="font-mono">
                    {dni.length === 8 ? dni : "(DNI completo)"}
                  </span>
                </p>
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => handleClose(false)}>
                Cancelar
              </Button>
              <Button onClick={handleSubmit} disabled={submitting} variant="hero">
                {submitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                Crear instructor
              </Button>
            </DialogFooter>
          </>
        )}
      </DialogContent>
    </Dialog>
  );
}

function CredentialRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-center justify-between gap-3">
      <div>
        <p className="text-xs font-medium text-muted-foreground">{label}</p>
        <p className="font-mono text-sm font-semibold">{value}</p>
      </div>
      <Button
        variant="ghost"
        size="sm"
        onClick={() => {
          navigator.clipboard.writeText(value);
          toast.success(`${label} copiado`);
        }}
      >
        <Copy className="h-4 w-4" />
      </Button>
    </div>
  );
}
