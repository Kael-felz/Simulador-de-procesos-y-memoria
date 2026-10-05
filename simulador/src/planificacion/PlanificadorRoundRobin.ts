import { Proceso } from "../procesos/Proceso";
import { validarEnteroPositivo } from "../Validaciones";
import { PlanificarCPU, ResultadoCPU } from "./PlanificarCPU";

const CPU_OCIOSA: ResultadoCPU = { pidEjecutado: null, terminado: null, bloqueado: null };

export class PlanificadorRoundRobin implements PlanificarCPU {
  private readonly quantum: number;
  private readonly colaListos: Proceso[] = [];
  private enCpu: Proceso | null = null;
  private cambiosContexto = 0;

  constructor(quantum: number) {
    this.quantum = validarEnteroPositivo(quantum, "El quantum");
  }

  public encolar(proceso: Proceso): void {
    proceso.getEstado() === "LISTO" || this.errorNoEstaListo(proceso);
    this.estaEnPlanificador(proceso) && this.errorYaEncolado(proceso);
    this.colaListos.push(proceso);
  }

  public ejecutarTick(): ResultadoCPU {
    this.enCpu === null && this.despacharSiguiente();
    const proceso = this.enCpu;
    return proceso === null ? CPU_OCIOSA : this.ejecutar(proceso);
  }

  public getPidEnCpu(): number | null {
    return this.enCpu === null ? null : this.enCpu.getPid();
  }

  public getPidsListos(): number[] {
    return this.colaListos.map((p) => p.getPid());
  }

  public getCambiosContexto(): number {
    return this.cambiosContexto;
  }

  private despacharSiguiente(): void {
    const siguiente = this.colaListos.shift() ?? null;
    siguiente?.despachar();
    this.enCpu = siguiente;
  }

  private ejecutar(proceso: Proceso): ResultadoCPU {
    proceso.ejecutarUnidad();
    // Prioridad: finalización > bloqueo por E/S > quantum agotado.
    return proceso.getCpuRestante() === 0
      ? this.finalizar(proceso)
      : proceso.debeBloquearse()
        ? this.bloquear(proceso)
        : this.controlarQuantum(proceso);
  }

  private finalizar(proceso: Proceso): ResultadoCPU {
    proceso.terminar();
    this.enCpu = null;
    return { pidEjecutado: proceso.getPid(), terminado: proceso, bloqueado: null };
  }

  private bloquear(proceso: Proceso): ResultadoCPU {
    proceso.bloquear();
    this.enCpu = null;
    this.cambiosContexto++;
    return { pidEjecutado: proceso.getPid(), terminado: null, bloqueado: proceso };
  }

  private controlarQuantum(proceso: Proceso): ResultadoCPU {
    proceso.getQuantumConsumido() >= this.quantum && this.rotar(proceso);
    return { pidEjecutado: proceso.getPid(), terminado: null, bloqueado: null };
  }

  // Si no hay otros listos el proceso sigue en la CPU con el quantum renovado.
  private rotar(proceso: Proceso): void {
    this.colaListos.length === 0 ? proceso.renovarQuantum() : this.expulsar(proceso);
  }

  private expulsar(proceso: Proceso): void {
    proceso.expulsar();
    this.colaListos.push(proceso);
    this.enCpu = null;
    this.cambiosContexto++;
  }

  private estaEnPlanificador(proceso: Proceso): boolean {
    return this.colaListos.includes(proceso) || this.enCpu === proceso;
  }

  private errorNoEstaListo(proceso: Proceso): never {
    throw new Error(
      `Solo se pueden encolar procesos listos (el ${proceso.getPid()} está ${proceso.getEstado()}).`,
    );
  }

  private errorYaEncolado(proceso: Proceso): never {
    throw new Error(`El proceso ${proceso.getPid()} ya está en el planificador.`);
  }
}
