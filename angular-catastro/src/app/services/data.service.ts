import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';
import { Propiedad } from '../models/propiedad.model';

/**
 * Interfaz para los valores de tasación
 */
export interface ValoresTasacion {
  descripcion: string;
  fecha: string;
  municipios: {
    [municipio: string]: {
      codigo_ath: string;
      provincia: string;
      alias_de?: string;
      cultivos: {
        [codigo: string]: {
          codigo: string;
          uso_catastral: string;
          valor_por_hectarea: number;
          descripcion: string;
        };
      };
    };
  };
  valores_por_defecto: {
    codigo: string;
    uso_catastral: string;
    valor_por_hectarea: number;
    descripcion: string;
  };
}

/**
 * Interfaz para los valores personalizados de propiedades (m2_escritura, ignorarReparto)
 */
export interface PropiedadPersonalizada {
  m2_escritura?: number;
  ignorarReparto?: boolean;
}

/**
 * Servicio para carga y gestión de datos
 */
@Injectable({
  providedIn: 'root'
})
export class DataService {
  private readonly STORAGE_KEY = 'propiedades_personalizadas';

  constructor(private http: HttpClient) { }

  /**
   * Obtiene los valores personalizados de propiedades desde localStorage
   */
  getPropiedadesPersonalizadas(): { [referencia: string]: PropiedadPersonalizada } {
    const stored = localStorage.getItem(this.STORAGE_KEY);
    return stored ? JSON.parse(stored) : {};
  }

  /**
   * Guarda los valores personalizados de una propiedad
   */
  guardarPropiedadPersonalizada(referencia: string, valores: PropiedadPersonalizada): void {
    const personalizadas = this.getPropiedadesPersonalizadas();
    personalizadas[referencia] = { ...personalizadas[referencia], ...valores };
    localStorage.setItem(this.STORAGE_KEY, JSON.stringify(personalizadas));
  }

  /**
   * Aplica los valores personalizados a las propiedades cargadas
   */
  private aplicarValoresPersonalizados(propiedades: Propiedad[]): Propiedad[] {
    const personalizadas = this.getPropiedadesPersonalizadas();
    return propiedades.map(p => {
      const ref = p.referencia_catastral;
      if (ref && personalizadas[ref]) {
        return {
          ...p,
          m2_escritura: personalizadas[ref].m2_escritura ?? p.m2_escritura,
          ignorarReparto: personalizadas[ref].ignorarReparto ?? p.ignorarReparto
        };
      }
      return p;
    });
  }

  /**
   * Carga las propiedades desde el archivo por defecto
   */
  cargarPropiedades(): Observable<Propiedad[]> {
    return this.http.get<any[]>('assets/datos_catastrales_mergeados.json').pipe(
      map(data => {
        const propiedades = data.map((p: any) => this.normalizarPropiedad(p));
        return this.aplicarValoresPersonalizados(propiedades);
      })
    );
  }

  /**
   * Carga los valores de tasación por municipio
   */
  cargarValoresTasacion(): Observable<ValoresTasacion> {
    return this.http.get<ValoresTasacion>('assets/valores-tasacion-cultivos.json');
  }

  /**
   * Normaliza una propiedad del JSON al formato interno
   */
  private normalizarPropiedad(prop: any): Propiedad {
    const loc = prop.datos_descriptivos?.localizacion || {};
    const parcela = prop.parcela_catastral || {};

    // Extraer superficie numérica (en m2) usando parser robusto
    let superficie = 0;
    if (parcela.superficie_gráfica) {
      superficie = this.parseAreaToNumber(parcela.superficie_gráfica);
    }

    // Normalizar cultivos: convertir superficie_m2 de string a number (m2)
    const cultivos = (prop.cultivos || []).map((c: any) => ({
      subparcela: c.subparcela,
      cultivo_aprovechamiento: c.cultivo_aprovechamiento,
      intensidad_productiva: c.intensidad_productiva,
      superficie_m2: this.parseAreaToNumber(c.superficie_m2)
    }));

    return {
      referencia_catastral: prop.referencia_catastral,
      fecha_extraccion: prop.fecha_extraccion,
      url_consultada: prop.url_consultada,
      localizacion: {
        provincia: loc.provincia || '',
        municipio: loc.municipio || '',
        partida: loc.partida || '',
        poligono: loc.poligono || '',
        parcela: loc.parcela || '',
        texto_completo: loc.texto_completo || ''
      },
      datos_inmueble: {
        clase: prop.datos_descriptivos?.clase || '',
        uso_principal: prop.datos_descriptivos?.uso_principal || '',
        superficie_construida: superficie,
        año_construccion: prop.datos_descriptivos?.año_construcción
      },
      cultivos: cultivos,
      parcela_catastral: parcela,
      // Usar valor_referencia directamente del JSON
      valor_referencia: prop.valor_referencia,
      escritura: prop.escritura
    };
  }

  /**
   * Parsea una cadena con una superficie y devuelve el valor en metros cuadrados (number).
   * Soporta formatos como:
   *  - "1.197 m2"  -> 1197
   *  - "10,5"      -> 10.5
   *  - "1.234.567,89" -> 1234567.89
   *  - "1234567.89"   -> 1234567.89
   * Heurística: si existen ambos separadores (',' y '.') se toma como separador decimal el que aparece más a la derecha.
   * Si solo aparece un separador, se decide en función del número de dígitos después del separador (3 dígitos -> miles).
   */
  private parseAreaToNumber(area?: string | number): number {
    if (area == null) return 0;
    if (typeof area === 'number') return area;

  const s = String(area).trim();
  // Detectar unidad explícita: "ha" -> hectáreas
  const unitIsHa = /\bha\b|hect/i.test(s);
    const match = s.match(/[\d.,]+/);
    if (!match) return 0;

    let num = match[0];

    const hasDot = num.indexOf('.') !== -1;
    const hasComma = num.indexOf(',') !== -1;

    if (hasDot && hasComma) {
      // Ambos presentes: el que aparece más a la derecha es decimal
      const lastDot = num.lastIndexOf('.');
      const lastComma = num.lastIndexOf(',');
      if (lastComma > lastDot) {
        // coma decimal, puntos miles
        num = num.replace(/\./g, '');
        num = num.replace(/,/g, '.');
      } else {
        // punto decimal, comas miles
        num = num.replace(/,/g, '');
      }
    } else if (hasDot) {
      // Solo punto: puede ser decimal o separador de miles
      const parts = num.split('.');
      const after = parts[parts.length - 1];
      if (after.length === 3) {
        // Probablemente miles: eliminar todos los puntos
        num = num.replace(/\./g, '');
      } else {
        // Probablemente decimal, dejar punto como separador decimal
        // (si hay comas las eliminaríamos, pero no hay comas aquí)
      }
    } else if (hasComma) {
      // Solo coma: similar heurística
      const parts = num.split(',');
      const after = parts[parts.length - 1];
      if (after.length === 3) {
        // coma como separador de miles
        num = num.replace(/,/g, '');
      } else {
        // coma decimal
        num = num.replace(/,/g, '.');
      }
    }

    const parsed = parseFloat(num.replace(/\s+/g, ''));
    if (isNaN(parsed)) return 0;
    return unitIsHa ? parsed * 10000 : parsed;
  }
}
