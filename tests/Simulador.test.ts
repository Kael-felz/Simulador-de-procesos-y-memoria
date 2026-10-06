import { describe, expect, it } from "vitest";
import { PrimerAjuste } from "../simulador/src/memoria/PrimerAjuste";
import { Simulador } from "../simulador/src/Simulador";

const mapa = (sim: Simulador) => sim.getEstado().mapaMemoria.map((b) => [b.getInicio(), b.getTamano(), b.getPid()]);
const ejecutarTicks = (sim: Simulador, cantidad: number) =>
  Array.from({ length: cantidad }, () => sim.avanzarTick().pidEjecutado);

describe("Simulador - configuración e inicio (RF01)", () => {
  it("usa por defecto 1024 KB, quantum 2 y First-Fit", () => {
    const sim = new Simulador();
    expect(sim.getMetricas().memoriaLibreTotal).toBe(1024);
    sim.registrarProceso(1, 100, 3);
    sim.registrarProceso(2, 100, 3);
    expect(ejecutarTicks(sim, 3)).toEqual([1, 1, 2]);
    expect(mapa(sim)).toEqual([[0, 100, 1], [100, 100, 2], [200, 824, null]]);
  });

  it("rechaza configuraciones inválidas", () => {
    expect(() => new Simulador(0)).toThrow("La memoria total debe ser un entero positivo.");
    expect(() => new Simulador(1024, 0)).toThrow("El quantum debe ser un entero positivo.");
    expect(() => new Simulador(1.5, 2)).toThrow();
  });

  it("arranca en el tick 0 con colas vacías, CPU libre y un único bloque libre", () => {
    const sim = new Simulador(1024, 2);
    expect(sim.getEstado()).toMatchObject({
      tick: 0,
      pidEjecutado: null,
      pidEnCpu: null,
      listos: [],
      esperandoMemoria: [],
      bloqueados: [],
      terminados: [],
    });
    expect(mapa(sim)).toEqual([[0, 1024, null]]);
    expect(sim.getProcesos()).toEqual([]);
  });

  it("arranca con las métricas en cero", () => {
    expect(new Simulador().getMetricas()).toEqual({
      ocupacionMemoria: 0,
      utilizacionCpu: 0,
      cambiosContexto: 0,
      memoriaLibreTotal: 1024,
      mayorBloqueLibre: 1024,
      fragmentacionExterna: 0,
    });
  });
});

describe("Simulador - registro y admisión (RF02, RF03)", () => {
  it("un proceso registrado queda NUEVO y en espera hasta el próximo tick", () => {
    const sim = new Simulador();
    expect(sim.registrarProceso(1, 200, 3).estado).toBe("NUEVO");
    expect(sim.getEstado().esperandoMemoria).toEqual([1]);
  });

  it("rechaza PID repetidos, procesos más grandes que la memoria y datos inválidos", () => {
    const sim = new Simulador();
    sim.registrarProceso(1, 200, 3);
    expect(() => sim.registrarProceso(1, 100, 1)).toThrow("Ya existe un proceso con PID 1.");
    expect(() => sim.registrarProceso(2, 2000, 1)).toThrow("El proceso 2 pide más memoria que la memoria total.");
    expect(() => sim.registrarProceso(3, 100, 0)).toThrow("El tiempo de CPU debe ser un entero positivo.");
    expect(sim.getProcesos().map((p) => p.pid)).toEqual([1]);
  });

  it("las consultas devuelven copias", () => {
    const sim = new Simulador();
    sim.registrarProceso(1, 200, 3);
    sim.getProcesos().pop();
    sim.getEstado().esperandoMemoria.push(9);
    expect(sim.getProcesos()).toHaveLength(1);
    expect(sim.getEstado().esperandoMemoria).toEqual([1]);
  });

  it("al admitir asigna memoria y encola como LISTO", () => {
    const sim = new Simulador();
    sim.registrarProceso(1, 200, 3);
    sim.registrarProceso(2, 100, 3);
    const estado = sim.avanzarTick();
    expect(estado.pidEjecutado).toBe(1);
    expect(estado.listos).toEqual([2]);
    expect(sim.getProceso(2).estado).toBe("LISTO");
  });

  it("si no hay bloque suficiente queda ESPERANDO_MEMORIA sin impedir admitir a los siguientes", () => {
    const sim = new Simulador();
    sim.registrarProceso(1, 800, 3);
    sim.registrarProceso(2, 500, 3);
    sim.registrarProceso(3, 100, 3);
    const estado = sim.avanzarTick();
    expect(sim.getProceso(2).estado).toBe("ESPERANDO_MEMORIA");
    expect(estado.esperandoMemoria).toEqual([2]);
    expect(estado.listos).toEqual([3]);
  });

  it("un proceso terminado no vuelve a las colas", () => {
    const sim = new Simulador();
    sim.registrarProceso(1, 100, 1);
    ejecutarTicks(sim, 4);
    const estado = sim.getEstado();
    expect(estado.terminados).toEqual([1]);
    expect([...estado.listos, ...estado.esperandoMemoria, ...estado.bloqueados]).not.toContain(1);
    expect(sim.getProceso(1).estado).toBe("TERMINADO");
  });
});

describe("Simulador - casos mínimos de la consigna", () => {
  it("Round-Robin con Q=2: P1, P1, P2, P2, P1 y un cambio de contexto", () => {
    const sim = new Simulador(1024, 2);
    sim.registrarProceso(1, 100, 3);
    sim.registrarProceso(2, 100, 2);
    expect(ejecutarTicks(sim, 5)).toEqual([1, 1, 2, 2, 1]);
    expect(sim.getMetricas().cambiosContexto).toBe(1);
    expect(sim.getEstado().terminados).toEqual([2, 1]);
  });

  it("un único proceso renueva el quantum sin cambio de contexto", () => {
    const sim = new Simulador(1024, 2);
    sim.registrarProceso(1, 100, 5);
    expect(ejecutarTicks(sim, 5)).toEqual([1, 1, 1, 1, 1]);
    expect(sim.getMetricas().cambiosContexto).toBe(0);
  });

  it("la memoria liberada al final de un tick se usa para admitir en el siguiente", () => {
    const sim = new Simulador(1000, 2);
    sim.registrarProceso(1, 800, 1);
    sim.registrarProceso(2, 500, 1);
    const tick1 = sim.avanzarTick();
    expect(tick1.terminados).toEqual([1]);
    expect(tick1.esperandoMemoria).toEqual([2]);
    expect(mapa(sim)).toEqual([[0, 1000, null]]);
    const tick2 = sim.avanzarTick();
    expect(tick2.esperandoMemoria).toEqual([]);
    expect(tick2.pidEjecutado).toBe(2);
  });

  it("First-Fit ubica al proceso nuevo en el primer hueco, aunque haya otro más ajustado", () => {
    // Al admitir a P4 hay huecos de 300 KB (en 0) y 200 KB (en 800).
    const sim = new Simulador(1000, 1, new PrimerAjuste());
    sim.registrarProceso(1, 300, 1);
    sim.registrarProceso(2, 100, 9);
    sim.registrarProceso(3, 400, 9);
    sim.avanzarTick();
    sim.registrarProceso(4, 150, 9);
    sim.avanzarTick();
    expect(mapa(sim)).toContainEqual([0, 150, 4]);
  });
});

describe("Simulador - caso de prueba del código de referencia de la cátedra", () => {
  it("con First-Fit y Q=2 reproduce los 12 ticks de la salida de referencia", () => {
    const sim = new Simulador(1024, 2, new PrimerAjuste());
    sim.registrarProceso(1, 200, 4);
    sim.registrarProceso(2, 350, 3);
    sim.registrarProceso(3, 150, 2);
    sim.registrarProceso(4, 400, 3);

    const filas = Array.from({ length: 12 }, () => {
      const estado = sim.avanzarTick();
      const m = sim.getMetricas();
      return [estado.pidEjecutado, 1024 - m.memoriaLibreTotal, m.memoriaLibreTotal, m.mayorBloqueLibre, m.cambiosContexto];
    });

    // [CPU, ocupada, libre total, mayor hueco, cambios de contexto] por tick
    expect(filas).toEqual([
      [1, 700, 324, 324, 0],
      [1, 700, 324, 324, 1],
      [2, 700, 324, 324, 1],
      [2, 700, 324, 324, 2],
      [3, 700, 324, 324, 2],
      [3, 550, 474, 474, 2],
      [1, 950, 74, 74, 2],
      [1, 750, 274, 200, 2],
      [2, 400, 624, 550, 2],
      [4, 400, 624, 550, 2],
      [4, 400, 624, 550, 2],
      [4, 0, 1024, 1024, 2],
    ]);
    expect(sim.getMetricas().utilizacionCpu).toBe(100);
    expect(sim.getEstado().terminados).toEqual([3, 1, 2, 4]);
  });

  it("calcula la fragmentación externa de los ticks 8 y 9 igual que la referencia", () => {
    const sim = new Simulador(1024, 2);
    sim.registrarProceso(1, 200, 4);
    sim.registrarProceso(2, 350, 3);
    sim.registrarProceso(3, 150, 2);
    sim.registrarProceso(4, 400, 3);
    for (let i = 0; i < 8; i++) sim.avanzarTick();
    expect(sim.getMetricas().fragmentacionExterna).toBeCloseTo(27.01);
    sim.avanzarTick();
    expect(sim.getMetricas().fragmentacionExterna).toBeCloseTo(11.86);
  });
});

describe("Simulador - tick determinista (RF06)", () => {
  it("cada llamada avanza exactamente un tick", () => {
    const sim = new Simulador();
    for (let esperado = 1; esperado <= 3; esperado++) {
      expect(sim.avanzarTick().tick).toBe(esperado);
    }
  });

  it("como máximo un proceso consume una unidad de CPU por tick", () => {
    const sim = new Simulador();
    for (const pid of [1, 2, 3]) sim.registrarProceso(pid, 100, 4);
    const cpuRestante = () => sim.getProcesos().reduce((suma, p) => suma + p.cpuRestante, 0);
    for (let i = 0; i < 6; i++) {
      const antes = cpuRestante();
      sim.avanzarTick();
      expect(antes - cpuRestante()).toBe(1);
    }
  });

  it("dos corridas con los mismos datos dan exactamente el mismo resultado", () => {
    const correr = () => {
      const sim = new Simulador(600, 2);
      sim.registrarProceso(1, 300, 4, { disparoTrasCpu: 1, duracion: 2 });
      sim.registrarProceso(2, 300, 3);
      sim.registrarProceso(3, 200, 2);
      const estados = Array.from({ length: 12 }, () => sim.avanzarTick());
      return { estados, metricas: sim.getMetricas() };
    };
    expect(correr()).toEqual(correr());
  });
});

describe("Simulador - entrada y salida (RF08)", () => {
  it("bloquea, conserva la memoria, no consume CPU y vuelve al final de listos", () => {
    const sim = new Simulador(1024, 5);
    sim.registrarProceso(1, 100, 4, { disparoTrasCpu: 1, duracion: 2 });
    sim.registrarProceso(2, 200, 6);

    let estado = sim.avanzarTick();
    expect(estado.pidEjecutado).toBe(1);
    expect(estado.bloqueados).toEqual([1]);
    expect(estado.pidEnCpu).toBeNull();
    expect(estado.mapaMemoria.some((b) => b.getPid() === 1)).toBe(true);
    expect(sim.getMetricas().cambiosContexto).toBe(1);

    estado = sim.avanzarTick();
    expect(estado.pidEjecutado).toBe(2);
    expect(sim.getProceso(1).bloqueoRestante).toBe(1);
    expect(sim.getProceso(1).cpuRestante).toBe(3);

    estado = sim.avanzarTick();
    expect(estado.bloqueados).toEqual([]);
    expect(estado.listos).toEqual([1]);
    expect(estado.pidEjecutado).toBe(2);
  });

  it("al desbloquearse puede ejecutar en ese mismo tick si la CPU está libre", () => {
    const sim = new Simulador(1024, 2);
    sim.registrarProceso(1, 100, 3, { disparoTrasCpu: 1, duracion: 1 });
    expect(sim.avanzarTick().bloqueados).toEqual([1]);
    const estado = sim.avanzarTick();
    expect(estado.pidEjecutado).toBe(1);
    expect(estado.pidEnCpu).toBe(1);
  });

  it("rechaza eventos de E/S inválidos al registrar", () => {
    const sim = new Simulador();
    expect(() => sim.registrarProceso(1, 100, 3, { disparoTrasCpu: 1, duracion: 0 })).toThrow(
      "La duración del evento de E/S debe ser un entero positivo.",
    );
  });
});

describe("Simulador - métricas y estado (RF09, RF10)", () => {
  it("las métricas se recalculan al final de cada tick", () => {
    const sim = new Simulador(1000, 2);
    sim.registrarProceso(1, 250, 2);
    sim.avanzarTick();
    expect(sim.getMetricas().ocupacionMemoria).toBeCloseTo(25);
    expect(sim.getMetricas().utilizacionCpu).toBeCloseTo(100);
    sim.avanzarTick();
    expect(sim.getMetricas().ocupacionMemoria).toBe(0);
    sim.avanzarTick();
    expect(sim.getMetricas().utilizacionCpu).toBeCloseTo(200 / 3);
  });

  it("mantiene los invariantes durante toda una simulación", () => {
    const sim = new Simulador(500, 2);
    sim.registrarProceso(1, 200, 5, { disparoTrasCpu: 2, duracion: 3 });
    sim.registrarProceso(2, 200, 4);
    sim.registrarProceso(3, 200, 3);
    sim.registrarProceso(4, 100, 2, { disparoTrasCpu: 1, duracion: 1 });
    for (let i = 0; i < 20; i++) {
      const estado = sim.avanzarTick();
      const pids = [...estado.listos, ...estado.esperandoMemoria, ...estado.bloqueados, ...estado.terminados];
      if (estado.pidEnCpu !== null) pids.push(estado.pidEnCpu);
      expect(new Set(pids).size).toBe(pids.length);
      expect(estado.mapaMemoria.reduce((suma, b) => suma + b.getTamano(), 0)).toBe(500);
      for (let j = 1; j < estado.mapaMemoria.length; j++) {
        const anterior = estado.mapaMemoria[j - 1];
        expect(anterior.getInicio() + anterior.getTamano()).toBe(estado.mapaMemoria[j].getInicio());
      }
      expect(sim.getProcesos().filter((p) => p.estado === "EJECUTANDO").length).toBeLessThanOrEqual(1);
    }
    expect([...sim.getEstado().terminados].sort()).toEqual([1, 2, 3, 4]);
    expect(mapa(sim)).toEqual([[0, 500, null]]);
  });
});
