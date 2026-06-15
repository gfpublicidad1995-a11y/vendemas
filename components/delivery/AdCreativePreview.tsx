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
 * emocional / prueba social) para que el pack se vea diverso y profesional.
 *
 * En formato landscape (1.91:1) hay poco alto, así que mostramos una versión
 * compacta (menos texto, sin elementos secundarios) para que nada se recorte.
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
  const compact = aspectRatio === "1.91:1"; // landscape: poco alto → versión reducida
  const centered = a === "emocional" && !compact;

  const logo = logoUrl ? (
    // eslint-disable-next-line @next/next/no-img-element
    <img src={logoUrl} alt="" className="h-8 w-8 rounded-lg bg-white/90 object-contain p-1 shadow-sm ring-1 ring-black/5" />
  ) : (
    <span
      className="rounded-lg bg-white/90 px-2 py-1 text-[10px] font-extrabold uppercase tracking-wide shadow-sm"
      style={{ color: primary }}
    >
      {brandName}
    </span>
  );

  const ctaPill = cta ? (
    <span
      className={`inline-flex items-center gap-1 rounded-full font-bold text-white shadow-md ${
        compact ? "px-2.5 py-1 text-[10px]" : "px-3 py-1.5 text-[11px]"
      }`}
      style={{ backgroundColor: primary }}
    >
      {cta}
      <span aria-hidden>→</span>
    </span>
  ) : null;

  const offerChip = offer ? (
    <span
      className={`inline-block rounded-md bg-white/95 font-extrabold shadow-sm ${
        compact ? "px-1.5 py-0.5 text-[10px]" : "px-2 py-0.5 text-xs"
      }`}
      style={{ color: primary }}
    >
      {offer}
    </span>
  ) : null;

  const headlineSize = compact ? "text-xs" : "text-sm";

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
            ? "linear-gradient(to bottom, rgba(0,0,0,0.20), rgba(0,0,0,0.62))"
            : "linear-gradient(to top, rgba(0,0,0,0.82) 0%, rgba(0,0,0,0.28) 48%, rgba(0,0,0,0) 74%)",
        }}
      />

      {/* Banner de urgencia arriba */}
      {a === "urgencia" ? (
        <div className="absolute inset-x-0 top-0 z-10 flex items-center justify-center gap-1 bg-red-600 px-3 py-1 text-center text-[11px] font-extrabold uppercase tracking-wide text-white shadow">
          <span aria-hidden>⏰</span> {offer || "Oferta por tiempo limitado"}
        </div>
      ) : null}

      {/* Cabecera: logo (izq) + foto del cliente (der, en directa/urgencia, no compacto) */}
      <div className={`absolute inset-x-0 z-10 flex items-start justify-between px-2 ${a === "urgencia" ? "top-9" : "top-2"}`}>
        {logo}
        {founderPhotoUrl && !compact && (a === "directa" || a === "urgencia") ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={founderPhotoUrl}
            alt=""
            className="h-9 w-9 rounded-full object-cover shadow ring-2 ring-white/85"
          />
        ) : null}
      </div>

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
          ) : (
            <span className="mb-1 text-lg" aria-hidden>💚</span>
          )}
          <p className="text-base font-extrabold leading-snug drop-shadow">{headline}</p>
          {offer ? <p className="mt-1 text-xs font-medium text-white/90 drop-shadow">{offer}</p> : null}
          {ctaPill ? <div className="mt-3">{ctaPill}</div> : null}
        </div>
      ) : (
        <div className={`absolute inset-x-0 bottom-0 text-white ${compact ? "p-2" : "p-3"}`}>
          {a === "prueba_social" && !compact ? (
            <div className="mb-1 flex items-center gap-1.5">
              <span className="text-sm leading-none text-amber-300 drop-shadow">{STARS}</span>
              <span className="text-[10px] font-semibold text-white/85">+120 personas ya lo eligen</span>
            </div>
          ) : null}
          <p className={`font-extrabold leading-tight drop-shadow ${headlineSize} ${compact ? "line-clamp-1" : ""}`}>
            {a === "prueba_social" && !compact ? `“${headline}”` : headline}
          </p>
          {!compact && a === "prueba_social" && founderPhotoUrl ? (
            <div className="mt-1.5 flex items-center gap-1.5">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={founderPhotoUrl} alt="" className="h-6 w-6 rounded-full object-cover ring-1 ring-white/70" />
              <span className="text-[10px] font-medium text-white/85">Cliente verificado</span>
            </div>
          ) : null}
          {(offer && a !== "urgencia" && !compact) || ctaPill ? (
            <div className={`flex flex-wrap items-center gap-2 ${compact ? "mt-1.5" : "mt-2"}`}>
              {!compact && a !== "urgencia" ? offerChip : null}
              {ctaPill}
            </div>
          ) : null}
        </div>
      )}
    </div>
  );
}
