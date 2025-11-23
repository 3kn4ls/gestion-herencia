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
   * Nota: El valor calculado siempre refleja la valoración automática.
   * El precioManual se aplica solo en el módulo de reparto, no aquí.
   */
  private valorarPropiedad(propiedad: Propiedad, valoresTasacion: ValoresTasacion): Valoracion | null {
    const clase = propiedad.datos_inmueble?.clase?.toLowerCase() || '';

    if (clase.includes('rústico') || clase.includes('rustico')) {
      return this.valorarRustico(propiedad, valoresTasacion);
    } else if (clase.includes('urbano')) {
      return this.valorarUrbano(propiedad);
    }

    return null;
  }

  /**
   * Valoración de inmuebles rústicos basada en cultivos
   *
   * Fórmula: Vs/Ha = MV × FA × CS × FLS × CP × DE
   * Donde:
   *   MV = Valor de mercado por hectárea (del catálogo de cultivos)
   *   FA = Coeficiente de aptitud para la producción
   *   CS = Coeficiente de superficie excesiva
   *   FLS = Coeficiente de localización y socioeconómico
   *   CP = Coeficiente de concentración parcelaria
   *   DE = Coeficiente de depreciación económica
   *
   * Si un coeficiente no está definido, se trata como 1.
   */
  private valorarRustico(propiedad: Propiedad, valoresTasacion: ValoresTasacion): Valoracion {
    const municipio = this.normalizarMunicipio(propiedad.localizacion?.municipio || '');
    const valoresMunicipio = this.obtenerValoresMunicipio(municipio, valoresTasacion);

    // Obtener coeficientes agronómicos (default 1 si no están definidos)
    const FA = propiedad.coefFA ?? 1;
    const CS = propiedad.coefCS ?? 1;
    const FLS = propiedad.coefFLS ?? 1;
    const CP = propiedad.coefCP ?? 1;
    const DE = propiedad.coefDE ?? 1;

    // Factor multiplicador total de coeficientes
    const factorCoeficientes = FA * CS * FLS * CP * DE;

    const detallesCultivos: DetalleCultivo[] = [];
    let valorTotal = 0;
    let superficieTotalHa = 0;

    // Si tiene cultivos definidos, valorar cada uno
    if (propiedad.cultivos && propiedad.cultivos.length > 0) {
      for (const cultivo of propiedad.cultivos) {
        const codigo = this.extraerCodigoCatastral(cultivo.cultivo_aprovechamiento || '');
        const superficieHa = (cultivo.superficie_m2 || 0) / 10000;

        // Buscar valor de mercado por hectárea para este código (MV)
        const valorMercadoHa = valoresMunicipio.cultivos[codigo]?.valor_por_hectarea
                     || valoresTasacion.valores_por_defecto.valor_por_hectarea;

        // Aplicar fórmula: Vs/Ha = MV × FA × CS × FLS × CP × DE
        const valorAjustadoHa = valorMercadoHa * factorCoeficientes;
        const valorCultivo = superficieHa * valorAjustadoHa;

        detallesCultivos.push({
          cultivo: cultivo.cultivo_aprovechamiento || '',
          codigo_catastral: codigo,
          superficie_ha: parseFloat(superficieHa.toFixed(4)),
          precio_ha: parseFloat(valorAjustadoHa.toFixed(2)), // Precio ajustado con coeficientes
          valor_estimado: parseFloat(valorCultivo.toFixed(2)),
          municipio: municipio
        });

        valorTotal += valorCultivo;
        superficieTotalHa += superficieHa;
      }
    } else {
      // Sin información de cultivos, usar valor por defecto con coeficientes
      const superficie = propiedad.datos_inmueble?.superficie_construida || 0;
      const superficieHa = superficie / 10000;
      const valorMercadoHa = valoresTasacion.valores_por_defecto.valor_por_hectarea;
      const valorAjustadoHa = valorMercadoHa * factorCoeficientes;
      valorTotal = superficieHa * valorAjustadoHa;
      superficieTotalHa = superficieHa;
    }

    return {
      referencia_catastral: propiedad.referencia_catastral || '',
      tipo_inmueble: 'rústico',
      valor_estimado_euros: parseFloat(valorTotal.toFixed(2)),
      metodo_valoracion: 'superficie_x_precio_hectarea_catastral_con_coeficientes',
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
