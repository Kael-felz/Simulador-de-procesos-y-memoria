import { ConsultarMemoria } from "../memoria/ConsultarMemoria";
import { CalcularMetricas, Metricas } from "./CalcularMetricas";

export class CalculadoraMetricas implements CalcularMetricas {
  private ticksCpuOcupada = 0;

  public registrarTick(cpuOcupada: boolean): void {
    this.ticksCpuOcupada += cpuOcupada ? 1 : 0;
  }

  public calcular(tick: number, memoria: ConsultarMemoria, cambiosContexto: number): Metricas {
    const total = memoria.getMemoriaTotal();
    const libre = memoria.getMemoriaLibre();
    const mayor = memoria.getMayorBloqueLibre();
    return {
      ocupacionMemoria: (100 * (total - libre)) / total,
      utilizacionCpu: tick === 0 ? 0 : (100 * this.ticksCpuOcupada) / tick,
      cambiosContexto,
      memoriaLibreTotal: libre,
      mayorBloqueLibre: mayor,
      fragmentacionExterna: libre === 0 ? 0 : 100 * (1 - mayor / libre),
    };
  }
}
