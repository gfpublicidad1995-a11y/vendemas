import { z } from "zod";

/**
 * Configuración tipada del entorno + feature flags.
 *
 * Regla de oro de VendeMás: cada servicio externo (WhatsApp, IA, Meta Ads,
 * Higgsfield, Storage) tiene un proveedor "mock" por defecto. Cambiar un flag
 * acá hace que el selector del servicio use el proveedor real, sin tocar el
 * resto del código.
 */
const flag = z
  .string()
  .optional()
  .transform((v) => v === "true" || v === "1");

const EnvSchema = z.object({
  NODE_ENV: z
    .enum(["development", "test", "production"])
    .default("development"),
  DATABASE_URL: z.string().default("file:./dev.db"),
  // URL pública de la app, usada para armar los links de entrega.
  APP_URL: z.string().default("http://localhost:3000"),

  // Selectores de proveedor (mock por defecto).
  WHATSAPP_PROVIDER: z.enum(["mock", "cloud"]).default("mock"),
  AI_PROVIDER: z.enum(["mock", "anthropic", "gemini"]).default("mock"),
  META_PROVIDER: z.enum(["mock", "real"]).default("mock"),
  STORAGE_PROVIDER: z
    .enum(["local", "s3", "r2", "supabase"])
    .default("local"),

  // Higgsfield MCP (visual). Si está deshabilitado, se usa el mock.
  HIGGSFIELD_MCP_ENABLED: flag,
  HIGGSFIELD_MCP_SERVER_URL: z.string().optional().default(""),
  HIGGSFIELD_MCP_AUTH_MODE: z.string().optional().default(""),
  HIGGSFIELD_WORKSPACE_ID: z.string().optional().default(""),

  // IA real
  ANTHROPIC_API_KEY: z.string().optional().default(""),
  GEMINI_API_KEY: z.string().optional().default(""),
});

export type Env = z.infer<typeof EnvSchema>;

export const env: Env = EnvSchema.parse(process.env);

/** Helpers de conveniencia para leer flags desde los selectores de servicios. */
export const features = {
  useRealWhatsApp: env.WHATSAPP_PROVIDER === "cloud",
  useRealAI: env.AI_PROVIDER === "anthropic",
  useRealMeta: env.META_PROVIDER === "real",
  useHiggsfield: env.HIGGSFIELD_MCP_ENABLED,
};
