/**
 * Modelos para propiedades catastrales
 */

export interface Localizacion {
  provincia: string;
  municipio: string;
  partida?: string;
  poligono?: string;
  parcela?: string;
  texto_completo?: string;
}

export interface DatosInmueble {
  clase: string;
  uso_principal: string;
  superficie_construida: number;
}

export interface Cultivo {
  subparcela: string;
  cultivo_aprovechamiento: string;
  intensidad_productiva: string;
  superficie_m2: number;
}

export interface ParcelaCatastral {
  superficie_gráfica?: string;
  [key: string]: any;
}

export interface ValorReferenciaOficial {
  valor_referencia: number;
  fecha_referencia?: string;
}

export interface DatosCatastrales {
  valor_catastral: number;
  valor_suelo?: number;
  valor_construccion?: number;
}

export interface Propiedad {
  referencia_catastral: string;
  fecha_extraccion?: string;
  url_consultada?: string;
  localizacion: Localizacion;
  datos_inmueble: DatosInmueble;
  cultivos?: Cultivo[];
  parcela_catastral?: ParcelaCatastral;
  datos_catastrales?: DatosCatastrales;
  valor_referencia_oficial?: ValorReferenciaOficial;
}
