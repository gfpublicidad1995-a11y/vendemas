import { describe, it, expect } from "vitest";
import { formatCurrency, maskPhone, truncate } from "@/lib/utils";

describe("utils", () => {
  it("maskPhone oculta el número del cliente (privacidad)", () => {
    const masked = maskPhone("+59899123456");
    expect(masked).toContain("•");
    expect(masked).toContain("456"); // solo los últimos 3 dígitos
    expect(masked).not.toContain("99123");
    expect(maskPhone(null)).toBe("—");
  });

  it("formatCurrency devuelve string o — si es null", () => {
    expect(formatCurrency(null)).toBe("—");
    expect(typeof formatCurrency(890)).toBe("string");
  });

  it("truncate corta con elipsis y respeta textos cortos", () => {
    expect(truncate("hola mundo largo", 4)).toMatch(/…$/);
    expect(truncate("hola", 10)).toBe("hola");
  });
});
