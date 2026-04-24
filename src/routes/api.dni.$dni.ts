import { createFileRoute } from "@tanstack/react-router";

export const Route = createFileRoute("/api/dni/$dni")({
  server: {
    handlers: {
      GET: async ({ params }) => {
        const dni = params.dni;

        if (!dni || dni.length !== 8 || !/^\d+$/.test(dni)) {
          return Response.json(
            { error: "DNI debe tener 8 dígitos" },
            { status: 400 },
          );
        }

        try {
          const response = await fetch(
            `https://factura24.pe/api/consulta-doc/dni/${dni}`,
            { method: "GET", headers: { Accept: "application/json" } },
          );

          if (!response.ok) {
            return Response.json(
              { error: "No se pudo verificar el DNI. Intenta nuevamente." },
              { status: response.status },
            );
          }

          const data = (await response.json()) as {
            success?: boolean;
            data?: {
              nombre?: string;
              nombres?: string;
              apellido_paterno?: string;
              apellido_materno?: string;
              numero_documento?: string;
            };
          };

          if (data.success && data.data) {
            const {
              nombre,
              nombres,
              apellido_paterno,
              apellido_materno,
              numero_documento,
            } = data.data;

            const nombreCompleto =
              nombre ||
              `${nombres ?? ""} ${apellido_paterno ?? ""} ${apellido_materno ?? ""}`
                .replace(/\s+/g, " ")
                .trim();

            const apellidos = [apellido_paterno, apellido_materno]
              .filter(Boolean)
              .join(" ")
              .trim();

            return Response.json({
              success: true,
              dni: numero_documento ?? dni,
              nombres: nombres ?? "",
              apellidoPaterno: apellido_paterno ?? "",
              apellidoMaterno: apellido_materno ?? "",
              apellidos,
              nombreCompleto,
            });
          }

          return Response.json(
            { error: "DNI no encontrado en la base de datos" },
            { status: 404 },
          );
        } catch (err) {
          console.error("Error validating DNI:", err);
          return Response.json(
            { error: "Error al validar DNI" },
            { status: 500 },
          );
        }
      },
    },
  },
});
