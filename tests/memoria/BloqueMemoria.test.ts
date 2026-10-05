import { describe, expect, it } from "vitest";
import { BloqueMemoria } from "../../simulador/src/memoria/BloqueMemoria";

describe("BloqueMemoria", () => {
  it("guarda inicio, tamaño y dueño", () => {
    const b = new BloqueMemoria(100, 50, 3);
    expect(b.getInicio()).toBe(100);
    expect(b.getTamano()).toBe(50);
    expect(b.getPid()).toBe(3);
    expect(b.estaLibre()).toBe(false);
  });

  it("un bloque sin dueño está libre", () => {
    const b = new BloqueMemoria(0, 10);
    expect(b.getPid()).toBeNull();
    expect(b.estaLibre()).toBe(true);
  });
});
