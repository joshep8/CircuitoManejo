/**
 * Genera el correo institucional a partir del nombre y los 2 primeros dígitos del DNI.
 * Ej: nombres="Joshep Ruben", dni="71885432" -> "joshepruben71@drivepro.pe"
 */
export function buildInstitutionalEmail(nombres: string, dni: string): string {
  const slug = nombres
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "") // quitar tildes
    .replace(/[^a-z]/g, ""); // solo letras
  const prefijo = (dni || "").replace(/\D/g, "").slice(0, 2);
  return `${slug}${prefijo}@drivepro.pe`;
}

/**
 * La contraseña institucional es el DNI completo.
 */
export function buildInstitutionalPassword(dni: string): string {
  return (dni || "").replace(/\D/g, "");
}
