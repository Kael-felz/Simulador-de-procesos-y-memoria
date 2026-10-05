import { validarEnteroPositivo } from "../Validaciones";

export type EstadoProceso = "NUEVO" | "ESPERANDO_MEMORIA" | "LISTO" | "EJECUTANDO" | "BLOQUEADO" | "TERMINADO";

export type EventoES = {
  disparoTrasCpu: number;
  duracion: number;
};

export type DatosProceso = Readonly<{
  pid: number;
  memoria: number;
  cpuTotal: number;
  cpuRestante: number;
  estado: EstadoProceso;
  quantumConsumido: number;
  bloqueoRestante: number;
}>;

const TRANSICIONES: Record<EstadoProceso, EstadoProceso[]> = {
  NUEVO: ["ESPERANDO_MEMORIA", "LISTO"],
  ESPERANDO_MEMORIA: ["LISTO"],
  LISTO: ["EJECUTANDO"],
  EJECUTANDO: ["LISTO", "BLOQUEADO", "TERMINADO"],
  BLOQUEADO: ["LISTO"],
  TERMINADO: [],
};

export class Proceso {
  private readonly pid: number;
  private readonly memoria: number;
  private readonly cpuTotal: number;
  private readonly eventoES: EventoES | null;
  private cpuRestante: number;
  private estado: EstadoProceso = "NUEVO";
  private quantumConsumido = 0;
  private bloqueoRestante = 0;
  private eventoDisparado = false;

  constructor(pid: number, memoria: number, cpu: number, eventoES: EventoES | null = null) {
    this.pid = validarEnteroPositivo(pid, "El PID");
    this.memoria = validarEnteroPositivo(memoria, "La memoria");
    this.cpuTotal = validarEnteroPositivo(cpu, "El tiempo de CPU");
    eventoES === null || Proceso.validarEvento(eventoES, cpu);
    this.cpuRestante = cpu;
    this.eventoES = eventoES === null ? null : { ...eventoES };
  }

  public getPid(): number {
    return this.pid;
  }

  public getMemoria(): number {
    return this.memoria;
  }

  public getCpuTotal(): number {
    return this.cpuTotal;
  }

  public getCpuRestante(): number {
    return this.cpuRestante;
  }

  public getEstado(): EstadoProceso {
    return this.estado;
  }

  public getQuantumConsumido(): number {
    return this.quantumConsumido;
  }

  public getBloqueoRestante(): number {
    return this.bloqueoRestante;
  }

  public getDatos(): DatosProceso {
    return {
      pid: this.pid,
      memoria: this.memoria,
      cpuTotal: this.cpuTotal,
      cpuRestante: this.cpuRestante,
      estado: this.estado,
      quantumConsumido: this.quantumConsumido,
      bloqueoRestante: this.bloqueoRestante,
    };
  }

  // Se reintenta en cada tick: si ya estaba esperando, no cambia nada.
  public esperarMemoria(): void {
    this.estado === "ESPERANDO_MEMORIA" || this.cambiarEstado("ESPERANDO_MEMORIA");
  }

  public admitir(): void {
    this.cambiarEstado("LISTO");
  }

  public despachar(): void {
    this.cambiarEstado("EJECUTANDO");
    this.quantumConsumido = 0;
  }

  public ejecutarUnidad(): void {
    this.exigirEstado("EJECUTANDO");
    this.cpuRestante--;
    this.quantumConsumido++;
  }

  public debeBloquearse(): boolean {
    return (
      this.eventoES !== null &&
      !this.eventoDisparado &&
      this.cpuRestante > 0 &&
      this.cpuTotal - this.cpuRestante === this.eventoES.disparoTrasCpu
    );
  }

  public bloquear(): void {
    const evento = this.debeBloquearse() ? this.eventoES : null;
    const duracion = evento?.duracion ?? this.errorSinEvento();
    this.cambiarEstado("BLOQUEADO");
    this.bloqueoRestante = duracion;
    this.eventoDisparado = true;
  }

  public avanzarBloqueo(): boolean {
    this.exigirEstado("BLOQUEADO");
    this.bloqueoRestante--;
    const termino = this.bloqueoRestante === 0;
    termino && this.cambiarEstado("LISTO");
    return termino;
  }

  public expulsar(): void {
    this.cambiarEstado("LISTO");
  }

  public renovarQuantum(): void {
    this.exigirEstado("EJECUTANDO");
    this.quantumConsumido = 0;
  }

  public terminar(): void {
    this.cpuRestante === 0 || this.errorCpuRestante();
    this.cambiarEstado("TERMINADO");
  }

  private exigirEstado(esperado: EstadoProceso): void {
    this.estado === esperado || this.errorEstado(esperado);
  }

  private cambiarEstado(nuevo: EstadoProceso): void {
    TRANSICIONES[this.estado].includes(nuevo) || this.errorTransicion(nuevo);
    this.estado = nuevo;
  }

  private static validarEvento(evento: EventoES, cpu: number): void {
    validarEnteroPositivo(evento.disparoTrasCpu, "El disparo del evento de E/S");
    validarEnteroPositivo(evento.duracion, "La duración del evento de E/S");
    evento.disparoTrasCpu < cpu || Proceso.errorEventoTardio();
  }

  private static errorEventoTardio(): never {
    throw new Error("El evento de E/S debe dispararse antes de que termine el proceso.");
  }

  private errorSinEvento(): never {
    throw new Error(`El proceso ${this.pid} no tiene un evento de E/S pendiente.`);
  }

  private errorCpuRestante(): never {
    throw new Error(`El proceso ${this.pid} todavía tiene CPU restante.`);
  }

  private errorEstado(esperado: EstadoProceso): never {
    throw new Error(
      `El proceso ${this.pid} está ${this.estado} y se esperaba ${esperado}.`,
    );
  }

  private errorTransicion(nuevo: EstadoProceso): never {
    throw new Error(`Transición inválida del proceso ${this.pid}: ${this.estado} -> ${nuevo}.`);
  }
}
