import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, of } from 'rxjs';
import { map, catchError } from 'rxjs/operators';
import { Propiedad } from '../models/propiedad.model';
import { ApiService } from './api.service';

/**
 * Interfaz para los valores de tasación
 */
export interface ValoresTasacion {
  descripcion: string;
  fecha: string;
  fuente?: string;
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
 * Servicio para carga y gestión de datos
 * Ahora con soporte para backend API + fallback a assets
 */
@Injectable({
  providedIn: 'root'
})
export class DataService {

  private useBackend = true; // Flag para usar backend o assets

  constructor(
    private http: HttpClient,
    private apiService: ApiService
  ) { }

  /**
   * Carga las propiedades (intenta backend, fallback a assets)
   */
  cargarPropiedades(): Observable<Propiedad[]> {
    if (this.useBackend) {
      return this.apiService.getPropiedades().pipe(
        map(propiedades => propiedades.map(p => this.convertirDesdeBackend(p))),
        catchError(error => {
          console.warn('⚠️ Backend no disponible, cargando desde assets:', error.message);
          return this.cargarPropiedadesDesdeAssets();
        })
      );
    } else {
      return this.cargarPropiedadesDesdeAssets();
    }
  }

  /**
   * Carga valores de tasación (intenta backend, fallback a assets)
   */
  cargarValoresTasacion(): Observable<ValoresTasacion> {
    if (this.useBackend) {
      return this.apiService.getValoresTasacion().pipe(
        catchError(error => {
          console.warn('⚠️ Backend no disponible, cargando desde assets:', error.message);
          return this.cargarValoresTasacionDesdeAssets();
        })
      );
    } else {
      return this.cargarValoresTasacionDesdeAssets();
    }
  }

  /**
   * Carga las propiedades desde assets (fallback)
   */
  private cargarPropiedadesDesdeAssets(): Observable<Propiedad[]> {
    return this.http.get<any[]>('assets/datos_catastrales_mergeados.json').pipe(
      map(data => {
        return data.map((p: any) => this.normalizarPropiedad(p));
      })
    );
  }

  /**
   * Carga valores de tasación desde assets (fallback)
   */
  private cargarValoresTasacionDesdeAssets(): Observable<ValoresTasacion> {
    return this.http.get<ValoresTasacion>('assets/valores-tasacion-cultivos.json');
  }

  /**
   * Convierte una propiedad del formato backend al formato frontend
   */
  private convertirDesdeBackend(prop: any): Propiedad {
    // Si ya viene en formato correcto desde el backend, solo retornar
    if (prop.localizacion && prop.datos_inmueble) {
      return prop as Propiedad;
    }

    // Si viene en formato legacy, normalizar
    return this.normalizarPropiedad(prop);
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
