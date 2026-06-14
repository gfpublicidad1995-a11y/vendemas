import { createHash, randomBytes } from "node:crypto";

// Helpers que usan node:crypto — solo para código de servidor / seed.
// No importar desde componentes de cliente.

/** Token aleatorio para links de entrega privados. */
export function generateToken(bytes = 16): string {
  return randomBytes(bytes).toString("hex");
}

/**
 * Hash estable de un teléfono de cliente (privacidad).
 * No guardamos el teléfono real del cliente final, solo su hash.
 */
export function hashPhone(phone: string, salt = "vendemas"): string {
  const normalized = phone.replace(/\D/g, "");
  return createHash("sha256")
    .update(`${salt}:${normalized}`)
    .digest("hex")
    .slice(0, 24);
}
