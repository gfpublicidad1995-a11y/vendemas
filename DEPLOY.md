# Deploy de VendeMás — link permanente + auto-deploy

Objetivo: dejar VendeMás online con una **URL fija**. Cada `git push` actualiza el sitio
automáticamente, así tu socio siempre ve la última versión.

Stack: **Vercel** (hosting, gratis) + **Turso** (base SQLite serverless, gratis).
El código ya está preparado — no hay que cambiar nada.

> Tu desarrollo local sigue igual (SQLite en `dev.db`, sin configurar nada). El adapter
> de base se elige solo según `DATABASE_URL` (ver `lib/dbAdapter.ts`).

## 0. Cuentas (gratis, las creás vos)
- GitHub · Vercel · Turso (turso.tech)

## 1. Subir el código a GitHub
En la carpeta del proyecto:
```bash
git add -A
git commit -m "VendeMas MVP"
# Crear el repo y subirlo (con GitHub CLI):
gh repo create vendemas --private --source=. --push
# o creá el repo en github.com y luego: git remote add origin <url> && git push -u origin main
```

## 2. Crear la base en Turso con tus datos ya cargados
Instalá el CLI de Turso y logueate. Después:
```bash
turso db create vendemas --from-file dev.db   # importa tu base local (schema + datos demo)
turso db show vendemas --url                   # copiá la URL: libsql://...
turso db tokens create vendemas                # copiá el token
```
`--from-file dev.db` sube tu base ya sembrada, así no hace falta migrar ni seedear en la nube.

## 3. Deploy en Vercel
1. vercel.com → **Add New → Project** → importá el repo `vendemas`.
2. Framework: **Next.js** (se detecta solo). No cambies build settings.
3. **Environment Variables**:
   | Nombre | Valor |
   |---|---|
   | `DATABASE_URL` | la URL `libsql://...` de Turso |
   | `DATABASE_AUTH_TOKEN` | el token de Turso |
   | `APP_URL` | la URL de Vercel (ej. `https://vendemas.vercel.app`) — podés completarla tras el 1er deploy |
4. **Deploy**.

Listo: compartí la URL de Vercel con tu socio. Cada `git push` redeploya solo.

## Actualizar
- **Código:** `git push` → Vercel redeploya automáticamente.
- **Datos demo en producción:** volvé a importar (`turso db create vendemas --from-file dev.db`
  borrando la anterior), o seteá `DATABASE_URL`/`DATABASE_AUTH_TOKEN` en tu `.env` local y
  corré `npm run seed` apuntando a Turso.

## Conectar las APIs reales (más adelante)
Los proveedores externos se activan por Environment Variables en Vercel (sin tocar código):
`WHATSAPP_PROVIDER`, `AI_PROVIDER` + `ANTHROPIC_API_KEY`, `META_PROVIDER`,
`STORAGE_PROVIDER`, `HIGGSFIELD_MCP_ENABLED` + `HIGGSFIELD_MCP_SERVER_URL` / `HIGGSFIELD_WORKSPACE_ID`.
