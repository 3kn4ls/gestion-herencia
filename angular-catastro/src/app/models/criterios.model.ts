/**
 * Modelos para criterios de valoración
 * Basados en NNTT 2025 GVA - Módulos de Valor ATH 1603/1613
 */

export interface CriteriosCultivo {
  olivar_secano: number;
  olivar_regadio: number;
  almendro_secano: number;
  almendro_regadio: number;
  vina_secano: number;
  vina_regadio: number;
  frutal_secano: number;
  frutal_regadio: number;
  citricos_regadio: number;
  cereal_secano: number;
  cereal_regadio: number;
  horticola_regadio: number;
  arroz_regadio?: number;
  pastos: number;
  forestal: number;
  labor_secano: number;
  labor_regadio: number;
  pinar_maderable: number;
  matorral: number;
  improductivo: number;
  default: number;
}

export interface CriteriosAmbito {
  nombre: string;
  municipios: string[];
  precios_rustico: CriteriosCultivo;
}

export interface CriteriosValoracion {
  ambitos: CriteriosAmbito[];
  version: string;
  fecha_actualizacion: string;
  fuente: string;
}
