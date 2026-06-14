const RATIO_CLASS: Record<string, string> = {
  "9:16": "aspect-[9/16]",
  "4:5": "aspect-[4/5]",
  "1:1": "aspect-square",
  "1.91:1": "aspect-[191/100]",
};

/**
 * Arma una vista del anuncio compuesta con los assets del brief: foto del
 * producto de fondo, logo, foto del cliente, titular, oferta, CTA y colores de
 * marca — adaptado a cada formato de Meta. Es el "mockup" del aviso real.
 */
export function AdCreativePreview({
  aspectRatio,
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

  return (
    <div className={`relative w-full overflow-hidden ${ratioClass}`} style={{ backgroundColor: primary }}>
      {productPhotoUrl ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img src={productPhotoUrl} alt="" className="absolute inset-0 h-full w-full object-cover" />
      ) : null}

      {/* Degradado para legibilidad del texto */}
      <div
        className="absolute inset-0"
        style={{
          background:
            "linear-gradient(to top, rgba(0,0,0,0.76) 0%, rgba(0,0,0,0.25) 42%, rgba(0,0,0,0) 70%)",
        }}
      />

      {/* Logo (o nombre de marca si no hay logo) */}
      {logoUrl ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img
          src={logoUrl}
          alt=""
          className="absolute left-2 top-2 h-9 w-9 rounded-md bg-white/85 object-contain p-1 shadow"
        />
      ) : (
        <span
          className="absolute left-2 top-2 rounded-md bg-white/85 px-2 py-0.5 text-[10px] font-bold shadow"
          style={{ color: primary }}
        >
          {brandName}
        </span>
      )}

      {/* Foto del cliente */}
      {founderPhotoUrl ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img
          src={founderPhotoUrl}
          alt=""
          className="absolute right-2 top-2 h-9 w-9 rounded-full object-cover shadow ring-2 ring-white/85"
        />
      ) : null}

      {/* Copy */}
      <div className="absolute inset-x-0 bottom-0 p-3 text-white">
        <p className="text-sm font-bold leading-snug drop-shadow">{headline}</p>
        {offer ? <p className="mt-1 text-[11px] font-medium text-white/90 drop-shadow">{offer}</p> : null}
        {cta ? (
          <span
            className="mt-2 inline-block rounded-lg bg-white px-3 py-1 text-[11px] font-bold shadow"
            style={{ color: primary }}
          >
            {cta}
          </span>
        ) : null}
      </div>
    </div>
  );
}
