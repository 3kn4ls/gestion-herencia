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
 * Servicio para carga y gestión de datos
 */
@Injectable({
  providedIn: 'root'
})
export class DataService {

  constructor(private http: HttpClient) { }

  /**
   * Carga las propiedades desde el archivo por defecto
   */
  cargarPropiedades(): Observable<Propiedad[]> {
    return this.http.get<any[]>('assets/datos_catastrales_mergeados.json').pipe(
      map(data => {
        return data.map((p: any) => this.normalizarPropiedad(p));
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

    // Extraer superficie numérica
    let superficie = 0;
    if (parcela.superficie_gráfica) {
      const match = parcela.superficie_gráfica.match(/[\d.,]+/);
      if (match) {
        superficie = parseFloat(match[0].replace('.', '').replace(',', '.'));
      }
    }

    // Normalizar cultivos: convertir superficie_m2 de string a number
    const cultivos = (prop.cultivos || []).map((c: any) => ({
      subparcela: c.subparcela,
      cultivo_aprovechamiento: c.cultivo_aprovechamiento,
      intensidad_productiva: c.intensidad_productiva,
      superficie_m2: parseFloat(c.superficie_m2 || '0')
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
}
