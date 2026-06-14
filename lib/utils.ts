// Helpers puros (sin dependencias de Node) — seguros para cliente y server.

/** Formatea un número como moneda. Por defecto pesos uruguayos. */
export function formatCurrency(
  value: number | null | undefined,
  currency = "UYU",
  locale = "es-UY"
): string {
  if (value === null || value === undefined) return "—";
  try {
    return new Intl.NumberFormat(locale, {
      style: "currency",
      currency,
      maximumFractionDigits: 0,
    }).format(value);
  } catch {
    return `$${value}`;
  }
}

/** Fecha corta legible (es-UY). */
export function formatDate(
  date: Date | string | null | undefined,
  locale = "es-UY"
): string {
  if (!date) return "—";
  const d = typeof date === "string" ? new Date(date) : date;
  if (Number.isNaN(d.getTime())) return "—";
  return new Intl.DateTimeFormat(locale, {
    day: "2-digit",
    month: "short",
    year: "numeric",
  }).format(d);
}

/** Fecha + hora legible (es-UY). */
export function formatDateTime(
  date: Date | string | null | undefined,
  locale = "es-UY"
): string {
  if (!date) return "—";
  const d = typeof date === "string" ? new Date(date) : date;
  if (Number.isNaN(d.getTime())) return "—";
  return new Intl.DateTimeFormat(locale, {
    day: "2-digit",
    month: "short",
    hour: "2-digit",
    minute: "2-digit",
  }).format(d);
}

/** Enmascara un teléfono mostrando solo los últimos dígitos. Privacidad. */
export function maskPhone(phone: string | null | undefined): string {
  if (!phone) return "—";
  const digits = phone.replace(/\D/g, "");
  if (digits.length <= 4) return "•••";
  return `•••• ${digits.slice(-3)}`;
}

/** Parseo seguro de JSON con fallback. */
export function safeJsonParse<T>(value: unknown, fallback: T): T {
  if (value === null || value === undefined) return fallback;
  if (typeof value !== "string") return value as T;
  try {
    return JSON.parse(value) as T;
  } catch {
    return fallback;
  }
}

/** Trunca un texto con elipsis. */
export function truncate(text: string, max = 120): string {
  if (text.length <= max) return text;
  return `${text.slice(0, max).trimEnd()}…`;
}

/** Capitaliza la primera letra. */
export function capitalize(text: string): string {
  return text.charAt(0).toUpperCase() + text.slice(1);
}
