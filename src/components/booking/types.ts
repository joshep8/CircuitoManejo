import type { Database } from "@/integrations/supabase/types";

export type LicenseType = Database["public"]["Enums"]["license_type"];

export interface Instructor {
  id: string;
  user_id: string;
  nombres: string;
  apellidos: string;
  licencias: LicenseType[];
  bio: string | null;
}

export interface BookingDraft {
  licencia: LicenseType | null;
  instructor: Instructor | null;
  fecha: string | null; // YYYY-MM-DD
  hora: string | null; // HH:mm:ss
  cliente: {
    dni: string;
    nombres: string;
    apellidos: string;
    correo: string;
    telefono: string;
  };
  precio: number;
}

// Precio por hora de clase, según tipo de licencia
export const PRECIO_POR_LICENCIA: Record<LicenseType, number> = {
  "A-I": 50,
  "A-IIa": 70,
  "A-IIb": 80,
};

// Precio por defecto (cuando aún no se elige licencia)
export const PRECIO_CLASE = PRECIO_POR_LICENCIA["A-I"];

export const LICENSE_INFO: Record<
  LicenseType,
  { titulo: string; vehiculo: string; descripcion: string; precio: number }
> = {
  "A-I": {
    titulo: "Licencia A-I",
    vehiculo: "Vehículo automático",
    descripcion: "Ideal para principiantes. Sin embrague.",
    precio: PRECIO_POR_LICENCIA["A-I"],
  },
  "A-IIa": {
    titulo: "Licencia A-IIa",
    vehiculo: "Vehículo mecánico",
    descripcion: "La licencia más solicitada. Con caja manual.",
    precio: PRECIO_POR_LICENCIA["A-IIa"],
  },
  "A-IIb": {
    titulo: "Licencia A-IIb",
    vehiculo: "Mecánico avanzado",
    descripcion: "Vehículos hasta 4 toneladas.",
    precio: PRECIO_POR_LICENCIA["A-IIb"],
  },
};

export const HORAS_DISPONIBLES = [
  "08:00:00",
  "09:00:00",
  "10:00:00",
  "11:00:00",
  "14:00:00",
  "15:00:00",
  "16:00:00",
  "17:00:00",
  "18:00:00",
];

export function emptyDraft(): BookingDraft {
  return {
    licencia: null,
    instructor: null,
    fecha: null,
    hora: null,
    cliente: {
      dni: "",
      nombres: "",
      apellidos: "",
      correo: "",
      telefono: "",
    },
    precio: PRECIO_CLASE,
  };
}
