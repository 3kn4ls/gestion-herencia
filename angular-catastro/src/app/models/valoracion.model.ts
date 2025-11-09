/**
 * Modelos para resultados de valoración
 */

export interface DetalleCultivo {
  cultivo: string;
  superficie_ha: number;
  precio_ha: number;
  valor_estimado: number;
}

export interface Valoracion {
  referencia_catastral: string;
  tipo_inmueble: string;
  valor_estimado_euros: number;
  metodo_valoracion: string;
  detalles_cultivos?: DetalleCultivo[];
  superficie_total_ha?: number;
  valor_por_ha?: number;
}

export interface ResultadoValoracion {
  valoraciones: Valoracion[];
  total_propiedades: number;
  valor_total_estimado: number;
  fecha_calculo: string;
}
