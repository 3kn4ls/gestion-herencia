import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, BehaviorSubject } from 'rxjs';
import { map } from 'rxjs/operators';
import { Propiedad } from '../models/propiedad.model';
import { CriteriosValoracion } from '../models/criterios.model';

/**
 * Servicio para carga y gestión de datos
 */
@Injectable({
  providedIn: 'root'
})
export class DataService {

  private propiedadesSubject = new BehaviorSubject<Propiedad[]>([]);
  public propiedades$ = this.propiedadesSubject.asObservable();

  private criteriosSubject = new BehaviorSubject<CriteriosValoracion | null>(null);
  public criterios$ = this.criteriosSubject.asObservable();

  constructor(private http: HttpClient) { }

  /**
   * Carga los criterios de valoración desde JSON
   */
  cargarCriterios(): Observable<CriteriosValoracion> {
    return this.http.get<CriteriosValoracion>('assets/criterios-valoracion.json').pipe(
      map(criterios => {
        this.criteriosSubject.next(criterios);
        return criterios;
      })
    );
  }

  /**
   * Carga las propiedades desde JSON
   */
  cargarPropiedades(): Observable<Propiedad[]> {
    return this.http.get<any>('assets/datos-muestra.json').pipe(
      map(data => {
        // Normalizar datos si vienen en formato del JSON original
        const propiedades = Array.isArray(data) ? data : data.propiedades || [];
        const propiedadesNormalizadas = propiedades.map((p: any) => this.normalizarPropiedad(p));
        this.propiedadesSubject.next(propiedadesNormalizadas);
        return propiedadesNormalizadas;
      })
    );
  }

  /**
   * Carga un archivo JSON subido por el usuario
   */
  cargarArchivo(file: File): Promise<Propiedad[]> {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = (e: any) => {
        try {
          const data = JSON.parse(e.target.result);
          const propiedades = Array.isArray(data) ? data : data.propiedades || [];
          const propiedadesNormalizadas = propiedades.map((p: any) => this.normalizarPropiedad(p));
          this.propiedadesSubject.next(propiedadesNormalizadas);
          resolve(propiedadesNormalizadas);
        } catch (error) {
          reject(error);
        }
      };
      reader.onerror = reject;
      reader.readAsText(file);
    });
  }

  /**
   * Normaliza una propiedad al formato estándar
   */
  private normalizarPropiedad(prop: any): Propiedad {
    // Si tiene datos_descriptivos, es formato nuevo
    if (prop.datos_descriptivos) {
      const loc = prop.datos_descriptivos.localizacion || {};
      const parcela = prop.parcela_catastral || {};

      // Extraer superficie
      let superficie = 0;
      if (parcela.superficie_gráfica) {
        const match = parcela.superficie_gráfica.match(/[\d.,]+/);
        if (match) {
          superficie = parseFloat(match[0].replace('.', '').replace(',', '.'));
        }
      }

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
          clase: prop.datos_descriptivos.clase || '',
          uso_principal: prop.datos_descriptivos.uso_principal || '',
          superficie_construida: superficie
        },
        cultivos: prop.cultivos || [],
        parcela_catastral: parcela,
        datos_catastrales: prop.datos_catastrales,
        valor_referencia_oficial: prop.valor_referencia_oficial
      };
    }

    // Formato ya normalizado o antiguo
    return {
      referencia_catastral: prop.referencia_catastral || '',
      localizacion: prop.localizacion || {},
      datos_inmueble: prop.datos_inmueble || {},
      cultivos: prop.cultivos || [],
      parcela_catastral: prop.parcela_catastral,
      datos_catastrales: prop.datos_catastrales,
      valor_referencia_oficial: prop.valor_referencia_oficial
    };
  }

  /**
   * Obtiene las propiedades actuales
   */
  getPropiedades(): Propiedad[] {
    return this.propiedadesSubject.value;
  }

  /**
   * Obtiene los criterios actuales
   */
  getCriterios(): CriteriosValoracion | null {
    return this.criteriosSubject.value;
  }

  /**
   * Actualiza los criterios de valoración
   */
  actualizarCriterios(criterios: CriteriosValoracion): void {
    this.criteriosSubject.next(criterios);
  }
}
