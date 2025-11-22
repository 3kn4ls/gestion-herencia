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
   * Agrupa propiedades por código de grupo
   * @returns Objeto con grupos (propiedades agrupadas) y propiedades individuales (sin grupo)
   */
  private agruparPorCodigo(propiedades: PropiedadAsignada[]): {
    grupos: PropiedadAsignada[][],
    propiedadesIndividuales: PropiedadAsignada[]
  } {
    // Mapa para agrupar por codGrupo
    const gruposMap = new Map<string, PropiedadAsignada[]>();
    const individuales: PropiedadAsignada[] = [];

    propiedades.forEach(p => {
      const codGrupo = p.propiedad.codGrupo?.trim();

      if (codGrupo) {
        // Tiene código de grupo - agrupar
        if (!gruposMap.has(codGrupo)) {
          gruposMap.set(codGrupo, []);
        }
        gruposMap.get(codGrupo)!.push(p);
      } else {
        // Sin código de grupo - tratar individualmente
        individuales.push(p);
      }
    });

    // Convertir el mapa a array de grupos
    const grupos = Array.from(gruposMap.values());

    return { grupos, propiedadesIndividuales: individuales };
  }

  /**
   * Calcula el valor total de un grupo de propiedades
   */
  private calcularValorGrupo(grupo: PropiedadAsignada[]): number {
    return grupo.reduce((sum, p) => sum + p.valor, 0);
  }

  /**
   * Balanceo mixto que respeta grupos de propiedades
   */
  private balanceoMixtoConGrupos(
    grupos: PropiedadAsignada[][],
    propiedadesIndividuales: PropiedadAsignada[],
    herederos: Heredero[]
  ): void {
    // Separar grupos por tipo mayoritario
    const gruposRusticos = grupos.filter(g => {
      const rusticas = g.filter(p => p.tipo === 'rustico').length;
      return rusticas > g.length / 2;
    }).sort((a, b) => this.calcularValorGrupo(b) - this.calcularValorGrupo(a));

    const gruposUrbanos = grupos.filter(g => {
      const rusticas = g.filter(p => p.tipo === 'rustico').length;
      return rusticas <= g.length / 2;
    }).sort((a, b) => this.calcularValorGrupo(b) - this.calcularValorGrupo(a));

    // Separar propiedades individuales por tipo
    const rusticasInd = propiedadesIndividuales.filter(p => p.tipo === 'rustico')
      .sort((a, b) => b.valor - a.valor);

    const urbanasInd = propiedadesIndividuales.filter(p => p.tipo === 'urbano')
      .sort((a, b) => b.valor - a.valor);

    // Distribuir grupos rústicos
    gruposRusticos.forEach(grupo => this.asignarGrupo(grupo, herederos));

    // Distribuir propiedades rústicas individuales
    this.distribuirPropiedades(rusticasInd, herederos);

    // Distribuir grupos urbanos
    gruposUrbanos.forEach(grupo => this.asignarGrupo(grupo, herederos));

    // Distribuir propiedades urbanas individuales
    this.distribuirPropiedades(urbanasInd, herederos);
  }

  /**
   * Balanceo por valor que respeta grupos de propiedades
   */
  private balanceoPorValorConGrupos(
    grupos: PropiedadAsignada[][],
    propiedadesIndividuales: PropiedadAsignada[],
    herederos: Heredero[]
  ): void {
    // Ordenar grupos por valor total (mayor a menor)
    const gruposOrdenados = grupos.sort((a, b) =>
      this.calcularValorGrupo(b) - this.calcularValorGrupo(a)
    );

    // Ordenar propiedades individuales por valor
    const individualesOrdenadas = propiedadesIndividuales.sort((a, b) => b.valor - a.valor);

    // Mezclar grupos e individuales en una lista ordenada por valor
    const todosMezclados: (PropiedadAsignada | PropiedadAsignada[])[] = [];

    gruposOrdenados.forEach(g => todosMezclados.push(g));
    individualesOrdenadas.forEach(p => todosMezclados.push(p));

    // Reordenar todo por valor
    todosMezclados.sort((a, b) => {
      const valorA = Array.isArray(a) ? this.calcularValorGrupo(a) : a.valor;
      const valorB = Array.isArray(b) ? this.calcularValorGrupo(b) : b.valor;
      return valorB - valorA;
    });

    // Distribuir en orden
    todosMezclados.forEach(item => {
      if (Array.isArray(item)) {
        // Es un grupo
        this.asignarGrupo(item, herederos);
      } else {
        // Es una propiedad individual
        this.distribuirPropiedades([item], herederos);
      }
    });
  }

  /**
   * Asigna un grupo completo de propiedades al heredero con menor valor total
   */
  private asignarGrupo(grupo: PropiedadAsignada[], herederos: Heredero[]): void {
    // Encontrar el heredero con menor valor total
    const herederoMenor = herederos.reduce((min, h) =>
      h.valorTotal < min.valorTotal ? h : min
    );

    // Asignar todas las propiedades del grupo a ese heredero
    grupo.forEach(propiedad => {
      herederoMenor.propiedades.push(propiedad);
    });

    this.recalcularTotales(herederoMenor);
  }

  /**
   * Realiza el reparto automático de propiedades
   * Algoritmo: Balanceo por valor y tipo usando greedy approach optimizado
   * Respeta grupos definidos por codGrupo (propiedades con mismo código se asignan juntas)
   * Excluye propiedades con ignorarReparto=true
   */
  repartirAutomaticamente(
    propiedades: Propiedad[],
    valoraciones: Valoracion[],
    config: ConfiguracionReparto
  ): Heredero[] {
    // Inicializar herederos
    const herederos = this.inicializarHerederos(config.numeroHerederos);

    // Crear lista de propiedades asignables (excluyendo las que tienen ignorarReparto=true)
    const propiedadesAsignables: PropiedadAsignada[] = propiedades
      // Filtrar propiedades que deben ignorarse en el reparto
      .filter(p => !p.ignorarReparto)
      .map(p => {
        const valoracion = valoraciones.find(v => v.referencia_catastral === p.referencia_catastral);
        if (!valoracion) return null;

        // Usar precio manual si existe, sino usar el calculado
        const valorFinal = p.precioManual || valoracion.valor_estimado_euros || 0;
        const tipo = this.determinarTipo(p);
        const superficie = this.calcularSuperficie(p);

        return {
          propiedad: p,
          valoracion,
          valor: valorFinal,
          superficie,
          tipo
        } as PropiedadAsignada;
      })
      .filter(p => p !== null) as PropiedadAsignada[];

    // Agrupar propiedades por codGrupo
    const { grupos, propiedadesIndividuales } = this.agruparPorCodigo(propiedadesAsignables);

    if (config.criterioBalance === 'mixto') {
      // Algoritmo de balanceo mixto: primero por tipo, luego por valor
      this.balanceoMixtoConGrupos(grupos, propiedadesIndividuales, herederos);
    } else {
      // Algoritmo de balanceo por valor únicamente
      this.balanceoPorValorConGrupos(grupos, propiedadesIndividuales, herederos);
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
