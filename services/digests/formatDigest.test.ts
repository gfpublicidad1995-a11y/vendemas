import { describe, it, expect } from "vitest";
import { formatDigestForWhatsApp } from "@/services/digests/formatDigest";

describe("formatDigestForWhatsApp", () => {
  it("arma el mensaje con preguntas, ideas, recomendación y opciones", () => {
    const msg = formatDigestForWhatsApp({
      date: new Date("2026-06-13"),
      topQuestions: ["Precio", "Envíos"],
      topObjections: ["Caro"],
      contentIdeas: ["Carrusel de dudas"],
      campaignIdeas: ["Anuncio a Mensajes"],
      recommendedAction: "Publicá una historia de envíos.",
    });
    expect(msg).toContain("Precio");
    expect(msg).toContain("Carrusel de dudas");
    expect(msg).toContain("Publicá una historia de envíos.");
    expect(msg).toContain("1 - Crear carrusel");
    expect(msg).toContain("4 - Crear todo");
  });
});
