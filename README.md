# VendeMás

**Tu agencia de contenido y anuncios por WhatsApp.**

> Vos atendé tu negocio. Nosotros creamos el contenido, los anuncios y las ideas para vender más.

VendeMás es una plataforma para emprendedores y negocios chicos que no tienen tiempo
ni equipo para crear contenido, diseñar anuncios o configurar campañas en Meta Ads.
El emprendedor escribe por WhatsApp y recibe contenido, anuncios, carruseles, guiones,
campañas en borrador, piezas visuales por ubicación e "ideas para mañana".

Este repo es el **MVP interno**: panel de control + simulador de WhatsApp + servicios
mockeados, con la arquitectura lista para conectar las APIs reales más adelante.

---

## Stack

- **Next.js 16** (App Router) + **React 19**
- **TypeScript** estricto
- **Prisma 7** + **SQLite** (dev) — portable a **PostgreSQL** (prod)
- **Tailwind CSS v4**
- **Zod 4** (validación y fuente de verdad de los enums)

## Requisitos

- Node 20+ (probado con Node 24)
- No necesitás Docker ni PostgreSQL: en desarrollo se usa SQLite.

## Puesta en marcha

```bash
npm install
cp .env.example .env          # en Windows: copy .env.example .env
npx prisma migrate dev        # crea la base SQLite + el cliente
npm run seed                  # carga el negocio de ejemplo y datos simulados
npm run dev                   # http://localhost:3000
```

> **Nota Prisma 7**: el cliente se genera en `lib/generated/prisma` y el runtime usa
> un *driver adapter* (`@prisma/adapter-better-sqlite3`, ver `lib/prisma.ts`). El `url`
> de la base vive en `prisma.config.ts`, no en el schema.

> **Nota Next 16**: en páginas y route handlers, `params`/`searchParams` son `Promise`
> (hay que `await`).

### Scripts

| Script | Qué hace |
|---|---|
| `npm run dev` | Servidor de desarrollo |
| `npm run build` / `start` | Build y producción |
| `npm run seed` | Siembra datos de ejemplo |
| `npm run db:migrate` | `prisma migrate dev` |
| `npm run db:studio` | Prisma Studio |
| `npm run db:reset` | Resetea la base |
| `npm test` | Tests unitarios (Vitest) |

## Qué podés probar

- **Landing** pública en `/` con la propuesta del producto (CTA al panel y al simulador).

1. **Dashboard** (`/dashboard`) con métricas reales del seed.
2. **Simulador de WhatsApp** (`/dashboard/simulator`): alta de negocio, **Campaña Rápida**,
   entrega y aprobación — todo por chat.
3. **Nuevo pedido** (`/dashboard/orders/new`): genera 10 piezas + visuales 4:5 / 1:1 / 9:16
   validados + campaña en borrador + link de entrega.
4. **Página de entrega** (`/delivery/[token]`): piezas, copies copiables, visuales por
   ubicación con medidas y validación, botones de aprobar / pedir cambios.
5. **Specs de Meta Ads** (`/dashboard/creative-specs`), **Visuales**, **Insights**,
   **Ideas para mañana**, **Oportunidades**, **Calendario**, **Reporte semanal**,
   **Planificador de pauta**.

## Arquitectura

```
app/                 # rutas (dashboard, delivery, api), server actions
components/           # UI, dashboard, simulador, entrega
lib/                  # prisma, config/env (Zod), validators/enums, utils
services/             # lógica de negocio + integraciones detrás de interfaces
  ai/                 # IA de contenido (mock | anthropic)
  visual/             # motor visual (MockVisual | Higgsfield) + prompts + calidad
  meta/               # Meta Ads (borradores)
  meta-creative-specs/# specs por ubicación + validación creativa
  whatsapp/           # envío + flujo conversacional (máquina de estados)
  storage/            # storage abstracto (local | s3 | r2 | supabase)
  content/            # ContentGenerationService + QuickCampaignService
  conversations/      # Conversation Intelligence (reglas)
  digests/            # Daily Digest "Ideas para mañana"
  jobs/               # cola de jobs (in-process → BullMQ)
prisma/               # schema + seed
```

### Patrón mock ↔ real

Cada servicio externo tiene una **interface** y un **selector** (`index.ts`) que elige
el proveedor según una variable de entorno. Hoy los proveedores reales son *stubs* o
caen al mock; conectarlos es implementar la misma interface y prender un flag — no se
toca el resto del código. Ver `lib/config/env.ts`.

| Servicio | Flag | Default | Real (a futuro) |
|---|---|---|---|
| WhatsApp | `WHATSAPP_PROVIDER` | `mock` | WhatsApp Cloud API |
| IA | `AI_PROVIDER` | `mock` | Anthropic |
| Meta Ads | `META_PROVIDER` | `mock` | Meta Marketing API |
| Storage | `STORAGE_PROVIDER` | `local` | S3 / R2 / Supabase |
| Visual | `HIGGSFIELD_MCP_ENABLED` | `false` | Higgsfield MCP |

### Higgsfield MCP (motor visual)

La parte visual está **preparada** para Higgsfield MCP (`services/visual/higgsfield.ts`).
Con `HIGGSFIELD_MCP_ENABLED=false` se usa `MockVisualGenerationService` (prompts +
placeholders), así el MVP nunca se bloquea. Al implementar la invocación del MCP y poner
el flag en `true`, el selector usa el proveedor real. Credenciales por entorno, sin
hardcodear (`HIGGSFIELD_MCP_SERVER_URL`, `HIGGSFIELD_WORKSPACE_ID`, …).

### Meta Ads — medidas y validación profesional

`services/meta-creative-specs` guarda las specs por ubicación (Feed, Stories, Reels,
Marketplace, etc.) en la base (`MetaCreativeSpec`) para actualizarlas fácil cuando Meta
cambie sus recomendaciones. VendeMás genera **una pieza por ubicación** (4:5 / 1:1 / 9:16),
aplica zonas seguras y valida medidas, ratio y zona segura, marcando cada creativo como
**listo / revisar / no recomendado**.

## Reglas de seguridad (importantes)

- **Nunca** se publica una campaña ni se gasta presupuesto sin **aprobación explícita**
  del usuario. Las campañas nacen en `draft` / `paused` y queda registro de aprobación.
- El usuario aprueba o pide cambios por WhatsApp / en la página de entrega.

## Privacidad y consentimiento

- No se muestran teléfonos completos de clientes; se guarda `customerPhoneHash`.
- Se anonimizan nombres y no se usan datos personales para generar anuncios.
- No se usan assets de un negocio para otro negocio.
- Hay consentimientos por negocio para **analizar conversaciones** y para **enviar el
  reporte diario**; sin consentimiento, no se analiza ni se envía.

> *Este módulo analiza conversaciones comerciales del negocio para detectar dudas
> frecuentes, objeciones e ideas de contenido. No debe utilizarse para recolectar datos
> sensibles de clientes ni para generar anuncios basados en información personal. El
> negocio es responsable de informar y cumplir las normas aplicables de privacidad.*

## Endpoints

- `POST /api/webhooks/whatsapp` — recibe un mensaje y responde (mock; `GET` verifica).
- `POST /api/jobs/daily-digest/run` — corre el digest diario (respeta consentimientos).
  Body opcional: `{ "businessProfileId": "...", "date": "2026-06-13" }`.

## Deploy y cómo compartirlo

La app está lista para producción: `npm run build` y luego `npm start`.

### Link temporal (desde tu máquina, gratis)
En dos terminales, dentro de la carpeta del proyecto:

```bash
npm run dev
# en otra terminal (PowerShell):
.\cloudflared.exe tunnel --url http://localhost:3000
```

Cloudflare devuelve una URL `https://…trycloudflare.com` para mandarle a quien quieras.
Funciona mientras tu compu esté prendida con ambos comandos corriendo. (`cloudflared.exe`
ya está en la carpeta.)

### Link permanente (deploy)
- **Opción A — mantener SQLite:** deploy en un host con disco persistente (Railway, Render,
  Fly.io) o un VPS. Build `npm run build`, start `npm start`; correr una vez
  `npx prisma migrate deploy` y `npm run seed`. Guardar `dev.db` en un volumen persistente.
- **Opción B — Vercel / serverless:** cambiar a PostgreSQL (Neon/Supabase). El schema es
  portable (enums como String + Zod): cambiar el `provider` del datasource a `postgresql`,
  usar el adapter `@prisma/adapter-pg`, setear `DATABASE_URL`, y correr `prisma migrate deploy`
  + `npm run seed`.

## Estado del MVP

**Hecho (mockeado y funcional):** modelos + seed, dashboard completo, simulador de
WhatsApp, Campaña Rápida, generación de contenido + visuales por ubicación + validación,
link de entrega, Conversation Intelligence (reglas), Daily Digest, aprobación y **flujo de
cambios** (reescribe los copies). Además, todos los **generadores** cableados a botones:
Radar de oportunidades, Respuestas sugeridas, Calendario semanal, Reporte semanal,
Planificador de pauta, Ofertas inteligentes, Biblioteca por rubro, Score de contenido,
Brand Kit y Modo voz (audio → campaña). El **panel “Acciones de VendeMás”** en el detalle
del negocio (`/dashboard/businesses/[id]`) dispara todo.

Además: módulo de **Estrategia** (`/dashboard/strategy`) con ADN de marca, avatar (16 deseos
de Reiss), las **7 maletas de cualquier compra**, mapa de **niveles de consciencia**, guía de
guiones, **diversificación creativa** (deseo × nivel → hooks para reel/imagen), **calculadora
de presupuesto** (número mágico + semáforo + ROAS) y **estructura de campañas** (Presentación,
Evaluación, Conversión, Ascensión) — basado en las metodologías de Felipe Vergara, nativo en
VendeMás. Los anuncios se generan en **4 formatos**: 4:5, 1:1, 9:16 y **1.91:1**. Las piezas
visuales del demo son **imágenes reales** generadas con Higgsfield. La generación es
**diversificada**: cada campaña produce anuncios con 4 ángulos (directa, emocional, urgencia,
prueba social) y cada formato visual recibe un ángulo distinto, alimentado por los hooks de
la estrategia del negocio.

**Listo para conectar:** WhatsApp Cloud API, IA real (Anthropic), Meta Marketing API,
Higgsfield MCP, storage real y jobs con Redis/BullMQ.
