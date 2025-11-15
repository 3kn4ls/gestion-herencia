/**
 * Modelos para propiedades catastrales
 */

export interface Localizacion {
  provincia?: string;
  municipio?: string;
  partida?: string;
  poligono?: string;
  parcela?: string;
  texto_completo?: string;
}

export interface DatosInmueble {
  clase?: string;
  uso_principal?: string;
  superficie_construida?: number;
  año_construccion?: string;
}

export interface Cultivo {
  subparcela?: string;
  cultivo_aprovechamiento?: string;
  intensidad_productiva?: string;
  superficie_m2?: number;
}

export interface ParcelaCatastral {
  superficie_gráfica?: string;
  [key: string]: any;
}

export interface Propiedad {
  referencia_catastral?: string;
  fecha_extraccion?: string;
  url_consultada?: string;
  localizacion?: Localizacion;
  datos_inmueble?: DatosInmueble;
  cultivos?: Cultivo[];
  parcela_catastral?: ParcelaCatastral;
  valor_referencia?: number | null;
  escritura?: string;
  // Nuevos campos personalizados
  desc?: string;              // Descripción de la parcela
  precioManual?: number;      // Precio manual para valoración personalizada
  distanciaMar?: number;      // Distancia al mar en metros
}
