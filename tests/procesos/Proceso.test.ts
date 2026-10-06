import { describe, expect, it } from "vitest";
import { Proceso } from "../../simulador/src/procesos/Proceso";

const listo = (cpu = 5) => {
  const p = new Proceso(1, 100, cpu);
  p.admitir();
  return p;
};

describe("Proceso", () => {
  it("se crea en estado NUEVO con sus contadores inicializados", () => {
    const p = new Proceso(1, 100, 5);
    expect(p.getPid()).toBe(1);
    expect(p.getMemoria()).toBe(100);
    expect(p.getCpuRestante()).toBe(5);
    expect(p.getEstado()).toBe("NUEVO");
    expect(p.getQuantumConsumido()).toBe(0);
  });

  it("rechaza PID, memoria o CPU que no sean enteros positivos", () => {
    expect(() => new Proceso(0, 100, 5)).toThrow("El PID debe ser un entero positivo.");
    expect(() => new Proceso(-1, 100, 5)).toThrow("El PID debe ser un entero positivo.");
    expect(() => new Proceso(1, 0, 5)).toThrow("La memoria debe ser un entero positivo.");
    expect(() => new Proceso(1, 100, 0)).toThrow("El tiempo de CPU debe ser un entero positivo.");
    expect(() => new Proceso(1, 100, 2.5)).toThrow("El tiempo de CPU debe ser un entero positivo.");
  });

  it("recorre el ciclo de vida completo", () => {
    const p = new Proceso(1, 100, 1);
    p.esperarMemoria();
    expect(p.getEstado()).toBe("ESPERANDO_MEMORIA");
    p.esperarMemoria();
    expect(p.getEstado()).toBe("ESPERANDO_MEMORIA");
    p.admitir();
    expect(p.getEstado()).toBe("LISTO");
    p.despachar();
    expect(p.getEstado()).toBe("EJECUTANDO");
    p.ejecutarUnidad();
    expect(p.getCpuRestante()).toBe(0);
    expect(p.getQuantumConsumido()).toBe(1);
    p.terminar();
    expect(p.getEstado()).toBe("TERMINADO");
  });

  it("despachar reinicia el quantum consumido", () => {
    const p = listo();
    p.despachar();
    p.ejecutarUnidad();
    p.expulsar();
    expect(p.getQuantumConsumido()).toBe(1);
    p.despachar();
    expect(p.getQuantumConsumido()).toBe(0);
  });

  it("renovar el quantum no cambia el estado", () => {
    const p = listo();
    p.despachar();
    p.ejecutarUnidad();
    p.ejecutarUnidad();
    p.renovarQuantum();
    expect(p.getQuantumConsumido()).toBe(0);
    expect(p.getEstado()).toBe("EJECUTANDO");
  });

  it("rechaza transiciones inválidas", () => {
    const p = new Proceso(1, 100, 2);
    expect(() => p.despachar()).toThrow("Transición inválida del proceso 1: NUEVO -> EJECUTANDO.");
  });

  it("un proceso TERMINADO no vuelve a ningún otro estado", () => {
    const p = listo(1);
    p.despachar();
    p.ejecutarUnidad();
    p.terminar();
    expect(() => p.admitir()).toThrow();
    expect(() => p.despachar()).toThrow();
    expect(() => p.expulsar()).toThrow();
    expect(() => p.esperarMemoria()).toThrow();
  });

  it("getDatos devuelve una copia que no modifica al proceso", () => {
    const p = new Proceso(7, 64, 3);
    const datos = p.getDatos();
    expect(datos).toEqual({
      pid: 7, memoria: 64, cpuTotal: 3, cpuRestante: 3, estado: "NUEVO", quantumConsumido: 0, bloqueoRestante: 0,
    });
    (datos as { cpuRestante: number }).cpuRestante = 0;
    expect(p.getCpuRestante()).toBe(3);
    p.admitir();
    expect(datos.estado).toBe("NUEVO");
  });
});

describe("Proceso con evento de E/S", () => {
  it("rechaza eventos inválidos", () => {
    expect(() => new Proceso(1, 10, 5, { disparoTrasCpu: 0, duracion: 2 })).toThrow(
      "El disparo del evento de E/S debe ser un entero positivo.",
    );
    expect(() => new Proceso(1, 10, 5, { disparoTrasCpu: 2, duracion: 0 })).toThrow(
      "La duración del evento de E/S debe ser un entero positivo.",
    );
    expect(() => new Proceso(1, 10, 5, { disparoTrasCpu: 1.5, duracion: 2 })).toThrow();
  });

  it("debe bloquearse solo al alcanzar el disparo", () => {
    const p = new Proceso(1, 10, 5, { disparoTrasCpu: 2, duracion: 3 });
    p.admitir();
    p.despachar();
    p.ejecutarUnidad();
    expect(p.debeBloquearse()).toBe(false);
    p.ejecutarUnidad();
    expect(p.debeBloquearse()).toBe(true);
  });

  it("se bloquea, descuenta el temporizador y vuelve a LISTO una sola vez", () => {
    const p = new Proceso(1, 10, 5, { disparoTrasCpu: 1, duracion: 2 });
    p.admitir();
    p.despachar();
    p.ejecutarUnidad();
    p.bloquear();
    expect(p.getEstado()).toBe("BLOQUEADO");
    expect(p.getDatos().bloqueoRestante).toBe(2);
    expect(p.avanzarBloqueo()).toBe(false);
    expect(p.avanzarBloqueo()).toBe(true);
    expect(p.getEstado()).toBe("LISTO");
    expect(p.getDatos().bloqueoRestante).toBe(0);
    expect(p.debeBloquearse()).toBe(false);
  });

  it("un proceso sin evento de E/S nunca se bloquea", () => {
    const p = listo();
    p.despachar();
    p.ejecutarUnidad();
    expect(p.debeBloquearse()).toBe(false);
  });

  it("el evento recibido se copia y no se puede cambiar desde afuera", () => {
    const evento = { disparoTrasCpu: 1, duracion: 2 };
    const p = new Proceso(1, 10, 5, evento);
    evento.disparoTrasCpu = 3;
    p.admitir();
    p.despachar();
    p.ejecutarUnidad();
    expect(p.debeBloquearse()).toBe(true);
  });
});
