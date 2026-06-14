const RATIO_CLASS: Record<string, string> = {
  "9:16": "aspect-[9/16]",
  "4:5": "aspect-[4/5]",
  "1:1": "aspect-square",
  "1.91:1": "aspect-[191/100]",
};

const STARS = "★★★★★";

/**
 * Arma una vista del anuncio compuesta con los assets del brief: foto del
 * producto de fondo, logo, foto del cliente, titular, oferta, CTA y colores de
 * marca. El layout cambia según el ángulo creativo (directa / urgencia /
 * emocional / prueba social) para que el pack se vea diverso.
 */
export function AdCreativePreview({
  aspectRatio,
  angle,
  headline,
  offer,
  cta,
  brandName,
  primaryColor,
  productPhotoUrl,
  logoUrl,
  founderPhotoUrl,
}: {
  aspectRatio: string;
  angle?: string | null;
  headline: string;
  offer?: string | null;
  cta?: string | null;
  brandName: string;
  primaryColor?: string | null;
  productPhotoUrl?: string | null;
  logoUrl?: string | null;
  founderPhotoUrl?: string | null;
}) {
  const primary = primaryColor || "#166534";
  const ratioClass = RATIO_CLASS[aspectRatio] ?? "aspect-square";
  const a = angle ?? "directa";
  const centered = a === "emocional";

  return (
    <div className={`relative w-full overflow-hidden ${ratioClass}`} style={{ backgroundColor: primary }}>
      {productPhotoUrl ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img src={productPhotoUrl} alt="" className="absolute inset-0 h-full w-full object-cover" />
      ) : null}

      {/* Degradado para legibilidad (centrado para el ángulo emocional) */}
      <div
        className="absolute inset-0"
        style={{
          background: centered
            ? "linear-gradient(to bottom, rgba(0,0,0,0.18), rgba(0,0,0,0.58))"
            : "linear-gradient(to top, rgba(0,0,0,0.78) 0%, rgba(0,0,0,0.22) 46%, rgba(0,0,0,0) 72%)",
        }}
      />

      {/* Banner de urgencia arriba */}
      {a === "urgencia" ? (
        <div className="absolute inset-x-0 top-0 z-10 bg-red-600 px-3 py-1 text-center text-[11px] font-bold uppercase tracking-wide text-white">
          ⏰ {offer || "Oferta por tiempo limitado"}
        </div>
      ) : null}

      {/* Logo arriba a la izquierda (o nombre de marca) */}
      {logoUrl ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img
          src={logoUrl}
          alt=""
          className={`absolute left-2 z-10 h-9 w-9 rounded-md bg-white/85 object-contain p-1 shadow ${a === "urgencia" ? "top-8" : "top-2"}`}
        />
      ) : (
        <span
          className={`absolute left-2 z-10 rounded-md bg-white/85 px-2 py-0.5 text-[10px] font-bold shadow ${a === "urgencia" ? "top-8" : "top-2"}`}
          style={{ color: primary }}
        >
          {brandName}
        </span>
      )}

      {/* Foto del cliente chica (ángulos directa / urgencia) */}
      {founderPhotoUrl && (a === "directa" || a === "urgencia") ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img
          src={founderPhotoUrl}
          alt=""
          className={`absolute right-2 z-10 h-9 w-9 rounded-full object-cover shadow ring-2 ring-white/85 ${a === "urgencia" ? "top-8" : "top-2"}`}
        />
      ) : null}

      {/* Contenido */}
      {centered ? (
        <div className="absolute inset-0 flex flex-col items-center justify-center p-4 text-center text-white">
          {founderPhotoUrl ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={founderPhotoUrl}
              alt=""
              className="mb-2 h-14 w-14 rounded-full object-cover shadow ring-2 ring-white/80"
            />
          ) : null}
          <p className="text-base font-bold leading-snug drop-shadow">{headline}</p>
          {offer ? <p className="mt-1 text-xs font-medium text-white/90 drop-shadow">{offer}</p> : null}
          {cta ? (
            <span
              className="mt-3 inline-block rounded-lg bg-white px-3 py-1 text-[11px] font-bold shadow"
              style={{ color: primary }}
            >
              {cta}
            </span>
          ) : null}
        </div>
      ) : (
        <div className="absolute inset-x-0 bottom-0 p-3 text-white">
          {a === "prueba_social" ? <div className="mb-1 text-sm text-amber-300 drop-shadow">{STARS}</div> : null}
          {a === "prueba_social" && founderPhotoUrl ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={founderPhotoUrl}
              alt=""
              className="mb-2 h-12 w-12 rounded-full object-cover shadow ring-2 ring-white/85"
            />
          ) : null}
          <p className="text-sm font-bold leading-snug drop-shadow">
            {a === "prueba_social" ? `“${headline}”` : headline}
          </p>
          {offer && a !== "urgencia" ? (
            <p className="mt-1 text-[11px] font-medium text-white/90 drop-shadow">{offer}</p>
          ) : null}
          {cta ? (
            <span
              className="mt-2 inline-block rounded-lg bg-white px-3 py-1 text-[11px] font-bold shadow"
              style={{ color: primary }}
            >
              {cta}
            </span>
          ) : null}
        </div>
      )}
    </div>
  );
}
