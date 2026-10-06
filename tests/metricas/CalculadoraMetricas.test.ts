import { describe, expect, it } from "vitest";
import { GestorMemoria } from "../../simulador/src/memoria/GestorMemoria";
import { PrimerAjuste } from "../../simulador/src/memoria/PrimerAjuste";
import { CalculadoraMetricas } from "../../simulador/src/metricas/CalculadoraMetricas";

describe("CalculadoraMetricas", () => {
  it("con huecos de 100 y 300 KB: libre 400, mayor 300 y fragmentación 25 %", () => {
    const g = new GestorMemoria(1000, new PrimerAjuste());
    g.asignar(1, 100);
    g.asignar(2, 100);
    g.asignar(3, 300);
    g.asignar(4, 300);
    g.asignar(5, 200);
    g.liberar(2);
    g.liberar(4);
    const m = new CalculadoraMetricas().calcular(1, g, 0);
    expect(m.memoriaLibreTotal).toBe(400);
    expect(m.mayorBloqueLibre).toBe(300);
    expect(m.fragmentacionExterna).toBeCloseTo(25);
    expect(m.ocupacionMemoria).toBeCloseTo(60);
  });

  it("con la memoria llena: ocupación 100 %, mayor bloque 0 y fragmentación 0 %", () => {
    const g = new GestorMemoria(500, new PrimerAjuste());
    g.asignar(1, 500);
    const m = new CalculadoraMetricas().calcular(3, g, 2);
    expect(m.ocupacionMemoria).toBe(100);
    expect(m.memoriaLibreTotal).toBe(0);
    expect(m.mayorBloqueLibre).toBe(0);
    expect(m.fragmentacionExterna).toBe(0);
    expect(m.cambiosContexto).toBe(2);
  });

  it("la utilización de CPU es 0 en el tick 0 y luego ticks ocupados / ticks transcurridos", () => {
    const c = new CalculadoraMetricas();
    const g = new GestorMemoria(100, new PrimerAjuste());
    expect(c.calcular(0, g, 0).utilizacionCpu).toBe(0);
    c.registrarTick(true);
    c.registrarTick(false);
    c.registrarTick(true);
    c.registrarTick(true);
    expect(c.calcular(4, g, 0).utilizacionCpu).toBeCloseTo(75);
  });
});
