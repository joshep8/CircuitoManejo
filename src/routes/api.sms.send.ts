import { createFileRoute } from "@tanstack/react-router";

const VONAGE_URL = "https://rest.nexmo.com/sms/json";

export const Route = createFileRoute("/api/sms/send")({
  server: {
    handlers: {
      POST: async ({ request }) => {
        try {
          const body = (await request.json()) as {
            to?: string;
            message?: string;
          };

          const to = (body.to ?? "").replace(/\D/g, "");
          const message = (body.message ?? "").trim();

          if (!to || to.length < 8) {
            return Response.json(
              { error: "Número 'to' inválido" },
              { status: 400 },
            );
          }
          if (!message || message.length > 480) {
            return Response.json(
              { error: "Mensaje vacío o demasiado largo" },
              { status: 400 },
            );
          }

          const apiKey = process.env.VONAGE_API_KEY;
          const apiSecret = process.env.VONAGE_API_SECRET;
          const from = process.env.VONAGE_BRAND_NAME || "DrivePro";

          if (!apiKey || !apiSecret) {
            console.error("Vonage credentials not configured");
            return Response.json(
              { error: "SMS no configurado en el servidor" },
              { status: 500 },
            );
          }

          const params = new URLSearchParams({
            api_key: apiKey,
            api_secret: apiSecret,
            from,
            to,
            text: message,
          });

          const res = await fetch(VONAGE_URL, {
            method: "POST",
            headers: {
              "Content-Type": "application/x-www-form-urlencoded",
              Accept: "application/json",
            },
            body: params.toString(),
          });

          const data = (await res.json()) as {
            messages?: Array<{
              status: string;
              "error-text"?: string;
              "message-id"?: string;
            }>;
          };

          const first = data.messages?.[0];
          if (!first || first.status !== "0") {
            console.error("Vonage error:", data);
            return Response.json(
              {
                error:
                  first?.["error-text"] ?? "No se pudo enviar el SMS",
                raw: data,
              },
              { status: 502 },
            );
          }

          return Response.json({
            success: true,
            messageId: first["message-id"],
          });
        } catch (err) {
          console.error("SMS send failed:", err);
          return Response.json(
            { error: err instanceof Error ? err.message : "Error desconocido" },
            { status: 500 },
          );
        }
      },
    },
  },
});
