import { Injectable } from '@angular/core';
import { Propiedad } from '../models/propiedad.model';
import { Valoracion } from '../models/valoracion.model';
import {
  Heredero,
  PropiedadAsignada,
  ConfiguracionReparto,
  EstadisticasReparto
} from '../models/reparto.model';

/**
 * Servicio para gestionar el reparto de herencia entre herederos
 */
@Injectable({
  providedIn: 'root'
})
export class RepartoService {

  constructor() { }

  /**
   * Inicializa herederos vacíos
   */
  inicializarHerederos(numeroHerederos: number): Heredero[] {
    const herederos: Heredero[] = [];
    for (let i = 0; i < numeroHerederos; i++) {
      herederos.push({
        id: i + 1,
        nombre: `Heredero ${i + 1}`,
        propiedades: [],
        valorTotal: 0,
        superficieTotal: 0,
        cantidadRusticas: 0,
        cantidadUrbanas: 0
      });
    }
    return herederos;
  }

  /**
   * Asigna una propiedad a un heredero
   */
  asignarPropiedad(
    heredero: Heredero,
    propiedad: Propiedad,
    valoracion: Valoracion
  ): void {
    const propiedadAsignada = this.crearPropiedadAsignada(propiedad, valoracion);

    heredero.propiedades.push(propiedadAsignada);
    this.recalcularTotales(heredero);
  }

  /**
   * Quita una propiedad de un heredero
   */
  quitarPropiedad(
    heredero: Heredero,
    propiedad: Propiedad
  ): void {
    const index = heredero.propiedades.findIndex(
      p => p.propiedad.referencia_catastral === propiedad.referencia_catastral
    );

    if (index !== -1) {
      heredero.propiedades.splice(index, 1);
      this.recalcularTotales(heredero);
    }
  }

  /**
   * Mueve una propiedad de un heredero a otro
   */
  moverPropiedad(
    propiedadAsignada: PropiedadAsignada,
    herederoOrigen: Heredero,
    herederoDestino: Heredero
  ): void {
    this.quitarPropiedad(herederoOrigen, propiedadAsignada.propiedad);
    herederoDestino.propiedades.push(propiedadAsignada);
    this.recalcularTotales(herederoDestino);
  }

  /**
   * Crea una propiedad asignada con su valoración
   */
  private crearPropiedadAsignada(
    propiedad: Propiedad,
    valoracion: Valoracion
  ): PropiedadAsignada {
    const tipo = this.determinarTipo(propiedad);
    const superficie = this.calcularSuperficie(propiedad);

    return {
      propiedad,
      valoracion,
      valor: valoracion.valor_estimado_euros || 0,
      superficie,
      tipo
    };
  }

  /**
   * Determina si es rústico o urbano
   */
  private determinarTipo(propiedad: Propiedad): 'rustico' | 'urbano' {
    const clase = propiedad.datos_inmueble?.clase?.toLowerCase() || '';
    if (clase.includes('rústico') || clase.includes('rustico')) {
      return 'rustico';
    }
    return 'urbano';
  }

  /**
   * Calcula la superficie total de una propiedad
   */
  private calcularSuperficie(propiedad: Propiedad): number {
    if (propiedad.cultivos && propiedad.cultivos.length > 0) {
      return propiedad.cultivos.reduce((sum, c) => sum + (c.superficie_m2 || 0), 0) / 10000; // Convertir a hectáreas
    }
    return (propiedad.datos_inmueble?.superficie_construida || 0) / 10000;
  }

  /**
   * Recalcula los totales de un heredero
   */
  private recalcularTotales(heredero: Heredero): void {
    heredero.valorTotal = 0;
    heredero.superficieTotal = 0;
    heredero.cantidadRusticas = 0;
    heredero.cantidadUrbanas = 0;

    heredero.propiedades.forEach(p => {
      heredero.valorTotal += p.valor;
      heredero.superficieTotal += p.superficie;
      if (p.tipo === 'rustico') {
        heredero.cantidadRusticas++;
      } else {
        heredero.cantidadUrbanas++;
      }
    });
  }

  /**
   * Realiza el reparto automático de propiedades
   * Algoritmo: Balanceo por valor y tipo usando greedy approach optimizado
   */
  repartirAutomaticamente(
    propiedades: Propiedad[],
    valoraciones: Valoracion[],
    config: ConfiguracionReparto
  ): Heredero[] {
    // Inicializar herederos
    const herederos = this.inicializarHerederos(config.numeroHerederos);

    // Filtrar propiedades que no deben ser ignoradas en el reparto
    const propiedadesParaReparto = propiedades.filter(p => !p.ignorarReparto);

    // Crear lista de propiedades asignables
    const propiedadesAsignables: PropiedadAsignada[] = propiedadesParaReparto
      .map(p => {
        const valoracion = valoraciones.find(v => v.referencia_catastral === p.referencia_catastral);
        if (!valoracion) return null;
        return this.crearPropiedadAsignada(p, valoracion);
      })
      .filter(p => p !== null) as PropiedadAsignada[];

    if (config.criterioBalance === 'mixto') {
      // Algoritmo de balanceo mixto: primero por tipo, luego por valor
      this.balanceoMixto(propiedadesAsignables, herederos);
    } else {
      // Algoritmo de balanceo por valor únicamente
      this.balanceoPorValor(propiedadesAsignables, herederos);
    }

    return herederos;
  }

  /**
   * Algoritmo de balanceo mixto (tipo + valor)
   */
  private balanceoMixto(
    propiedades: PropiedadAsignada[],
    herederos: Heredero[]
  ): void {
    // Separar por tipo
    const rusticas = propiedades.filter(p => p.tipo === 'rustico')
      .sort((a, b) => b.valor - a.valor); // Ordenar de mayor a menor

    const urbanas = propiedades.filter(p => p.tipo === 'urbano')
      .sort((a, b) => b.valor - a.valor);

    // Distribuir rústicas de forma balanceada
    this.distribuirPropiedades(rusticas, herederos);

    // Distribuir urbanas de forma balanceada
    this.distribuirPropiedades(urbanas, herederos);
  }

  /**
   * Algoritmo de balanceo solo por valor
   */
  private balanceoPorValor(
    propiedades: PropiedadAsignada[],
    herederos: Heredero[]
  ): void {
    // Ordenar propiedades de mayor a menor valor
    const propiedadesOrdenadas = [...propiedades].sort((a, b) => b.valor - a.valor);

    // Distribuir usando greedy approach
    this.distribuirPropiedades(propiedadesOrdenadas, herederos);
  }

  /**
   * Distribuye propiedades usando algoritmo greedy
   * Siempre asigna al heredero con menor valor total
   */
  private distribuirPropiedades(
    propiedades: PropiedadAsignada[],
    herederos: Heredero[]
  ): void {
    propiedades.forEach(propiedad => {
      // Encontrar el heredero con menor valor total
      const herederoMenor = herederos.reduce((min, h) =>
        h.valorTotal < min.valorTotal ? h : min
      );

      // Asignar propiedad
      herederoMenor.propiedades.push(propiedad);
      this.recalcularTotales(herederoMenor);
    });
  }

  /**
   * Calcula estadísticas del reparto
   */
  calcularEstadisticas(
    herederos: Heredero[],
    porcentajeMaximo: number = 10
  ): EstadisticasReparto {
    if (herederos.length === 0) {
      return this.estadisticasVacias();
    }

    const valores = herederos.map(h => h.valorTotal);
    const valorTotal = valores.reduce((sum, v) => sum + v, 0);
    const valorPromedio = valorTotal / herederos.length;

    // Desviación estándar
    const varianza = valores.reduce((sum, v) => sum + Math.pow(v - valorPromedio, 2), 0) / herederos.length;
    const desviacionEstandar = Math.sqrt(varianza);
    const desviacionPorcentual = valorPromedio > 0 ? (desviacionEstandar / valorPromedio) * 100 : 0;

    // Máximo y mínimo
    const valorMaximo = Math.max(...valores);
    const valorMinimo = Math.min(...valores);
    const diferenciaMaxMin = valorMaximo - valorMinimo;

    // Herederos con mayor y menor valor
    const herederoMayor = herederos.reduce((max, h) => h.valorTotal > max.valorTotal ? h : max);
    const herederoMenor = herederos.reduce((min, h) => h.valorTotal < min.valorTotal ? h : min);

    // Verificar si está equilibrado
    const porcentajeDiferencia = valorPromedio > 0 ? (diferenciaMaxMin / valorPromedio) * 100 : 0;
    const equilibrado = porcentajeDiferencia <= porcentajeMaximo;

    return {
      valorTotal,
      valorPromedioPorHeredero: valorPromedio,
      desviacionEstandar,
      desviacionPorcentual,
      diferenciaMaxMin,
      herederoMayor: { id: herederoMayor.id, valor: herederoMayor.valorTotal },
      herederoMenor: { id: herederoMenor.id, valor: herederoMenor.valorTotal },
      equilibrado
    };
  }

  /**
   * Estadísticas vacías por defecto
   */
  private estadisticasVacias(): EstadisticasReparto {
    return {
      valorTotal: 0,
      valorPromedioPorHeredero: 0,
      desviacionEstandar: 0,
      desviacionPorcentual: 0,
      diferenciaMaxMin: 0,
      herederoMayor: { id: 0, valor: 0 },
      herederoMenor: { id: 0, valor: 0 },
      equilibrado: true
    };
  }

  /**
   * Resetea el reparto eliminando todas las asignaciones
   */
  resetearReparto(herederos: Heredero[]): void {
    herederos.forEach(h => {
      h.propiedades = [];
      this.recalcularTotales(h);
    });
  }

  /**
   * Busca una propiedad en los herederos
   */
  buscarPropiedadEnHerederos(
    referencia: string,
    herederos: Heredero[]
  ): { heredero: Heredero, propiedad: PropiedadAsignada } | null {
    for (const heredero of herederos) {
      const propiedad = heredero.propiedades.find(
        p => p.propiedad.referencia_catastral === referencia
      );
      if (propiedad) {
        return { heredero, propiedad };
      }
    }
    return null;
  }
}
