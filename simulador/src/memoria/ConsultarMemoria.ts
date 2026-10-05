import { BloqueMemoria } from "./BloqueMemoria";

export interface ConsultarMemoria {
  getBloques(): BloqueMemoria[];
  getMemoriaTotal(): number;
  getMemoriaLibre(): number;
  getMayorBloqueLibre(): number;
}
