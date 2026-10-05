import { GestionarMemoria } from "./memoria/GestionarMemoria";
import { GestorMemoria } from "./memoria/GestorMemoria";
import { PrimerAjuste } from "./memoria/PrimerAjuste";
import { SeleccionarBloque } from "./memoria/SeleccionarBloque";
import { CalcularMetricas, Metricas } from "./metricas/CalcularMetricas";
import { CalculadoraMetricas } from "./metricas/CalculadoraMetricas";
import { GestionarEntradaSalida } from "./planificacion/GestionarEntradaSalida";
import { GestorEntradaSalida } from "./planificacion/GestorEntradaSalida";
import { PlanificadorRoundRobin } from "./planificacion/PlanificadorRoundRobin";
import { PlanificarCPU, ResultadoCPU } from "./planificacion/PlanificarCPU";
import { DatosProceso, EventoES, Proceso } from "./procesos/Proceso";
import { RegistrarProcesos } from "./procesos/RegistrarProcesos";
import { RegistroProcesos } from "./procesos/RegistroProcesos";
import { EstadoSistema, Simular } from "./Simular";
import { validarEnteroPositivo } from "./Validaciones";

export class Simulador implements Simular {
  private readonly memoria: GestionarMemoria;
  private readonly planificador: PlanificarCPU;
  private readonly entradaSalida: GestionarEntradaSalida;
  private readonly registro: RegistrarProcesos;
  private readonly calculadora: CalcularMetricas;
  private tick = 0;
  private ultimoPidEjecutado: number | null = null;
  private metricas: Metricas;

  constructor(memoriaTotal: number = 1024, quantum: number = 2, politica: SeleccionarBloque = new PrimerAjuste()) {
    // Se valida todo antes de crear los componentes: no quedan estados parciales.
    validarEnteroPositivo(memoriaTotal, "La memoria total");
    validarEnteroPositivo(quantum, "El quantum");
    this.memoria = new GestorMemoria(memoriaTotal, politica);
    this.planificador = new PlanificadorRoundRobin(quantum);
    this.entradaSalida = new GestorEntradaSalida();
    this.registro = new RegistroProcesos(memoriaTotal);
    this.calculadora = new CalculadoraMetricas();
    this.metricas = this.calculadora.calcular(0, this.memoria, 0);
  }

  public registrarProceso(pid: number, memoria: number, cpu: number, eventoES?: EventoES): DatosProceso {
    const proceso = new Proceso(pid, memoria, cpu, eventoES ?? null);
    this.registro.registrar(proceso);
    return proceso.getDatos();
  }

  public avanzarTick(): EstadoSistema {
    this.admitirProcesos();
    this.actualizarBloqueados();
    const resultado = this.ejecutarCpu();
    this.avanzarReloj(resultado);
    return this.getEstado();
  }

  public getTick(): number {
    return this.tick;
  }

  public getProceso(pid: number): DatosProceso {
    return this.registro.obtener(pid).getDatos();
  }

  public getProcesos(): DatosProceso[] {
    return this.registro.getProcesos().map((p) => p.getDatos());
  }

  public getEstado(): EstadoSistema {
    return {
      tick: this.tick,
      pidEjecutado: this.ultimoPidEjecutado,
      pidEnCpu: this.planificador.getPidEnCpu(),
      listos: this.planificador.getPidsListos(),
      esperandoMemoria: this.registro.getPendientes().map((p) => p.getPid()),
      bloqueados: this.entradaSalida.getPidsBloqueados(),
      terminados: this.registro.getPidsTerminados(),
      mapaMemoria: this.memoria.getBloques(),
    };
  }

  public getMetricas(): Metricas {
    return this.metricas;
  }

  // Fase 1: admisión, en orden de registro.
  private admitirProcesos(): void {
    for (const proceso of this.registro.getPendientes()) {
      const asignado = this.memoria.asignar(proceso.getPid(), proceso.getMemoria());
      asignado ? this.encolarAdmitido(proceso) : proceso.esperarMemoria();
    }
  }

  private encolarAdmitido(proceso: Proceso): void {
    proceso.admitir();
    this.planificador.encolar(proceso);
  }

  // Fase 2: actualización de bloqueados.
  private actualizarBloqueados(): void {
    for (const proceso of this.entradaSalida.actualizar()) {
      this.planificador.encolar(proceso);
    }
  }

  // Fase 3: despacho y ejecución.
  private ejecutarCpu(): ResultadoCPU {
    const resultado = this.planificador.ejecutarTick();
    resultado.terminado !== null && this.finalizarProceso(resultado.terminado);
    resultado.bloqueado !== null && this.entradaSalida.bloquear(resultado.bloqueado);
    return resultado;
  }

  private finalizarProceso(proceso: Proceso): void {
    this.memoria.liberar(proceso.getPid());
    this.registro.registrarFinalizacion(proceso.getPid());
  }

  // Fase 4: reloj y métricas.
  private avanzarReloj(resultado: ResultadoCPU): void {
    this.tick++;
    this.ultimoPidEjecutado = resultado.pidEjecutado;
    this.calculadora.registrarTick(resultado.pidEjecutado !== null);
    this.metricas = this.calculadora.calcular(this.tick, this.memoria, this.planificador.getCambiosContexto());
  }
}
