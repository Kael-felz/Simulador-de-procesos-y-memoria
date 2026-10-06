import { Proceso } from "./Proceso";
import { RegistrarProcesos } from "./RegistrarProcesos";

export class RegistroProcesos implements RegistrarProcesos {
  private readonly memoriaMaxima: number;
  private readonly procesos = new Map<number, Proceso>();
  private readonly terminados: number[] = [];

  constructor(memoriaMaxima: number) {
    this.memoriaMaxima = memoriaMaxima;
  }

  public registrar(proceso: Proceso): void {
    this.procesos.has(proceso.getPid()) && this.errorPidDuplicado(proceso);
    proceso.getMemoria() > this.memoriaMaxima && this.errorMemoriaExcedida(proceso);
    this.procesos.set(proceso.getPid(), proceso);
  }

  public obtener(pid: number): Proceso {
    return this.procesos.get(pid) ?? this.errorNoExiste(pid);
  }

  public getProcesos(): Proceso[] {
    return [...this.procesos.values()];
  }

  public getPendientes(): Proceso[] {
    return this.getProcesos().filter((p) => p.getEstado() === "NUEVO" || p.getEstado() === "ESPERANDO_MEMORIA");
  }

  public registrarFinalizacion(pid: number): void {
    this.obtener(pid).getEstado() === "TERMINADO" || this.errorNoTerminado(pid);
    this.terminados.includes(pid) && this.errorYaTerminado(pid);
    this.terminados.push(pid);
  }

  public getPidsTerminados(): number[] {
    return [...this.terminados];
  }

  private errorPidDuplicado(proceso: Proceso): never {
    throw new Error(`Ya existe un proceso con PID ${proceso.getPid()}.`);
  }

  private errorMemoriaExcedida(proceso: Proceso): never {
    throw new Error(`El proceso ${proceso.getPid()} pide más memoria que la memoria total.`);
  }

  private errorNoExiste(pid: number): never {
    throw new Error(`No existe el proceso ${pid}.`);
  }

  private errorNoTerminado(pid: number): never {
    throw new Error(`El proceso ${pid} no está terminado.`);
  }

  private errorYaTerminado(pid: number): never {
    throw new Error(
      `El proceso ${pid} ya fue registrado como terminado.`,
    );
  }
}
