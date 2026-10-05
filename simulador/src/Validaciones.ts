export function validarEnteroPositivo(valor: number, nombre: string): number {
  return Number.isInteger(valor) && valor > 0 ? valor : rechazarValor(nombre);
}

function rechazarValor(nombre: string): never {
  throw new Error(`${nombre} debe ser un entero positivo.`);
}
