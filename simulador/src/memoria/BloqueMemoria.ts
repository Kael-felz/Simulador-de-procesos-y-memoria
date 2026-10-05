export class BloqueMemoria {
  private readonly inicio: number;
  private readonly tamano: number;
  private readonly pid: number | null;

  constructor(inicio: number, tamano: number, pid: number | null = null) {
    this.inicio = inicio;
    this.tamano = tamano;
    this.pid = pid;
  }

  public getInicio(): number {
    return this.inicio;
  }

  public getTamano(): number {
    return this.tamano;
  }

  public getPid(): number | null {
    return this.pid;
  }

  public getFin(): number {
    return this.inicio + this.tamano;
  }

  public estaLibre(): boolean {
    return this.pid === null;
  }
}
