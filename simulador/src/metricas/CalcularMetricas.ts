import { ConsultarMemoria } from "../memoria/ConsultarMemoria";

export type Metricas = Readonly<{
  ocupacionMemoria: number;
  utilizacionCpu: number;
  cambiosContexto: number;
  memoriaLibreTotal: number;
  mayorBloqueLibre: number;
  fragmentacionExterna: number;
}>;

export interface CalcularMetricas {
  registrarTick(cpuOcupada: boolean): void;
  calcular(tick: number, memoria: ConsultarMemoria, cambiosContexto: number): Metricas;
}
