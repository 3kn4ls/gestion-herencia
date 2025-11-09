import { Injectable } from '@angular/core';
import { Propiedad, Cultivo } from '../models/propiedad.model';
import { Valoracion, DetalleCultivo, ResultadoValoracion } from '../models/valoracion.model';
import { CriteriosValoracion, CriteriosCultivo } from '../models/criterios.model';

/**
 * Servicio de valoración de propiedades
 * Replica la lógica del backend Python en TypeScript
 */
@Injectable({
  providedIn: 'root'
})
export class ValoracionService {

  constructor() { }

  /**
   * Valora un conjunto de propiedades usando los criterios proporcionados
   */
  valorarPropiedades(propiedades: Propiedad[], criterios: CriteriosValoracion): ResultadoValoracion {
    const valoraciones: Valoracion[] = [];
    let valorTotalEstimado = 0;

    for (const propiedad of propiedades) {
      const valoracion = this.valorarPropiedad(propiedad, criterios);
      if (valoracion) {
        valoraciones.push(valoracion);
        valorTotalEstimado += valoracion.valor_estimado_euros;
      }
    }

    return {
      valoraciones,
      total_propiedades: propiedades.length,
      valor_total_estimado: valorTotalEstimado,
      fecha_calculo: new Date().toISOString()
    };
  }

  /**
   * Valora una propiedad individual
   */
  private valorarPropiedad(propiedad: Propiedad, criterios: CriteriosValoracion): Valoracion | null {
    const clase = propiedad.datos_inmueble?.clase?.toLowerCase() || '';

    if (clase.includes('rústico') || clase.includes('rustico')) {
      return this.valorarRustico(propiedad, criterios);
    } else if (clase.includes('urbano')) {
      return this.valorarUrbano(propiedad);
    }

    return null;
  }

  /**
   * Valoración de inmuebles rústicos
   */
  private valorarRustico(propiedad: Propiedad, criterios: CriteriosValoracion): Valoracion {
    const ambito = this.identificarAmbito(propiedad, criterios);
    const preciosRustico = ambito?.precios_rustico || criterios.ambitos[0].precios_rustico;

    const detallesCultivos: DetalleCultivo[] = [];
    let valorTotal = 0;
    let superficieTotalHa = 0;

    // Si tiene cultivos definidos, valorar cada uno
    if (propiedad.cultivos && propiedad.cultivos.length > 0) {
      for (const cultivo of propiedad.cultivos) {
        const tipoCultivo = this.identificarTipoCultivo(cultivo.cultivo_aprovechamiento);
        const superficieHa = parseFloat(cultivo.superficie_m2.toString()) / 10000;
        const precioHa = (preciosRustico as any)[tipoCultivo] || preciosRustico.default;
        const valorCultivo = superficieHa * precioHa;

        detallesCultivos.push({
          cultivo: cultivo.cultivo_aprovechamiento,
          superficie_ha: parseFloat(superficieHa.toFixed(4)),
          precio_ha: precioHa,
          valor_estimado: parseFloat(valorCultivo.toFixed(2))
        });

        valorTotal += valorCultivo;
        superficieTotalHa += superficieHa;
      }
    } else {
      // Sin información de cultivos, usar superficie general
      const superficie = propiedad.datos_inmueble?.superficie_construida || 0;
      const superficieHa = superficie / 10000;
      const precioHa = preciosRustico.default;
      valorTotal = superficieHa * precioHa;
      superficieTotalHa = superficieHa;
    }

    return {
      referencia_catastral: propiedad.referencia_catastral,
      tipo_inmueble: 'rústico',
      valor_estimado_euros: parseFloat(valorTotal.toFixed(2)),
      metodo_valoracion: 'superficie_x_precio_hectarea',
      detalles_cultivos: detallesCultivos,
      superficie_total_ha: parseFloat(superficieTotalHa.toFixed(4)),
      valor_por_ha: superficieTotalHa > 0 ? parseFloat((valorTotal / superficieTotalHa).toFixed(2)) : 0
    };
  }

  /**
   * Valoración de inmuebles urbanos
   */
  private valorarUrbano(propiedad: Propiedad): Valoracion {
    const valorCatastral = propiedad.datos_catastrales?.valor_catastral || 0;
    const coeficiente = 0.5; // Coeficiente multiplicador por defecto

    return {
      referencia_catastral: propiedad.referencia_catastral,
      tipo_inmueble: 'urbano',
      valor_estimado_euros: parseFloat((valorCatastral * coeficiente).toFixed(2)),
      metodo_valoracion: 'valor_catastral_x_coeficiente'
    };
  }

  /**
   * Identifica el ámbito territorial según el municipio
   */
  private identificarAmbito(propiedad: Propiedad, criterios: CriteriosValoracion) {
    const municipio = propiedad.localizacion?.municipio?.toLowerCase().trim() || '';

    for (const ambito of criterios.ambitos) {
      if (ambito.municipios.some(m => m.toLowerCase() === municipio)) {
        return ambito;
      }
    }

    // Fallback al primer ámbito
    return criterios.ambitos[0];
  }

  /**
   * Identifica el tipo de cultivo a partir del código catastral
   * Replica la lógica de identificar_tipo_cultivo de Python
   */
  private identificarTipoCultivo(textoCultivo: string): string {
    const texto = textoCultivo.trim();
    const textoLower = texto.toLowerCase();

    // Extraer código catastral (primeros caracteres antes del espacio)
    const codigo = texto.split(' ')[0]?.toUpperCase() || '';

    // MAPEO DIRECTO DE CÓDIGOS CATASTRALES OFICIALES
    const esRegadio = textoLower.includes('regadio') || textoLower.includes('regadío');

    // Códigos exactos sin variantes
    const MAPEO_EXACTO: { [key: string]: string } = {
      'MM': 'pinar_maderable',
      'MT': 'matorral',
      'I-': 'improductivo',
      'E-': 'pastos',
      'NR': 'citricos_regadio'
    };

    if (MAPEO_EXACTO[codigo]) {
      return MAPEO_EXACTO[codigo];
    }

    // Códigos con variantes regadío/secano
    if (codigo === 'O-') {
      return esRegadio ? 'olivar_regadio' : 'olivar_secano';
    }

    if (codigo === 'F-') {
      return esRegadio ? 'almendro_regadio' : 'almendro_secano';
    }

    if (codigo === 'CR' || codigo === 'CL') {
      return esRegadio ? 'labor_regadio' : 'labor_secano';
    }

    // FALLBACK: Búsqueda por palabras clave
    if (textoLower.includes('oliv')) {
      return esRegadio ? 'olivar_regadio' : 'olivar_secano';
    }

    if (textoLower.includes('almendr') || textoLower.includes('fruto') || textoLower.includes('seco')) {
      return esRegadio ? 'almendro_regadio' : 'almendro_secano';
    }

    if (textoLower.includes('viñ') || textoLower.includes('vid')) {
      return esRegadio ? 'vina_regadio' : 'vina_secano';
    }

    if (textoLower.includes('cítric') || textoLower.includes('citric') || textoLower.includes('agrio') || textoLower.includes('naranj')) {
      return 'citricos_regadio';
    }

    if (textoLower.includes('labor') || textoLower.includes('labradío')) {
      return esRegadio ? 'labor_regadio' : 'labor_secano';
    }

    if (textoLower.includes('pasto') || textoLower.includes('prado')) {
      return 'pastos';
    }

    if (textoLower.includes('pinar') || textoLower.includes('madera')) {
      return 'pinar_maderable';
    }

    if (textoLower.includes('matorral') || textoLower.includes('monte bajo')) {
      return 'matorral';
    }

    if (textoLower.includes('improductivo') || textoLower.includes('erial')) {
      return 'improductivo';
    }

    if (textoLower.includes('cereal') || textoLower.includes('trigo') || textoLower.includes('cebada')) {
      return esRegadio ? 'cereal_regadio' : 'cereal_secano';
    }

    if (textoLower.includes('horta') || textoLower.includes('huert')) {
      return 'horticola_regadio';
    }

    if (textoLower.includes('arroz')) {
      return 'arroz_regadio';
    }

    if (textoLower.includes('forestal') || textoLower.includes('bosque')) {
      return 'forestal';
    }

    // Default
    return 'default';
  }
}
