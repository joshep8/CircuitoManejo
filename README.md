# 🚗 DrivePro — Sistema de Reservas para Escuela de Manejo

Plataforma web full-stack para gestionar reservas de clases prácticas de manejo en una escuela de conducción peruana. Permite a los usuarios reservar clases con instructores certificados según el tipo de licencia (**A-I**, **A-IIa**, **A-IIb**), efectuar el pago y recibir confirmación vía SMS. Incluye un panel administrativo para validar pagos y gestionar instructores activos/inactivos.

---

## 📋 Tabla de Contenidos

- [Características Principales](#-características-principales)
- [Stack Tecnológico](#-stack-tecnológico)
- [Tipo de Arquitectura](#-tipo-de-arquitectura)
- [Modelo de Datos](#-modelo-de-datos)
- [Flujo del Sistema](#-flujo-del-sistema)
- [Roles y Permisos](#-roles-y-permisos)
- [Integraciones Externas](#-integraciones-externas)
- [Estructura del Proyecto](#-estructura-del-proyecto)
- [Variables de Entorno](#-variables-de-entorno)
- [Instalación y Ejecución](#-instalación-y-ejecución)

---

## ✨ Características Principales

- 🔐 **Autenticación segura** con email/contraseña (Supabase Auth + JWT)
- 👥 **Tres roles de usuario**: `usuario`, `instructor`, `administrador` (tabla separada `user_roles`)
- 📅 **Wizard de reserva en 5 pasos**: licencia → fecha/hora → instructor → datos → pago
- 🆔 **Auto-relleno por DNI** vía API RENIEC (Perú)
- 💳 **Validación manual de pagos** por parte del administrador
- 📱 **Notificaciones SMS automáticas** vía Vonage (al pagar y al validar)
- 🎛️ **Activación/Desactivación de instructores** — solo los activos aparecen en el wizard
- 🗂️ **Panel admin modular**: módulos independientes para Reservas, Instructores y Pagos
- 🛡️ **Row Level Security (RLS)** en todas las tablas + función `has_role()` con `SECURITY DEFINER`
- 🎨 **UI moderna** con shadcn/ui, Radix UI y Tailwind CSS v4 (tokens en `oklch`)
- ⚡ **SSR (Server-Side Rendering)** con TanStack Start sobre Cloudflare Workers

---

## 🛠️ Stack Tecnológico

### Lenguajes
- **TypeScript** 5.8.3 — frontend, server functions y rutas API
- **SQL (PostgreSQL 15+)** — migraciones, triggers y funciones `SECURITY DEFINER`
- **TypeScript sobre Deno** — Edge Functions de Supabase

### Frontend
| Tecnología | Versión | Uso |
|------------|---------|-----|
| **React** | 19.2.0 | Librería de UI |
| **TanStack Router** | 1.168.0 | Enrutamiento file-based, type-safe |
| **TanStack Start** | 1.167.14 | Framework full-stack (SSR + server functions) |
| **TanStack Query** | 5.83.0 | Gestión de estado del servidor / cache |
| **Tailwind CSS** | 4.2.1 | Estilos utility-first (config en `src/styles.css`) |
| **shadcn/ui + Radix UI** | varios | Componentes accesibles |
| **React Hook Form** | 7.71.2 | Manejo de formularios |
| **Zod** | 3.24.2 | Validación de esquemas |
| **date-fns** | 4.1.0 | Manipulación de fechas |
| **Lucide React** | 0.575.0 | Iconografía |
| **Sonner** | 2.0.7 | Notificaciones toast |

### Backend / Cloud (Supabase)
| Tecnología | Uso |
|------------|-----|
| **PostgreSQL 15+** | Base de datos relacional |
| **Supabase Auth** | Autenticación con JWT y triggers `handle_new_user` |
| **Row Level Security (RLS)** | Políticas de acceso por fila en todas las tablas |
| **Supabase Edge Functions (Deno)** | `admin-create-instructor`, `seed-admin` |
| **Supabase JS** v2.103.3 | Cliente oficial (browser + server) |
| **Cloudflare Workers** | Runtime serverless edge para SSR + rutas API |

### Build & Tooling
| Herramienta | Versión |
|-------------|---------|
| **Vite** | 7.3.1 |
| **@cloudflare/vite-plugin** | 1.25.5 |
| **@tanstack/router-plugin** | 1.167.10 |
| **ESLint** | 9.32.0 |
| **Prettier** | 3.7.3 |
| **Bun** | gestor de paquetes (también compatible con npm) |
| **Wrangler** | CLI Cloudflare (auto-gestionado) |

### Servicios Externos
- **Vonage SMS API** — Envío de SMS transaccionales (`https://rest.nexmo.com/sms/json`)
- **API RENIEC** (`api.apis.net.pe/v2/reniec/dni`) — Consulta de DNI peruanos

---

## 🏗️ Tipo de Arquitectura

**Arquitectura serverless edge full-stack en 3 capas**, basada en SSR + BaaS (Backend-as-a-Service):

1. **Capa de Presentación** — React 19 con SSR hidratado en el cliente (TanStack Start).
2. **Capa de Servidor Edge** — Cloudflare Worker que ejecuta el SSR, server functions y las rutas API (`/api/dni/$dni`, `/api/sms/send`).
3. **Capa de Datos / BaaS** — (Supabase): PostgreSQL con RLS, Auth con JWT y Edge Functions en Deno.

Características arquitectónicas:
- **File-based routing** type-safe (TanStack Router) — rutas en `src/routes/`.
- **Modular feature-based** en `src/components/admin/` — cada módulo (Bookings, Instructors, Payments) gestiona su propio estado y queries.
- **Server-first data fetching** vía endpoints API y consultas directas a Supabase con RLS.
- **Seguridad por defecto** — toda tabla tiene RLS; los roles viven en `user_roles` (separada de `auth.users` para evitar escalación de privilegios).
- **Edge-first deployment** — todo el cómputo SSR corre en Cloudflare Workers (con `nodejs_compat`).

```
┌─────────────────────────────────────────────────────────────┐
│                    NAVEGADOR (Cliente)                      │
│              React 19 + TanStack Router (Hydration)         │
└─────────────────────────────┬───────────────────────────────┘
                              │ HTTPS
┌─────────────────────────────▼───────────────────────────────┐
│           CLOUDFLARE WORKER (TanStack Start SSR)            │
│  ┌───────────────────────────────────────────────────────┐  │
│  │  Rutas API (server handlers):                         │  │
│  │  • GET  /api/dni/$dni    → Consulta RENIEC            │  │
│  │  • POST /api/sms/send    → Envío Vonage SMS           │  │
│  └───────────────────────────────────────────────────────┘  │
└─────────┬─────────────────────────────────┬─────────────────┘
          │                                 │
          ▼                                 ▼
┌────────────────────────┐   ┌──────────────────────────────┐
│                        │   │  SERVICIOS EXTERNOS          │
│  (Supabase)            │   │  • Vonage SMS                │
│  • PostgreSQL + RLS    │   │  • API RENIEC                │
│  • Auth (JWT)          │   │                              │
│  • Edge Functions      │   │                              │
│    - admin-create-..   │   │                              │
│    - seed-admin        │   │                              │
└────────────────────────┘   └──────────────────────────────┘
```

---

## 🗄️ Modelo de Datos

```
auth.users (Supabase) ──┬── alumnos      (perfil de usuarios finales)
                        ├── instructors  (perfil de instructores + activo + licencias[])
                        ├── admins       (perfil de administradores)
                        └── user_roles   (rol: usuario | instructor | administrador)

bookings ──── instructor_id  → instructors
         └─── user_id        → auth.users

payments ──── booking_id     → bookings (1:1)
```

**Tablas principales:**

| Tabla | Descripción |
|-------|-------------|
| `alumnos` | Perfil de usuarios finales (nombres, apellidos, DNI, correo, teléfono). |
| `instructors` | Instructores con `activo: boolean` y `licencias: license_type[]`. Solo los activos aparecen en el wizard. |
| `admins` | Perfil de administradores. |
| `user_roles` | Relación `user_id ↔ role` (enum `app_role`). **Tabla separada** para evitar escalación de privilegios. |
| `bookings` | Reservas con `estado: booking_status` y datos snapshot del cliente. |
| `payments` | Pago 1:1 con la reserva, con `estado`, `monto`, `expires_at`, `codigo_operacion`. |

**Enums:**
- `app_role`: `usuario` \| `instructor` \| `administrador`
- `license_type`: `A-I` \| `A-IIa` \| `A-IIb`
- `booking_status`: `pendiente` \| `confirmada` \| `cancelada` \| `expirada` \| `completada`
- `payment_status`: `pendiente` \| `pagado` \| `expirado` \| `fallido`

**Función de seguridad:**
```sql
public.has_role(_user_id uuid, _role app_role) RETURNS boolean
  LANGUAGE sql STABLE SECURITY DEFINER
```
Usada en todas las políticas RLS para evitar recursión.

---

## 🔄 Flujo del Sistema

### 1. Registro / Login
```
/login → signUp(email, password, { data: { role: "usuario", ... } })
       → Trigger handle_new_user crea registro en `alumnos` + `user_roles`
       → Redirige a /dashboard
```

### 2. Reserva de Clase (Usuario)
```
/reservar
  ├─ Paso 1: Tipo de licencia (A-I / A-IIa / A-IIb)
  ├─ Paso 2: Fecha y hora
  ├─ Paso 3: Instructor (filtrado por activo=true y licencias[] ⊇ {licencia})
  ├─ Paso 4: Datos personales (DNI → /api/dni/$dni autollena nombres)
  └─ Paso 5: Confirma pago
             → INSERT en `bookings` (pendiente) + `payments` (pendiente)
             → POST /api/sms/send → "Tu pago está siendo validado..."
             → Pantalla de éxito
```

### 3. Validación de Pago (Administrador)
```
/admin → PaymentsModule
  ├─ Validar:
  │  ├─ payments.estado → 'pagado'
  │  ├─ bookings.estado → 'confirmada'
  │  └─ SMS: "¡Pago validado!"
  └─ Rechazar:
     ├─ payments.estado → 'fallido'
     └─ bookings.estado → 'cancelada'
```

### 4. Gestión de Instructores (Administrador)
```
/admin → InstructorsModule
  ├─ Crear: Edge Function `admin-create-instructor`
  │   └─ Crea auth.users + user_roles(instructor) + instructors(activo=true, licencias)
  └─ Activar/Desactivar (Switch):
      └─ UPDATE instructors SET activo = !activo
      → Los inactivos NO aparecen en StepInstructor del wizard
```

### 5. Panel del Instructor
```
/instructor → SELECT * FROM bookings WHERE instructor_id = <mi_id> (vía RLS)
```

---

## 👥 Roles y Permisos

| Rol | Puede |
|-----|-------|
| **usuario** | Crear reservas, ver sus propias reservas y pagos |
| **instructor** | Ver las reservas que tiene asignadas |
| **administrador** | Ver todas las reservas/pagos, validar pagos, crear y activar instructores |

---

## 🔌 Integraciones Externas

### Vonage SMS
- **Endpoint propio:** `POST /api/sms/send` (route en `src/routes/api.sms.send.ts`)
- **Variables:** `VONAGE_API_KEY`, `VONAGE_API_SECRET`, `VONAGE_BRAND_NAME`
- **Helper:** `src/lib/sms.ts` (incluye `normalizePeruPhone` para prefijo `51`)
- **Disparadores:** confirmación de pago en wizard + validación de pago en admin

### API RENIEC (DNI Perú)
- **Endpoint propio:** `GET /api/dni/$dni` (route en `src/routes/api.dni.$dni.ts`)
- **Uso:** Auto-rellena nombres y apellidos en el formulario de reserva

---

## 📁 Estructura del Proyecto

```
src/
├── components/
│   ├── admin/                  → Módulos del panel admin
│   │   ├── BookingsModule.tsx     (reservas + filtros por estado)
│   │   ├── InstructorsModule.tsx  (CRUD + toggle activo/inactivo)
│   │   ├── PaymentsModule.tsx     (validar / rechazar pagos)
│   │   └── NewInstructorDialog.tsx
│   ├── booking/                → Wizard de reserva
│   │   ├── BookingWizard.tsx
│   │   ├── Step{Licencia,FechaHora,Instructor,Datos,Pago}.tsx
│   │   ├── BookingSummary.tsx
│   │   ├── BookingSuccess.tsx
│   │   └── Stepper.tsx
│   ├── ui/                     → shadcn/ui
│   ├── BookingStatusBadge.tsx
│   ├── DashboardGreeting.tsx
│   ├── SiteHeader.tsx
│   └── SiteFooter.tsx
├── hooks/
│   ├── use-auth.ts             → Hook de autenticación
│   └── use-mobile.tsx
├── integrations/supabase/
│   ├── client.ts               → Cliente browser (auto-generado)
│   ├── client.server.ts        → Cliente server-side
│   ├── auth-middleware.ts
│   └── types.ts                → Tipos auto-generados (NO editar)
├── lib/
│   ├── sms.ts                  → Helper Vonage
│   ├── credentials.ts          → Generación de contraseñas temporales
│   └── utils.ts
├── routes/
│   ├── __root.tsx              → Layout raíz + providers
│   ├── index.tsx               → Landing
│   ├── login.tsx               → Auth
│   ├── dashboard.tsx           → Panel del usuario
│   ├── reservar.tsx            → Wizard de reserva
│   ├── instructor.tsx          → Panel del instructor
│   ├── admin.tsx               → Panel admin (Tabs: Reservas / Instructores / Pagos)
│   ├── api.dni.$dni.ts         → Endpoint RENIEC
│   └── api.sms.send.ts         → Endpoint Vonage SMS
├── styles.css                  → Tokens del design system (Tailwind v4, oklch)
└── router.tsx
supabase/
├── config.toml
├── functions/
│   ├── admin-create-instructor/   → Crea auth user + role + instructor
│   └── seed-admin/                → Crea admin por defecto
└── migrations/                    → SQL versionado (NO editar manualmente)
```

---

## 🔑 Variables de Entorno

Auto-configuradas por Lovable Cloud (`.env`):
```
VITE_SUPABASE_URL
VITE_SUPABASE_PUBLISHABLE_KEY
VITE_SUPABASE_PROJECT_ID
```

Secretos del servidor (Lovable Cloud → Backend → Secrets):
```
VONAGE_API_KEY
VONAGE_API_SECRET
VONAGE_BRAND_NAME      (opcional, default: "DrivePro")
```

---

## 🚀 Instalación y Ejecución

```bash
# Instalar dependencias
bun install         # o: npm install

# Desarrollo (http://localhost:8080)
bun dev

# Build de producción
bun run build

# Preview del build
bun run preview

# Lint y formato
bun run lint
bun run format
```

---

## 📝 Notas Técnicas

- TanStack Start v1 con SSR sobre **Cloudflare Workers** (flag `nodejs_compat`).
- `src/integrations/supabase/types.ts` y `supabase/migrations/*` se generan automáticamente — **no editar manualmente**.
- El sistema de roles vive en una **tabla separada** (`user_roles`) y se valida con `has_role()` (`SECURITY DEFINER`) para evitar recursión y escalación de privilegios.
- Los tokens de color del design system se definen en `src/styles.css` usando `oklch`.

---

