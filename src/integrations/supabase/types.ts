export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  // Allows to automatically instantiate createClient with right options
  // instead of createClient<Database, { PostgrestVersion: 'XX' }>(URL, KEY)
  __InternalSupabase: {
    PostgrestVersion: "14.5"
  }
  public: {
    Tables: {
      admins: {
        Row: {
          apellidos: string
          correo: string
          created_at: string
          dni: string
          id: string
          nombres: string
          telefono: string | null
          updated_at: string
          user_id: string
        }
        Insert: {
          apellidos: string
          correo: string
          created_at?: string
          dni: string
          id?: string
          nombres: string
          telefono?: string | null
          updated_at?: string
          user_id: string
        }
        Update: {
          apellidos?: string
          correo?: string
          created_at?: string
          dni?: string
          id?: string
          nombres?: string
          telefono?: string | null
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      alumnos: {
        Row: {
          apellidos: string
          correo: string
          created_at: string
          dni: string
          id: string
          nombres: string
          telefono: string | null
          updated_at: string
          user_id: string
        }
        Insert: {
          apellidos: string
          correo: string
          created_at?: string
          dni: string
          id?: string
          nombres: string
          telefono?: string | null
          updated_at?: string
          user_id: string
        }
        Update: {
          apellidos?: string
          correo?: string
          created_at?: string
          dni?: string
          id?: string
          nombres?: string
          telefono?: string | null
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      bookings: {
        Row: {
          cliente_apellidos: string
          cliente_correo: string
          cliente_dni: string
          cliente_nombres: string
          cliente_telefono: string
          created_at: string
          estado: Database["public"]["Enums"]["booking_status"]
          fecha: string
          hora: string
          id: string
          instructor_id: string
          licencia: Database["public"]["Enums"]["license_type"]
          precio: number
          updated_at: string
          user_id: string
        }
        Insert: {
          cliente_apellidos: string
          cliente_correo: string
          cliente_dni: string
          cliente_nombres: string
          cliente_telefono: string
          created_at?: string
          estado?: Database["public"]["Enums"]["booking_status"]
          fecha: string
          hora: string
          id?: string
          instructor_id: string
          licencia: Database["public"]["Enums"]["license_type"]
          precio?: number
          updated_at?: string
          user_id: string
        }
        Update: {
          cliente_apellidos?: string
          cliente_correo?: string
          cliente_dni?: string
          cliente_nombres?: string
          cliente_telefono?: string
          created_at?: string
          estado?: Database["public"]["Enums"]["booking_status"]
          fecha?: string
          hora?: string
          id?: string
          instructor_id?: string
          licencia?: Database["public"]["Enums"]["license_type"]
          precio?: number
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "bookings_instructor_id_fkey"
            columns: ["instructor_id"]
            isOneToOne: false
            referencedRelation: "instructors"
            referencedColumns: ["id"]
          },
        ]
      }
      instructors: {
        Row: {
          activo: boolean
          apellidos: string
          bio: string | null
          correo: string
          created_at: string
          dni: string
          id: string
          licencias: Database["public"]["Enums"]["license_type"][]
          nombres: string
          telefono: string | null
          updated_at: string
          user_id: string
        }
        Insert: {
          activo?: boolean
          apellidos: string
          bio?: string | null
          correo: string
          created_at?: string
          dni: string
          id?: string
          licencias?: Database["public"]["Enums"]["license_type"][]
          nombres: string
          telefono?: string | null
          updated_at?: string
          user_id: string
        }
        Update: {
          activo?: boolean
          apellidos?: string
          bio?: string | null
          correo?: string
          created_at?: string
          dni?: string
          id?: string
          licencias?: Database["public"]["Enums"]["license_type"][]
          nombres?: string
          telefono?: string | null
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      payments: {
        Row: {
          booking_id: string
          codigo_operacion: string | null
          created_at: string
          estado: Database["public"]["Enums"]["payment_status"]
          expires_at: string
          id: string
          metodo: string
          monto: number
          paid_at: string | null
          user_id: string
        }
        Insert: {
          booking_id: string
          codigo_operacion?: string | null
          created_at?: string
          estado?: Database["public"]["Enums"]["payment_status"]
          expires_at: string
          id?: string
          metodo?: string
          monto: number
          paid_at?: string | null
          user_id: string
        }
        Update: {
          booking_id?: string
          codigo_operacion?: string | null
          created_at?: string
          estado?: Database["public"]["Enums"]["payment_status"]
          expires_at?: string
          id?: string
          metodo?: string
          monto?: number
          paid_at?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "payments_booking_id_fkey"
            columns: ["booking_id"]
            isOneToOne: true
            referencedRelation: "bookings"
            referencedColumns: ["id"]
          },
        ]
      }
      user_roles: {
        Row: {
          created_at: string
          id: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          role?: Database["public"]["Enums"]["app_role"]
          user_id?: string
        }
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      has_role: {
        Args: {
          _role: Database["public"]["Enums"]["app_role"]
          _user_id: string
        }
        Returns: boolean
      }
    }
    Enums: {
      app_role: "usuario" | "instructor" | "administrador"
      booking_status:
        | "pendiente"
        | "confirmada"
        | "cancelada"
        | "expirada"
        | "completada"
      license_type: "A-I" | "A-IIa" | "A-IIb"
      payment_status: "pendiente" | "pagado" | "expirado" | "fallido"
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}

type DatabaseWithoutInternals = Omit<Database, "__InternalSupabase">

type DefaultSchema = DatabaseWithoutInternals[Extract<keyof Database, "public">]

export type Tables<
  DefaultSchemaTableNameOrOptions extends
    | keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
      DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])[TableName] extends {
      Row: infer R
    }
    ? R
    : never
  : DefaultSchemaTableNameOrOptions extends keyof (DefaultSchema["Tables"] &
        DefaultSchema["Views"])
    ? (DefaultSchema["Tables"] &
        DefaultSchema["Views"])[DefaultSchemaTableNameOrOptions] extends {
        Row: infer R
      }
      ? R
      : never
    : never

export type TablesInsert<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Insert: infer I
    }
    ? I
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Insert: infer I
      }
      ? I
      : never
    : never

export type TablesUpdate<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Update: infer U
    }
    ? U
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Update: infer U
      }
      ? U
      : never
    : never

export type Enums<
  DefaultSchemaEnumNameOrOptions extends
    | keyof DefaultSchema["Enums"]
    | { schema: keyof DatabaseWithoutInternals },
  EnumName extends DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never = never,
> = DefaultSchemaEnumNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : DefaultSchemaEnumNameOrOptions extends keyof DefaultSchema["Enums"]
    ? DefaultSchema["Enums"][DefaultSchemaEnumNameOrOptions]
    : never

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
    | keyof DefaultSchema["CompositeTypes"]
    | { schema: keyof DatabaseWithoutInternals },
  CompositeTypeName extends PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never = never,
> = PublicCompositeTypeNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema["CompositeTypes"]
    ? DefaultSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
    : never

export const Constants = {
  public: {
    Enums: {
      app_role: ["usuario", "instructor", "administrador"],
      booking_status: [
        "pendiente",
        "confirmada",
        "cancelada",
        "expirada",
        "completada",
      ],
      license_type: ["A-I", "A-IIa", "A-IIb"],
      payment_status: ["pendiente", "pagado", "expirado", "fallido"],
    },
  },
} as const
