# Simulador de procesos y memoria

Biblioteca de clases desarrollada en TypeScript con programación orientada a objetos que simula cómo varios procesos
comparten una memoria limitada y una única CPU. Incluye admisión de procesos, asignación de memoria contigua
(First-Fit), liberación con coalescencia, planificación Round-Robin, bloqueo por E/S y métricas.

No tiene interfaz gráfica ni menú: el funcionamiento se demuestra con las pruebas automatizadas.

# Lenguajes y extensiones utilizados

- TypeScript
- Node.js
- Vitest
- @vitest/coverage-v8
- Git y GitHub
- GitHub Actions

# Instalación

```bash
npm install
```

# Ejecutar los tests

```bash
npm run test
```

Si aparece un error de permisos en PowerShell usar:

```bash
npm.cmd run test
```

# Cobertura

```bash
npm run coverage
```

- Herramienta: Vitest con `@vitest/coverage-v8`.
- Alcance: todos los archivos de `simulador/src`, incluidos los que no importa ningún test.
- Umbral: el comando falla si la cobertura de líneas no es mayor al 90 % (configurado en `vitest.config.ts`).
- El reporte HTML queda en `coverage/index.html`.

Cobertura actual de líneas: 91,9 % (la consigna exige más del 90 %).

Quedan sin cubrir solo validaciones internas de defensa (por ejemplo, encolar un proceso que no está listo o liberar
memoria de un PID que no tiene) y algunos getters que el simulador no usa internamente.

Los tests también se ejecutan automáticamente en GitHub Actions con cada push (`.github/workflows/tests.yml`).

# Estructura

```
simulador/src/
  Simular.ts                     interfaz del simulador
  Simulador.ts                   coordina las fases de cada tick
  Validaciones.ts
  procesos/
    Proceso.ts                   estados, transiciones y evento de E/S
    RegistrarProcesos.ts         interfaz
    RegistroProcesos.ts
  memoria/
    BloqueMemoria.ts
    ConsultarMemoria.ts          interfaz
    GestionarMemoria.ts          interfaz
    GestorMemoria.ts             asignación contigua y coalescencia
    SeleccionarBloque.ts         interfaz de la política de asignación
    PoliticaAsignacion.ts        clase abstracta (paso común de toda política)
    PrimerAjuste.ts              First-Fit
  planificacion/
    PlanificarCPU.ts             interfaz
    PlanificadorRoundRobin.ts
    GestionarEntradaSalida.ts    interfaz
    GestorEntradaSalida.ts
  metricas/
    CalcularMetricas.ts          interfaz
    CalculadoraMetricas.ts
tests/                           misma estructura que simulador/src
```

# Uso

```ts
const sim = new Simulador(1024, 2, new PrimerAjuste()); // memoria en KB, quantum y política
sim.registrarProceso(1, 100, 3);                        // pid, memoria, tiempo de CPU
sim.registrarProceso(2, 200, 4, { disparoTrasCpu: 1, duracion: 2 }); // con evento de E/S

const estado = sim.avanzarTick();
estado.pidEjecutado;        // 1
sim.getMetricas();          // ocupación, utilización de CPU, fragmentación, etc.
```

# Política de asignación

Se implementa First-Fit: se recorren los bloques en orden de dirección y se elige el primero que esté libre y
sea suficientemente grande. Si el bloque elegido supera el tamaño solicitado, se divide; al liberar la memoria,
los bloques libres contiguos se fusionan para reducir la fragmentación externa.

# Planificación y E/S

La CPU se planifica con Round-Robin y un quantum configurable. Los procesos que necesitan E/S quedan bloqueados
durante la duración indicada y vuelven a la cola de listos cuando termina la espera.

# Métricas y avance

Cada tick admite procesos con memoria disponible, actualiza los bloqueos de E/S, ejecuta una unidad de CPU y
actualiza el reloj y las métricas. Se exponen la ocupación de memoria, la utilización de CPU, los cambios de
contexto, la memoria libre total, el mayor bloque libre y la fragmentación externa.