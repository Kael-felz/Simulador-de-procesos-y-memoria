import { Proceso } from "../procesos/Proceso";

export interface GestionarEntradaSalida {
  bloquear(proceso: Proceso): void;
  actualizar(): Proceso[];
  getPidsBloqueados(): number[];
}
