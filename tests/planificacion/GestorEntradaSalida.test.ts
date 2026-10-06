import { describe, expect, it } from "vitest";
import { GestorEntradaSalida } from "../../simulador/src/planificacion/GestorEntradaSalida";
import { Proceso } from "../../simulador/src/procesos/Proceso";

const bloqueado = (pid: number, duracion: number) => {
  const p = new Proceso(pid, 10, 5, { disparoTrasCpu: 1, duracion });
  p.admitir();
  p.despachar();
  p.ejecutarUnidad();
  p.bloquear();
  return p;
};

describe("GestorEntradaSalida", () => {
  it("devuelve los desbloqueados en orden de bloqueo", () => {
    const es = new GestorEntradaSalida();
    const p1 = bloqueado(1, 2);
    const p2 = bloqueado(2, 1);
    const p3 = bloqueado(3, 2);
    es.bloquear(p1);
    es.bloquear(p2);
    es.bloquear(p3);
    expect(es.getPidsBloqueados()).toEqual([1, 2, 3]);
    expect(es.actualizar()).toEqual([p2]);
    expect(es.getPidsBloqueados()).toEqual([1, 3]);
    expect(es.actualizar()).toEqual([p1, p3]);
    expect(es.getPidsBloqueados()).toEqual([]);
  });
});
