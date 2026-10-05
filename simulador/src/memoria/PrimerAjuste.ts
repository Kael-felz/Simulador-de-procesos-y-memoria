import { BloqueMemoria } from "./BloqueMemoria";
import { PoliticaAsignacion } from "./PoliticaAsignacion";

export class PrimerAjuste extends PoliticaAsignacion {
  // Los candidatos llegan ordenados por dirección: el primero es el de menor dirección.
  protected elegir(candidatos: BloqueMemoria[]): BloqueMemoria {
    return candidatos[0];
  }
}
