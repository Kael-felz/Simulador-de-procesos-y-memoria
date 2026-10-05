import { ConsultarMemoria } from "./ConsultarMemoria";

export interface GestionarMemoria extends ConsultarMemoria {
  asignar(pid: number, tamano: number): boolean;
  liberar(pid: number): void;
}
