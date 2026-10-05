import { describe, expect, it } from "vitest";
import { BloqueMemoria } from "../../simulador/src/memoria/BloqueMemoria";
import { PoliticaAsignacion } from "../../simulador/src/memoria/PoliticaAsignacion";
import { PrimerAjuste } from "../../simulador/src/memoria/PrimerAjuste";

// Libres: índice 1 (300 KB en 100), índice 3 (100 KB en 500) e índice 5 (200 KB en 800).
const bloques = [
  new BloqueMemoria(0, 100, 1),
  new BloqueMemoria(100, 300),
  new BloqueMemoria(400, 100, 2),
  new BloqueMemoria(500, 100),
  new BloqueMemoria(600, 200, 3),
  new BloqueMemoria(800, 200),
];

describe("PrimerAjuste (First-Fit)", () => {
  it("es una PoliticaAsignacion", () => {
    expect(new PrimerAjuste()).toBeInstanceOf(PoliticaAsignacion);
  });

  it("elige el primer bloque libre suficiente por dirección", () => {
    expect(new PrimerAjuste().seleccionar(bloques, 100)).toBe(1);
    expect(new PrimerAjuste().seleccionar(bloques, 250)).toBe(1);
  });

  it("saltea los bloques ocupados y los libres que no alcanzan", () => {
    const otros = [new BloqueMemoria(0, 50), new BloqueMemoria(50, 300, 1), new BloqueMemoria(350, 150)];
    expect(new PrimerAjuste().seleccionar(otros, 100)).toBe(2);
  });

  it("devuelve null si ningún bloque alcanza", () => {
    expect(new PrimerAjuste().seleccionar(bloques, 400)).toBeNull();
  });
});
