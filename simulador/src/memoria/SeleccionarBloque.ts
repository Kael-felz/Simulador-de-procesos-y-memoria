import { BloqueMemoria } from "./BloqueMemoria";

export interface SeleccionarBloque {
  seleccionar(bloques: BloqueMemoria[], tamano: number): number | null;
}
