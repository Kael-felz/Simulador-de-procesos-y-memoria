import { beforeEach, describe, expect, it } from "vitest";
import { Proceso } from "../../simulador/src/procesos/Proceso";
import { RegistroProcesos } from "../../simulador/src/procesos/RegistroProcesos";

const terminar = (p: Proceso) => {
  p.admitir();
  p.despachar();
  p.ejecutarUnidad();
  p.terminar();
};

describe("RegistroProcesos", () => {
  let registro: RegistroProcesos;

  beforeEach(() => {
    registro = new RegistroProcesos(1024);
  });

  it("registra y obtiene procesos", () => {
    const p = new Proceso(1, 100, 3);
    registro.registrar(p);
    expect(registro.obtener(1)).toBe(p);
    expect(registro.getProcesos()).toEqual([p]);
  });

  it("rechaza PID duplicados", () => {
    registro.registrar(new Proceso(1, 100, 3));
    expect(() => registro.registrar(new Proceso(1, 50, 2))).toThrow("Ya existe un proceso con PID 1.");
    expect(registro.getProcesos()).toHaveLength(1);
  });

  it("rechaza procesos que piden más memoria que la total y acepta el tamaño exacto", () => {
    expect(() => registro.registrar(new Proceso(1, 1025, 3))).toThrow(
      "El proceso 1 pide más memoria que la memoria total.",
    );
    registro.registrar(new Proceso(2, 1024, 3));
    expect(registro.getProcesos()).toHaveLength(1);
  });

  it("devuelve los pendientes en orden de registro", () => {
    for (const pid of [3, 1, 2]) registro.registrar(new Proceso(pid, 10, 1));
    expect(registro.getPendientes().map((p) => p.getPid())).toEqual([3, 1, 2]);
  });

  it("registra la finalización de un proceso terminado", () => {
    const p = new Proceso(1, 10, 1);
    registro.registrar(p);
    terminar(p);
    registro.registrarFinalizacion(1);
    expect(registro.getPidsTerminados()).toEqual([1]);
  });

  it("las listas devueltas son copias", () => {
    registro.registrar(new Proceso(1, 10, 1));
    registro.getProcesos().pop();
    registro.getPidsTerminados().push(5);
    expect(registro.getProcesos()).toHaveLength(1);
    expect(registro.getPidsTerminados()).toEqual([]);
  });
});
