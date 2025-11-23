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
  ano_construccion?: string;
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
  codGrupo?: string;          // Código de grupo para agrupar propiedades en reparto
  precioValidado?: boolean;   // Indica si el precio ha sido validado
  m2Escritura?: number;       // Metros cuadrados de la escritura (manual)
  ignorarReparto?: boolean;   // Ignorar esta propiedad en el reparto automático

  // Coeficientes agronómicos para valoración de fincas rústicas
  coefFA?: number;            // FA - Coeficiente de aptitud para la producción (default: 1)
  coefCS?: number;            // CS - Coeficiente de superficie excesiva (default: 1)
  coefFLS?: number;           // FLS - Coeficiente de localización y socioeconómico (default: 1)
  coefCP?: number;            // CP - Coeficiente de concentración parcelaria (default: 1)
  coefDE?: number;            // DE - Coeficiente de depreciación económica (default: 1)
}
