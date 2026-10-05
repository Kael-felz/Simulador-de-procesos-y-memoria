import { Proceso } from "../procesos/Proceso";
import { GestionarEntradaSalida } from "./GestionarEntradaSalida";

export class GestorEntradaSalida implements GestionarEntradaSalida {
  private bloqueados: Proceso[] = [];

  public bloquear(proceso: Proceso): void {
    proceso.getEstado() === "BLOQUEADO" || this.errorNoBloqueado(proceso);
    this.bloqueados.includes(proceso) && this.errorYaBloqueado(proceso);
    this.bloqueados.push(proceso);
  }

  public actualizar(): Proceso[] {
    const desbloqueados = this.bloqueados.filter((proceso) => proceso.avanzarBloqueo());
    this.bloqueados = this.bloqueados.filter((proceso) => !desbloqueados.includes(proceso));
    return desbloqueados;
  }

  public getPidsBloqueados(): number[] {
    return this.bloqueados.map((p) => p.getPid());
  }

  private errorNoBloqueado(proceso: Proceso): never {
    throw new Error(`El proceso ${proceso.getPid()} no está bloqueado.`);
  }

  private errorYaBloqueado(proceso: Proceso): never {
    throw new Error(
      `El proceso ${proceso.getPid()} ya está en la lista de bloqueados.`,
    );
  }
}
