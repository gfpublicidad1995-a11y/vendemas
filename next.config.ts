import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // better-sqlite3 es un módulo nativo (.node) y no puede bundlearse.
  // Lo externalizamos junto al cliente Prisma para el runtime del servidor.
  serverExternalPackages: [
    "@prisma/client",
    "@prisma/adapter-better-sqlite3",
    "better-sqlite3",
  ],
  experimental: {
    // El brief de marca sube fotos (producto, logo, dueño) por Server Action.
    // El default es 1MB; lo subimos para permitir imágenes.
    serverActions: {
      bodySizeLimit: "12mb",
    },
  },
};

export default nextConfig;
