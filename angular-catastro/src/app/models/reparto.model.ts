import { Propiedad } from './propiedad.model';
import { Valoracion } from './valoracion.model';

/**
 * Representa a un heredero en el reparto
 */
export interface Heredero {
  id: number;
  nombre: string;
  propiedades: PropiedadAsignada[];
  valorTotal: number;
  superficieTotal: number;
  cantidadRusticas: number;
  cantidadUrbanas: number;
}

/**
 * Propiedad asignada a un heredero con su valoración
 */
export interface PropiedadAsignada {
  propiedad: Propiedad;
  valoracion: Valoracion;
  valor: number;
  superficie: number;
  tipo: 'rustico' | 'urbano';
}

/**
 * Configuración del reparto
 */
export interface ConfiguracionReparto {
  numeroHerederos: number;
  criterioBalance: 'valor' | 'mixto'; // 'valor' = solo valor, 'mixto' = valor + tipo propiedad
  permitirDesequilibrio: boolean; // Permitir desequilibrio si no se puede balancear perfectamente
  porcentajeDesequilibrioMaximo: number; // % máximo de desequilibrio permitido (ej: 10%)
}

/**
 * Resultado del análisis de reparto
 */
export interface EstadisticasReparto {
  valorTotal: number;
  valorPromedioPorHeredero: number;
  desviacionEstandar: number;
  desviacionPorcentual: number;
  diferenciaMaxMin: number;
  herederoMayor: { id: number, valor: number };
  herederoMenor: { id: number, valor: number };
  equilibrado: boolean; // Si está dentro del porcentaje de desequilibrio permitido
}
