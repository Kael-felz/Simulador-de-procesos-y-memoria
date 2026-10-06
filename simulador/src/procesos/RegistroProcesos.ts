import { Proceso } from "./Proceso";
import { RegistrarProcesos } from "./RegistrarProcesos";

export class RegistroProcesos implements RegistrarProcesos {
  private readonly procesos = new Map<number, Proceso>();
  private readonly terminados: number[] = [];
  private readonly memoriaTotal: number;

  constructor(memoriaTotal: number) {
    this.memoriaTotal = memoriaTotal;
  }

  public registrar(proceso: Proceso): void {
    const pid = proceso.getPid();

    if (this.procesos.has(pid)) {
      throw new Error(`Ya existe un proceso con PID ${pid}.`);
    }

    if (proceso.getMemoria() > this.memoriaTotal) {
      throw new Error(`El proceso ${pid} pide más memoria que la memoria total.`);
    }

    this.procesos.set(pid, proceso);
  }

  public obtener(pid: number): Proceso {
    const proceso = this.procesos.get(pid);
    if (!proceso) {
      throw new Error(`No existe un proceso con PID ${pid}.`);
    }
    return proceso;
  }

  public getProcesos(): Proceso[] {
    return Array.from(this.procesos.values());
  }

  public getPendientes(): Proceso[] {
    return this.getProcesos().filter((proceso) => {
      const estado = proceso.getEstado();
      return estado === "NUEVO" || estado === "ESPERANDO_MEMORIA";
    });
  }

  public registrarFinalizacion(pid: number): void {
    this.obtener(pid);
    if (!this.terminados.includes(pid)) {
      this.terminados.push(pid);
    }
  }

  public getPidsTerminados(): number[] {
    return [...this.terminados];
  }
}
