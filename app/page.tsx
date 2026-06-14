import Link from "next/link";

function Logo() {
  return (
    <div className="flex items-center gap-2">
      <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-emerald-600 text-lg font-bold text-white">
        V
      </div>
      <span className="text-lg font-semibold text-stone-900">VendeMás</span>
    </div>
  );
}

const ENTREGABLES = [
  { emoji: "✍️", title: "Contenido y copies", desc: "Posteos, captions y textos con el tono de tu marca." },
  { emoji: "📣", title: "Anuncios para Meta", desc: "Textos, titulares y estructura de campaña listos." },
  { emoji: "🎠", title: "Carruseles y guiones", desc: "Carruseles armados y guiones de reel paso a paso." },
  { emoji: "🖼️", title: "Visuales por ubicación", desc: "Piezas en 4:5, 1:1 y 9:16 con medidas y zonas seguras." },
  { emoji: "🌅", title: "Ideas para mañana", desc: "Cada día, ideas a partir de lo que preguntan tus clientes." },
  { emoji: "💬", title: "Respuestas sugeridas", desc: "Respuestas listas para tus consultas más comunes." },
];

const PASOS = [
  { n: "1", title: "Escribís por WhatsApp", desc: "Mandás una foto, una promo o una frase como “quiero vender más esta semana”." },
  { n: "2", title: "Te armamos todo", desc: "Contenido, anuncios y visuales adaptados a cada ubicación de Meta Ads." },
  { n: "3", title: "Aprobás y a vender", desc: "Mirás la entrega, aprobás o pedís cambios. Vos tenés la última palabra." },
];

export default function LandingPage() {
  return (
    <div className="bg-[#f7f7f5] text-stone-800">
      {/* Nav */}
      <header className="mx-auto flex max-w-6xl items-center justify-between px-6 py-5">
        <Logo />
        <Link
          href="/dashboard"
          className="rounded-xl bg-emerald-600 px-4 py-2 text-sm font-medium text-white transition hover:bg-emerald-700"
        >
          Entrar al panel
        </Link>
      </header>

      {/* Hero */}
      <section className="mx-auto grid max-w-6xl items-center gap-10 px-6 pb-12 pt-8 lg:grid-cols-2 lg:pb-20 lg:pt-12">
        <div>
          <span className="inline-block rounded-full bg-emerald-100 px-3 py-1 text-xs font-medium text-emerald-700">
            Tu agencia, dentro de WhatsApp
          </span>
          <h1 className="mt-4 text-4xl font-bold leading-tight tracking-tight text-stone-900 sm:text-5xl">
            Tu agencia de contenido y anuncios por WhatsApp
          </h1>
          <p className="mt-4 max-w-xl text-lg text-stone-600">
            Vos atendé tu negocio. Nosotros creamos el contenido, los anuncios y las ideas para
            vender más.
          </p>
          <div className="mt-7 flex flex-wrap gap-3">
            <Link
              href="/dashboard"
              className="rounded-xl bg-emerald-600 px-5 py-3 text-sm font-semibold text-white transition hover:bg-emerald-700"
            >
              Ver el panel
            </Link>
            <Link
              href="/dashboard/simulator"
              className="rounded-xl border border-stone-300 bg-white px-5 py-3 text-sm font-semibold text-stone-700 transition hover:bg-stone-100"
            >
              Probar el simulador
            </Link>
          </div>
          <p className="mt-5 text-sm text-stone-500">
            Tus clientes preguntan. VendeMás convierte esas consultas en contenido y anuncios.
          </p>
        </div>

        {/* Mock de chat */}
        <div className="mx-auto w-full max-w-sm">
          <div className="overflow-hidden rounded-3xl border border-stone-200 bg-white shadow-xl">
            <div className="flex items-center gap-2 bg-emerald-600 px-4 py-3 text-white">
              <div className="flex h-8 w-8 items-center justify-center rounded-full bg-white/20 text-sm font-bold">V</div>
              <div className="text-sm font-semibold">VendeMás</div>
            </div>
            <div className="space-y-2 bg-[#efeae2] p-4 text-sm">
              <div className="ml-auto w-fit max-w-[80%] rounded-2xl bg-[#d9fdd3] px-3 py-2">
                Quiero vender más esta semana ⚡
              </div>
              <div className="w-fit max-w-[85%] rounded-2xl bg-white px-3 py-2">
                ¡Vamos! ¿Qué producto querés promocionar?
              </div>
              <div className="ml-auto w-fit max-w-[80%] rounded-2xl bg-[#d9fdd3] px-3 py-2">
                Sanitaria 25L, $890 con envío
              </div>
              <div className="w-fit max-w-[90%] rounded-2xl bg-white px-3 py-2">
                Listo 🙌 Te armé historias, carrusel, anuncios y los visuales en 4:5, 1:1 y 9:16.
                <span className="mt-2 block rounded-lg bg-emerald-600 px-3 py-1.5 text-center text-xs font-medium text-white">
                  📦 Abrir entrega
                </span>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Cómo funciona */}
      <section className="border-y border-stone-200 bg-white py-16">
        <div className="mx-auto max-w-6xl px-6">
          <h2 className="text-center text-2xl font-semibold text-stone-900">Cómo funciona</h2>
          <div className="mt-10 grid gap-6 sm:grid-cols-3">
            {PASOS.map((p) => (
              <div key={p.n} className="rounded-2xl border border-stone-200 p-6">
                <div className="flex h-10 w-10 items-center justify-center rounded-full bg-emerald-100 text-lg font-bold text-emerald-700">
                  {p.n}
                </div>
                <h3 className="mt-4 font-semibold text-stone-900">{p.title}</h3>
                <p className="mt-1 text-sm text-stone-600">{p.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Entregables */}
      <section className="py-16">
        <div className="mx-auto max-w-6xl px-6">
          <h2 className="text-center text-2xl font-semibold text-stone-900">Qué te entregamos</h2>
          <p className="mx-auto mt-2 max-w-2xl text-center text-sm text-stone-500">
            Todo listo para usar y aprobar. Sin apps complicadas, sin aprender Meta Ads.
          </p>
          <div className="mt-10 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {ENTREGABLES.map((e) => (
              <div key={e.title} className="rounded-2xl border border-stone-200 bg-white p-5">
                <div className="text-2xl">{e.emoji}</div>
                <h3 className="mt-3 font-semibold text-stone-900">{e.title}</h3>
                <p className="mt-1 text-sm text-stone-600">{e.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Confianza */}
      <section className="border-t border-stone-200 bg-emerald-600 py-14 text-white">
        <div className="mx-auto max-w-3xl px-6 text-center">
          <h2 className="text-2xl font-semibold">Vos aprobás antes de publicar</h2>
          <p className="mt-3 text-emerald-50">
            No gastamos plata en pauta sin tu permiso. Las campañas quedan en borrador hasta que
            vos digas que sí.
          </p>
          <Link
            href="/dashboard"
            className="mt-7 inline-block rounded-xl bg-white px-6 py-3 text-sm font-semibold text-emerald-700 transition hover:bg-emerald-50"
          >
            Empezar ahora
          </Link>
        </div>
      </section>

      <footer className="mx-auto flex max-w-6xl flex-col items-center justify-between gap-3 px-6 py-8 text-sm text-stone-400 sm:flex-row">
        <Logo />
        <span>Vos atendé tu negocio. Nosotros, lo demás.</span>
      </footer>
    </div>
  );
}
