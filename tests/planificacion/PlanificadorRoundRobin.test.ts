import { describe, expect, it } from "vitest";
import { PlanificadorRoundRobin } from "../../simulador/src/planificacion/PlanificadorRoundRobin";
import { EventoES, Proceso } from "../../simulador/src/procesos/Proceso";

const listo = (pid: number, cpu: number, evento: EventoES | null = null) => {
  const p = new Proceso(pid, 10, cpu, evento);
  p.admitir();
  return p;
};

const planificadorCon = (quantum: number, ...procesos: Proceso[]) => {
  const rr = new PlanificadorRoundRobin(quantum);
  procesos.forEach((p) => rr.encolar(p));
  return rr;
};

describe("PlanificadorRoundRobin", () => {
  it("rechaza un quantum inválido", () => {
    expect(() => new PlanificadorRoundRobin(0)).toThrow("El quantum debe ser un entero positivo.");
  });

  it("la CPU queda ociosa si no hay procesos listos", () => {
    const rr = new PlanificadorRoundRobin(2);
    expect(rr.ejecutarTick()).toEqual({ pidEjecutado: null, terminado: null, bloqueado: null });
    expect(rr.getPidEnCpu()).toBeNull();
  });

  it("con Q=2, P1 (CPU 3) y P2 (CPU 2) ejecuta P1, P1, P2, P2, P1", () => {
    const rr = planificadorCon(2, listo(1, 3), listo(2, 2));
    const ejecutados = [1, 2, 3, 4, 5].map(() => rr.ejecutarTick().pidEjecutado);
    expect(ejecutados).toEqual([1, 1, 2, 2, 1]);
    expect(rr.getCambiosContexto()).toBe(1);
  });

  it("cada tick descuenta una unidad de CPU al proceso que ejecuta", () => {
    const p = listo(1, 5);
    const rr = planificadorCon(2, p);
    rr.ejecutarTick();
    expect(p.getEstado()).toBe("EJECUTANDO");
    expect(p.getCpuRestante()).toBe(4);
    expect(p.getQuantumConsumido()).toBe(1);
    expect(rr.getPidEnCpu()).toBe(1);
  });

  it("al agotar el quantum con otros listos vuelve al final de la cola", () => {
    const p1 = listo(1, 5);
    const rr = planificadorCon(2, p1, listo(2, 5), listo(3, 5));
    rr.ejecutarTick();
    rr.ejecutarTick();
    expect(p1.getEstado()).toBe("LISTO");
    expect(rr.getPidsListos()).toEqual([2, 3, 1]);
    expect(rr.getPidEnCpu()).toBeNull();
  });

  it("un único proceso renueva el quantum sin cambio de contexto", () => {
    const p = listo(1, 5);
    const rr = planificadorCon(2, p);
    for (let i = 0; i < 4; i++) {
      expect(rr.ejecutarTick().pidEjecutado).toBe(1);
    }
    expect(rr.getCambiosContexto()).toBe(0);
    expect(p.getQuantumConsumido()).toBe(0);
    expect(rr.getPidEnCpu()).toBe(1);
  });

  it("terminar justo al agotar el quantum no lo reencola ni cuenta cambio de contexto", () => {
    const p1 = listo(1, 2);
    const rr = planificadorCon(2, p1, listo(2, 3));
    rr.ejecutarTick();
    expect(rr.ejecutarTick().terminado).toBe(p1);
    expect(p1.getEstado()).toBe("TERMINADO");
    expect(rr.getPidsListos()).toEqual([2]);
    expect(rr.getCambiosContexto()).toBe(0);
  });

  it("después de una finalización el siguiente ejecuta recién en el tick siguiente", () => {
    const rr = planificadorCon(2, listo(1, 1), listo(2, 1));
    expect(rr.ejecutarTick().pidEjecutado).toBe(1);
    expect(rr.getPidEnCpu()).toBeNull();
    expect(rr.ejecutarTick().pidEjecutado).toBe(2);
  });

  it("el bloqueo por E/S tiene prioridad sobre el quantum", () => {
    const p1 = listo(1, 5, { disparoTrasCpu: 2, duracion: 1 });
    const rr = planificadorCon(2, p1, listo(2, 5));
    rr.ejecutarTick();
    expect(rr.ejecutarTick().bloqueado).toBe(p1);
    expect(p1.getEstado()).toBe("BLOQUEADO");
    expect(rr.getPidsListos()).toEqual([2]);
    expect(rr.getCambiosContexto()).toBe(1);
  });

  it("getPidsListos devuelve una copia", () => {
    const rr = planificadorCon(2, listo(1, 3));
    rr.getPidsListos().push(9);
    expect(rr.getPidsListos()).toEqual([1]);
  });
});
