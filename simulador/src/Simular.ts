import { BloqueMemoria } from "./memoria/BloqueMemoria";
import { Metricas } from "./metricas/CalcularMetricas";
import { DatosProceso, EventoES } from "./procesos/Proceso";

export type EstadoSistema = Readonly<{
  tick: number;
  pidEjecutado: number | null;
  pidEnCpu: number | null;
  listos: number[];
  esperandoMemoria: number[];
  bloqueados: number[];
  terminados: number[];
  mapaMemoria: BloqueMemoria[];
}>;

export interface Simular {
  registrarProceso(pid: number, memoria: number, cpu: number, eventoES?: EventoES): DatosProceso;
  avanzarTick(): EstadoSistema;
  getTick(): number;
  getProceso(pid: number): DatosProceso;
  getProcesos(): DatosProceso[];
  getEstado(): EstadoSistema;
  getMetricas(): Metricas;
}
