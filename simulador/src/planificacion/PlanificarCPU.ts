import { Proceso } from "../procesos/Proceso";

export type ResultadoCPU = {
  pidEjecutado: number | null;
  terminado: Proceso | null;
  bloqueado: Proceso | null;
};

export interface PlanificarCPU {
  encolar(proceso: Proceso): void;
  ejecutarTick(): ResultadoCPU;
  getPidEnCpu(): number | null;
  getPidsListos(): number[];
  getCambiosContexto(): number;
}
