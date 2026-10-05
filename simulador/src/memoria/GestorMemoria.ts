import { validarEnteroPositivo } from "../Validaciones";
import { BloqueMemoria } from "./BloqueMemoria";
import { GestionarMemoria } from "./GestionarMemoria";
import { SeleccionarBloque } from "./SeleccionarBloque";

export class GestorMemoria implements GestionarMemoria {
  private readonly memoriaTotal: number;
  private readonly politica: SeleccionarBloque;
  private bloques: BloqueMemoria[];

  constructor(memoriaTotal: number, politica: SeleccionarBloque) {
    this.memoriaTotal = validarEnteroPositivo(memoriaTotal, "La memoria total");
    this.politica = politica;
    this.bloques = [new BloqueMemoria(0, memoriaTotal)];
  }

  public asignar(pid: number, tamano: number): boolean {
    validarEnteroPositivo(tamano, "El tamaño a asignar");
    if (this.buscarIndice(pid) !== null) {
      throw new Error(`El proceso ${pid} ya tiene memoria asignada.`);
    }
    const indice = this.politica.seleccionar(this.getBloques(), tamano);
    if (indice === null) {
      return false;
    }
    const bloque = this.bloques[indice];
    const nuevos = [new BloqueMemoria(bloque.getInicio(), tamano, pid)];
    if (bloque.getTamano() > tamano) {
      nuevos.push(new BloqueMemoria(bloque.getInicio() + tamano, bloque.getTamano() - tamano));
    }
    this.bloques.splice(indice, 1, ...nuevos);
    return true;
  }

  public liberar(pid: number): void {
    const indice = this.buscarIndice(pid);
    if (indice === null) {
      throw new Error(`El proceso ${pid} no tiene memoria asignada.`);
    }
    const bloque = this.bloques[indice];
    this.bloques[indice] = new BloqueMemoria(bloque.getInicio(), bloque.getTamano());
    this.coalescer(indice);
  }

  public getBloques(): BloqueMemoria[] {
    return [...this.bloques];
  }

  public getMemoriaTotal(): number {
    return this.memoriaTotal;
  }

  public getMemoriaLibre(): number {
    return this.bloquesLibres().reduce((suma, b) => suma + b.getTamano(), 0);
  }

  public getMayorBloqueLibre(): number {
    return Math.max(0, ...this.bloquesLibres().map((b) => b.getTamano()));
  }

  private bloquesLibres(): BloqueMemoria[] {
    return this.bloques.filter((b) => b.estaLibre());
  }

  private buscarIndice(pid: number): number | null {
    const indice = this.bloques.findIndex((b) => b.getPid() === pid);
    return indice === -1 ? null : indice;
  }

  private coalescer(indice: number): void {
    const derecho = this.bloques[indice + 1];
    if (derecho !== undefined && derecho.estaLibre()) {
      this.fusionar(indice);
    }
    const izquierdo = this.bloques[indice - 1];
    if (izquierdo !== undefined && izquierdo.estaLibre()) {
      this.fusionar(indice - 1);
    }
  }

  private fusionar(indice: number): void {
    const primero = this.bloques[indice];
    const segundo = this.bloques[indice + 1];
    const unido = new BloqueMemoria(primero.getInicio(), primero.getTamano() + segundo.getTamano());
    this.bloques.splice(indice, 2, unido);
  }
}
