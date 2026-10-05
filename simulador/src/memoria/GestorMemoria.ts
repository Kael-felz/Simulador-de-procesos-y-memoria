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
    this.buscarIndice(pid) === null || this.errorYaAsignado(pid);
    const indice = this.politica.seleccionar(this.getBloques(), tamano);
    indice !== null && this.ocupar(indice, pid, tamano);
    return indice !== null;
  }

  public liberar(pid: number): void {
    const indice = this.buscarIndice(pid) ?? this.errorSinMemoria(pid);
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

  private ocupar(indice: number, pid: number, tamano: number): void {
    const bloque = this.bloques[indice];
    const sobrante = bloque.getTamano() - tamano;
    const ocupado = new BloqueMemoria(bloque.getInicio(), tamano, pid);
    const libre = new BloqueMemoria(bloque.getInicio() + tamano, sobrante);
    // Si el ajuste es exacto no se crea un bloque libre de tamaño 0.
    this.bloques.splice(indice, 1, ...(sobrante > 0 ? [ocupado, libre] : [ocupado]));
  }

  private bloquesLibres(): BloqueMemoria[] {
    return this.bloques.filter((b) => b.estaLibre());
  }

  private buscarIndice(pid: number): number | null {
    const indice = this.bloques.findIndex((b) => b.getPid() === pid);
    return indice === -1 ? null : indice;
  }

  // Une el bloque liberado con sus vecinos libres: primero el derecho y después el izquierdo.
  private coalescer(indice: number): void {
    this.estaLibre(indice + 1) && this.fusionar(indice);
    this.estaLibre(indice - 1) && this.fusionar(indice - 1);
  }

  private estaLibre(indice: number): boolean {
    const bloque = this.bloques[indice];
    return bloque !== undefined && bloque.estaLibre();
  }

  private fusionar(indice: number): void {
    const primero = this.bloques[indice];
    const segundo = this.bloques[indice + 1];
    const unido = new BloqueMemoria(primero.getInicio(), primero.getTamano() + segundo.getTamano());
    this.bloques.splice(indice, 2, unido);
  }

  private errorYaAsignado(pid: number): never {
    throw new Error(`El proceso ${pid} ya tiene memoria asignada.`);
  }

  private errorSinMemoria(pid: number): never {
    throw new Error(`El proceso ${pid} no tiene memoria asignada.`);
  }
}
