// Helper cliente para llamar al endpoint de SMS
export async function sendSms(to: string, message: string): Promise<boolean> {
  try {
    const res = await fetch("/api/sms/send", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ to, message }),
    });
    return res.ok;
  } catch (err) {
    console.error("sendSms error:", err);
    return false;
  }
}

/**
 * Normaliza un número peruano a formato internacional sin "+":
 * - 9 dígitos que empiezan con 9 -> 51XXXXXXXXX
 * - Ya tiene 51 al inicio -> tal cual
 * - Ya viene con + -> quita el +
 */
export function normalizePeruPhone(raw: string): string {
  const digits = raw.replace(/\D/g, "");
  if (digits.startsWith("51") && digits.length >= 11) return digits;
  if (digits.length === 9 && digits.startsWith("9")) return `51${digits}`;
  return digits;
}
