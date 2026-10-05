import { BloqueMemoria } from "./BloqueMemoria";
import { SeleccionarBloque } from "./SeleccionarBloque";

export abstract class PoliticaAsignacion implements SeleccionarBloque {
  // Paso común a toda política contigua: quedarse con los bloques libres que alcanzan.
  // Cuál de esos candidatos se usa lo decide cada subclase en elegir().
  public seleccionar(bloques: BloqueMemoria[], tamano: number): number | null {
    const candidatos = bloques.filter((bloque) => bloque.estaLibre() && bloque.getTamano() >= tamano);
    return candidatos.length === 0 ? null : bloques.indexOf(this.elegir(candidatos));
  }

  protected abstract elegir(candidatos: BloqueMemoria[]): BloqueMemoria;
}
