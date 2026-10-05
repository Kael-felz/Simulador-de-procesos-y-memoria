import { beforeEach, describe, expect, it } from "vitest";
import { BloqueMemoria } from "../../simulador/src/memoria/BloqueMemoria";
import { GestorMemoria } from "../../simulador/src/memoria/GestorMemoria";
import { PrimerAjuste } from "../../simulador/src/memoria/PrimerAjuste";

const mapa = (g: GestorMemoria) => g.getBloques().map((b) => [b.getInicio(), b.getTamano(), b.getPid()]);

// 1000 KB con huecos libres de 300 (en 100), 100 (en 500) y 200 (en 800).
const gestorConHuecos = () => {
  const g = new GestorMemoria(1000, new PrimerAjuste());
  g.asignar(1, 100);
  g.asignar(10, 300);
  g.asignar(2, 100);
  g.asignar(11, 100);
  g.asignar(3, 200);
  g.liberar(10);
  g.liberar(11);
  return g;
};

describe("GestorMemoria - asignación contigua", () => {
  it("arranca con un único bloque libre de toda la memoria", () => {
    const g = new GestorMemoria(1024, new PrimerAjuste());
    expect(mapa(g)).toEqual([[0, 1024, null]]);
    expect(g.getMemoriaTotal()).toBe(1024);
    expect(g.getMemoriaLibre()).toBe(1024);
    expect(g.getMayorBloqueLibre()).toBe(1024);
  });

  it("divide el bloque cuando sobra espacio", () => {
    const g = new GestorMemoria(1024, new PrimerAjuste());
    expect(g.asignar(1, 200)).toBe(true);
    expect(mapa(g)).toEqual([[0, 200, 1], [200, 824, null]]);
  });

  it("una asignación exacta no deja bloques de tamaño cero", () => {
    const g = new GestorMemoria(1024, new PrimerAjuste());
    expect(g.asignar(1, 1024)).toBe(true);
    expect(mapa(g)).toEqual([[0, 1024, 1]]);
    expect(g.getMayorBloqueLibre()).toBe(0);
  });

  it("ubica el proceso en el primer hueco que alcanza", () => {
    const g = gestorConHuecos();
    expect(g.asignar(9, 80)).toBe(true);
    expect(mapa(g)).toContainEqual([100, 80, 9]);
    expect(mapa(g)).toContainEqual([180, 220, null]);
  });

  it("si no hay hueco contiguo suficiente falla sin modificar nada, aunque la suma libre alcance", () => {
    const g = gestorConHuecos();
    const antes = mapa(g);
    expect(g.getMemoriaLibre()).toBe(600);
    expect(g.asignar(9, 350)).toBe(false);
    expect(mapa(g)).toEqual(antes);
  });

  it("rechaza tamaños inválidos", () => {
    const g = new GestorMemoria(1024, new PrimerAjuste());
    expect(() => g.asignar(2, 0)).toThrow("El tamaño a asignar debe ser un entero positivo.");
    expect(() => new GestorMemoria(0, new PrimerAjuste())).toThrow("La memoria total debe ser un entero positivo.");
  });

  it("getBloques devuelve una copia", () => {
    const g = new GestorMemoria(1024, new PrimerAjuste());
    g.getBloques().push(new BloqueMemoria(0, 1));
    expect(g.getBloques()).toHaveLength(1);
  });
});

describe("GestorMemoria - liberación y coalescencia", () => {
  let g: GestorMemoria;

  beforeEach(() => {
    // [1: 0-100][2: 100-300][3: 300-600][4: 600-1000]
    g = new GestorMemoria(1000, new PrimerAjuste());
    g.asignar(1, 100);
    g.asignar(2, 200);
    g.asignar(3, 300);
    g.asignar(4, 400);
  });

  it("sin vecinos libres solo marca el bloque como libre", () => {
    g.liberar(2);
    expect(mapa(g)).toEqual([[0, 100, 1], [100, 200, null], [300, 300, 3], [600, 400, 4]]);
  });

  it("se fusiona con el vecino izquierdo", () => {
    g.liberar(1);
    g.liberar(2);
    expect(mapa(g)).toEqual([[0, 300, null], [300, 300, 3], [600, 400, 4]]);
  });

  it("se fusiona con el vecino derecho", () => {
    g.liberar(3);
    g.liberar(2);
    expect(mapa(g)).toEqual([[0, 100, 1], [100, 500, null], [600, 400, 4]]);
  });

  it("se fusiona con ambos vecinos", () => {
    g.liberar(1);
    g.liberar(3);
    g.liberar(2);
    expect(mapa(g)).toEqual([[0, 600, null], [600, 400, 4]]);
  });

  it("al liberar todo queda un único bloque libre", () => {
    g.liberar(3);
    g.liberar(1);
    g.liberar(4);
    g.liberar(2);
    expect(mapa(g)).toEqual([[0, 1000, null]]);
  });

  it("mantiene el tamaño total, la continuidad y no deja libres adyacentes", () => {
    g.liberar(3);
    g.liberar(1);
    const bloques = g.getBloques();
    expect(bloques.reduce((suma, b) => suma + b.getTamano(), 0)).toBe(1000);
    for (let i = 1; i < bloques.length; i++) {
      expect(bloques[i - 1].getInicio() + bloques[i - 1].getTamano()).toBe(bloques[i].getInicio());
      expect(bloques[i - 1].estaLibre() && bloques[i].estaLibre()).toBe(false);
    }
  });

  it("no mueve los bloques ocupados", () => {
    g.liberar(1);
    g.liberar(3);
    expect(mapa(g)).toContainEqual([100, 200, 2]);
    expect(mapa(g)).toContainEqual([600, 400, 4]);
  });
});
