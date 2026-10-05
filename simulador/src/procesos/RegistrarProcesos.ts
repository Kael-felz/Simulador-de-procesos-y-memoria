import { Proceso } from "./Proceso";

export interface RegistrarProcesos {
  registrar(proceso: Proceso): void;
  obtener(pid: number): Proceso;
  getProcesos(): Proceso[];
  getPendientes(): Proceso[];
  registrarFinalizacion(pid: number): void;
  getPidsTerminados(): number[];
}
