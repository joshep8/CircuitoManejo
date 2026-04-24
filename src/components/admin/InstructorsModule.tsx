import { useEffect, useState, useCallback } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { Loader2, Users, UserPlus } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { NewInstructorDialog } from "@/components/admin/NewInstructorDialog";
import { toast } from "sonner";

export interface Instructor {
  id: string;
  nombres: string;
  apellidos: string;
  dni: string;
  correo: string;
  telefono: string | null;
  licencias: string[];
  activo: boolean;
  bio: string | null;
}

interface Props {
  onStatsChange?: (stats: { total: number; activos: number }) => void;
}

export function InstructorsModule({ onStatsChange }: Props) {
  const [instructors, setInstructors] = useState<Instructor[]>([]);
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from("instructors")
      .select("id, nombres, apellidos, dni, correo, telefono, licencias, activo, bio")
      .order("created_at", { ascending: false });

    if (error) {
      console.error("Error loading instructors:", error);
      toast.error("No se pudieron cargar los instructores");
    } else {
      const list = (data ?? []) as Instructor[];
      setInstructors(list);
      onStatsChange?.({
        total: list.length,
        activos: list.filter((i) => i.activo).length,
      });
    }
    setLoading(false);
  }, [onStatsChange]);

  useEffect(() => {
    load();
  }, [load]);

  const toggleActive = async (id: string, activo: boolean) => {
    const { error } = await supabase
      .from("instructors")
      .update({ activo: !activo })
      .eq("id", id);
    if (error) {
      toast.error("No se pudo actualizar");
      return;
    }
    toast.success(activo ? "Instructor desactivado" : "Instructor activado");
    setInstructors((prev) => {
      const next = prev.map((i) => (i.id === id ? { ...i, activo: !activo } : i));
      onStatsChange?.({
        total: next.length,
        activos: next.filter((i) => i.activo).length,
      });
      return next;
    });
  };

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between gap-3">
        <CardTitle className="flex items-center gap-2">
          <Users className="h-5 w-5 text-primary" />
          Instructores registrados
        </CardTitle>
        <Button size="sm" variant="hero" onClick={() => setDialogOpen(true)}>
          <UserPlus className="mr-2 h-4 w-4" />
          Nuevo instructor
        </Button>
      </CardHeader>
      <CardContent>
        {loading ? (
          <div className="flex items-center gap-2 py-8 text-muted-foreground">
            <Loader2 className="h-4 w-4 animate-spin" /> Cargando instructores...
          </div>
        ) : instructors.length === 0 ? (
          <div className="flex flex-col items-center gap-3 py-12 text-center text-muted-foreground">
            <Users className="h-12 w-12 opacity-30" />
            <p>Aún no hay instructores. Registra el primero.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Nombre</TableHead>
                  <TableHead>DNI</TableHead>
                  <TableHead>Correo</TableHead>
                  <TableHead>Teléfono</TableHead>
                  <TableHead>Licencias</TableHead>
                  <TableHead>Estado</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {instructors.map((i) => (
                  <TableRow key={i.id} className={!i.activo ? "opacity-60" : ""}>
                    <TableCell className="font-medium capitalize">
                      {i.nombres} {i.apellidos}
                    </TableCell>
                    <TableCell>{i.dni}</TableCell>
                    <TableCell className="font-mono text-xs">{i.correo}</TableCell>
                    <TableCell>{i.telefono ?? "—"}</TableCell>
                    <TableCell>
                      <div className="flex flex-wrap gap-1">
                        {i.licencias.map((l) => (
                          <Badge key={l} variant="secondary">
                            {l}
                          </Badge>
                        ))}
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <Switch
                          checked={i.activo}
                          onCheckedChange={() => toggleActive(i.id, i.activo)}
                          aria-label={
                            i.activo ? "Desactivar instructor" : "Activar instructor"
                          }
                        />
                        <Badge
                          variant={i.activo ? "default" : "outline"}
                          className={
                            i.activo
                              ? "bg-emerald-600 hover:bg-emerald-600"
                              : "text-muted-foreground"
                          }
                        >
                          {i.activo ? "Activo" : "Inactivo"}
                        </Badge>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        )}
      </CardContent>

      <NewInstructorDialog
        open={dialogOpen}
        onOpenChange={setDialogOpen}
        onCreated={load}
      />
    </Card>
  );
}
