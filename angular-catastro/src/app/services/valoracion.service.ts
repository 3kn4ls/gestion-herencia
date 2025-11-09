import { Injectable } from '@angular/core';
import { Propiedad, Cultivo } from '../models/propiedad.model';
import { Valoracion, DetalleCultivo, ResultadoValoracion } from '../models/valoracion.model';
import { ValoresTasacion } from './data.service';

/**
 * Servicio de valoración de propiedades basado en cultivos catastrales
 */
@Injectable({
  providedIn: 'root'
})
export class ValoracionService {

  constructor() { }

  /**
   * Valora un conjunto de propiedades usando los valores de tasación
   */
  valorarPropiedades(propiedades: Propiedad[], valoresTasacion: ValoresTasacion): ResultadoValoracion {
    const valoraciones: Valoracion[] = [];
    let valorTotalEstimado = 0;

    for (const propiedad of propiedades) {
      const valoracion = this.valorarPropiedad(propiedad, valoresTasacion);
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
  private valorarPropiedad(propiedad: Propiedad, valoresTasacion: ValoresTasacion): Valoracion | null {
    const clase = propiedad.datos_inmueble?.clase?.toLowerCase() || '';

    // Solo valorar propiedades rústicas
    if (clase.includes('rústico') || clase.includes('rustico')) {
      return this.valorarRustico(propiedad, valoresTasacion);
    } else if (clase.includes('urbano')) {
      return this.valorarUrbano(propiedad);
    }

    return null;
  }

  /**
   * Valoración de inmuebles rústicos basada en cultivos
   */
  private valorarRustico(propiedad: Propiedad, valoresTasacion: ValoresTasacion): Valoracion {
    const municipio = this.normalizarMunicipio(propiedad.localizacion?.municipio || '');
    const valoresMunicipio = this.obtenerValoresMunicipio(municipio, valoresTasacion);

    const detallesCultivos: DetalleCultivo[] = [];
    let valorTotal = 0;
    let superficieTotalHa = 0;

    // Si tiene cultivos definidos, valorar cada uno
    if (propiedad.cultivos && propiedad.cultivos.length > 0) {
      for (const cultivo of propiedad.cultivos) {
        const codigo = this.extraerCodigoCatastral(cultivo.cultivo_aprovechamiento || '');
        const superficieHa = (cultivo.superficie_m2 || 0) / 10000;

        // Buscar valor por hectárea para este código
        const valorHa = valoresMunicipio.cultivos[codigo]?.valor_por_hectarea
                     || valoresTasacion.valores_por_defecto.valor_por_hectarea;

        const valorCultivo = superficieHa * valorHa;

        detallesCultivos.push({
          cultivo: cultivo.cultivo_aprovechamiento || '',
          codigo_catastral: codigo,
          superficie_ha: parseFloat(superficieHa.toFixed(4)),
          precio_ha: valorHa,
          valor_estimado: parseFloat(valorCultivo.toFixed(2)),
          municipio: municipio
        });

        valorTotal += valorCultivo;
        superficieTotalHa += superficieHa;
      }
    } else {
      // Sin información de cultivos, usar valor por defecto
      const superficie = propiedad.datos_inmueble?.superficie_construida || 0;
      const superficieHa = superficie / 10000;
      const valorHa = valoresTasacion.valores_por_defecto.valor_por_hectarea;
      valorTotal = superficieHa * valorHa;
      superficieTotalHa = superficieHa;
    }

    return {
      referencia_catastral: propiedad.referencia_catastral || '',
      tipo_inmueble: 'rústico',
      valor_estimado_euros: parseFloat(valorTotal.toFixed(2)),
      metodo_valoracion: 'superficie_x_precio_hectarea_catastral',
      detalles_cultivos: detallesCultivos,
      superficie_total_ha: parseFloat(superficieTotalHa.toFixed(4)),
      valor_por_ha: superficieTotalHa > 0 ? parseFloat((valorTotal / superficieTotalHa).toFixed(2)) : 0,
      municipio: municipio
    };
  }

  /**
   * Valoración de inmuebles urbanos
   */
  private valorarUrbano(propiedad: Propiedad): Valoracion {
    // Para urbanos, usar el valor de referencia si existe
    const valorReferencia = propiedad.valor_referencia || 0;

    return {
      referencia_catastral: propiedad.referencia_catastral || '',
      tipo_inmueble: 'urbano',
      valor_estimado_euros: valorReferencia,
      metodo_valoracion: 'valor_referencia_catastral'
    };
  }

  /**
   * Extrae el código catastral del texto de cultivo
   * Ejemplos: "O- Olivos secano" -> "O-", "NR Agrios regadío" -> "NR"
   */
  private extraerCodigoCatastral(textoCultivo: string): string {
    const texto = textoCultivo.trim();

    // Buscar patrón de código catastral al inicio (2-3 caracteres)
    const match = texto.match(/^([A-Z]{1,2}[-]?)\s/);
    if (match) {
      return match[1];
    }

    // Si no encuentra patrón, tomar las primeras 2 letras
    const codigo = texto.substring(0, 2).toUpperCase();
    return codigo;
  }

  /**
   * Normaliza el nombre del municipio
   */
  private normalizarMunicipio(municipio: string): string {
    // Limpiar código postal y espacios
    let normalizado = municipio.replace(/^\d{5}\s*/, '').trim().toUpperCase();

    // Casos especiales
    const equivalencias: { [key: string]: string } = {
      'PLANES': 'PLANES',
      'VALL DE GALLINERA': 'VALL DE GALLINERA',
      'OLIVA': 'OLIVA',
      'PILES': 'PILES'
    };

    return equivalencias[normalizado] || normalizado;
  }

  /**
   * Obtiene los valores de tasación para un municipio
   */
  private obtenerValoresMunicipio(municipio: string, valoresTasacion: ValoresTasacion): any {
    const municipioNormalizado = this.normalizarMunicipio(municipio);

    // Buscar directamente
    if (valoresTasacion.municipios[municipioNormalizado]) {
      return valoresTasacion.municipios[municipioNormalizado];
    }

    // Buscar por alias
    for (const [key, value] of Object.entries(valoresTasacion.municipios)) {
      if (value.alias_de && value.alias_de === municipioNormalizado) {
        return value;
      }
    }

    // Por defecto, usar primer municipio disponible
    const primerMunicipio = Object.keys(valoresTasacion.municipios)[0];
    console.warn(`Municipio "${municipio}" no encontrado, usando valores de ${primerMunicipio}`);
    return valoresTasacion.municipios[primerMunicipio];
  }
}
