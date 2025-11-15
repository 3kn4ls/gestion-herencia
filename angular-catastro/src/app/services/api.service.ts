import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Observable, throwError } from 'rxjs';
import { catchError, map } from 'rxjs/operators';
import { Propiedad } from '../models/propiedad.model';
import { ValoresTasacion } from './data.service';
import { Heredero, EstadisticasReparto, ConfiguracionReparto } from '../models/reparto.model';

/**
 * Interfaz de respuesta del API
 */
interface ApiResponse<T> {
  success: boolean;
  data?: T;
  count?: number;
  error?: string;
  message?: string;
}

/**
 * Modelo de Reparto para el backend
 */
export interface RepartoBackend {
  _id?: string;
  nombre: string;
  descripcion?: string;
  herederos: Heredero[];
  configuracion: ConfiguracionReparto;
  estadisticas: EstadisticasReparto;
  fechaCreacion?: Date;
  fechaModificacion?: Date;
}

/**
 * Servicio para comunicación con el backend API
 */
@Injectable({
  providedIn: 'root'
})
export class ApiService {
  // URL base del API - se puede configurar según el entorno
  private apiUrl = '/api'; // En producción k8s, usar /api directamente
  // private apiUrl = 'http://localhost:3000/api'; // Para desarrollo local

  private httpOptions = {
    headers: new HttpHeaders({
      'Content-Type': 'application/json'
    })
  };

  constructor(private http: HttpClient) {}

  /**
   * Manejo de errores
   */
  private handleError(error: any) {
    let errorMessage = 'Ha ocurrido un error';

    if (error.error instanceof ErrorEvent) {
      // Error del lado del cliente
      errorMessage = `Error: ${error.error.message}`;
    } else {
      // Error del lado del servidor
      errorMessage = error.error?.error || error.message || errorMessage;
    }

    console.error('Error en petición API:', errorMessage);
    return throwError(() => new Error(errorMessage));
  }

  // =====================================================
  // PROPIEDADES
  // =====================================================

  /**
   * Obtener todas las propiedades
   */
  getPropiedades(): Observable<Propiedad[]> {
    return this.http.get<ApiResponse<Propiedad[]>>(`${this.apiUrl}/propiedades`)
      .pipe(
        map(response => response.data || []),
        catchError(this.handleError)
      );
  }

  /**
   * Obtener una propiedad por ID
   */
  getPropiedadById(id: string): Observable<Propiedad> {
    return this.http.get<ApiResponse<Propiedad>>(`${this.apiUrl}/propiedades/${id}`)
      .pipe(
        map(response => response.data!),
        catchError(this.handleError)
      );
  }

  /**
   * Obtener una propiedad por referencia catastral
   */
  getPropiedadByReferencia(ref: string): Observable<Propiedad> {
    return this.http.get<ApiResponse<Propiedad>>(`${this.apiUrl}/propiedades/referencia/${ref}`)
      .pipe(
        map(response => response.data!),
        catchError(this.handleError)
      );
  }

  /**
   * Crear nueva propiedad
   */
  createPropiedad(propiedad: Propiedad): Observable<Propiedad> {
    return this.http.post<ApiResponse<Propiedad>>(
      `${this.apiUrl}/propiedades`,
      propiedad,
      this.httpOptions
    ).pipe(
      map(response => response.data!),
      catchError(this.handleError)
    );
  }

  /**
   * Actualizar propiedad
   */
  updatePropiedad(id: string, propiedad: Partial<Propiedad>): Observable<Propiedad> {
    return this.http.put<ApiResponse<Propiedad>>(
      `${this.apiUrl}/propiedades/${id}`,
      propiedad,
      this.httpOptions
    ).pipe(
      map(response => response.data!),
      catchError(this.handleError)
    );
  }

  /**
   * Eliminar propiedad
   */
  deletePropiedad(id: string): Observable<void> {
    return this.http.delete<ApiResponse<void>>(`${this.apiUrl}/propiedades/${id}`)
      .pipe(
        map(() => undefined),
        catchError(this.handleError)
      );
  }

  /**
   * Buscar propiedades con filtros
   */
  searchPropiedades(filtros: any): Observable<Propiedad[]> {
    return this.http.post<ApiResponse<Propiedad[]>>(
      `${this.apiUrl}/propiedades/search`,
      filtros,
      this.httpOptions
    ).pipe(
      map(response => response.data || []),
      catchError(this.handleError)
    );
  }

  // =====================================================
  // VALORES DE TASACIÓN
  // =====================================================

  /**
   * Obtener valores de tasación
   */
  getValoresTasacion(): Observable<ValoresTasacion> {
    return this.http.get<ApiResponse<ValoresTasacion>>(`${this.apiUrl}/valores-tasacion`)
      .pipe(
        map(response => response.data!),
        catchError(this.handleError)
      );
  }

  /**
   * Actualizar valores de tasación
   */
  updateValoresTasacion(valores: ValoresTasacion): Observable<ValoresTasacion> {
    return this.http.put<ApiResponse<ValoresTasacion>>(
      `${this.apiUrl}/valores-tasacion`,
      valores,
      this.httpOptions
    ).pipe(
      map(response => response.data!),
      catchError(this.handleError)
    );
  }

  // =====================================================
  // REPARTOS
  // =====================================================

  /**
   * Obtener todos los repartos
   */
  getRepartos(): Observable<RepartoBackend[]> {
    return this.http.get<ApiResponse<RepartoBackend[]>>(`${this.apiUrl}/repartos`)
      .pipe(
        map(response => response.data || []),
        catchError(this.handleError)
      );
  }

  /**
   * Obtener un reparto por ID
   */
  getRepartoById(id: string): Observable<RepartoBackend> {
    return this.http.get<ApiResponse<RepartoBackend>>(`${this.apiUrl}/repartos/${id}`)
      .pipe(
        map(response => response.data!),
        catchError(this.handleError)
      );
  }

  /**
   * Crear nuevo reparto
   */
  createReparto(reparto: Partial<RepartoBackend>): Observable<RepartoBackend> {
    return this.http.post<ApiResponse<RepartoBackend>>(
      `${this.apiUrl}/repartos`,
      reparto,
      this.httpOptions
    ).pipe(
      map(response => response.data!),
      catchError(this.handleError)
    );
  }

  /**
   * Actualizar reparto
   */
  updateReparto(id: string, reparto: Partial<RepartoBackend>): Observable<RepartoBackend> {
    return this.http.put<ApiResponse<RepartoBackend>>(
      `${this.apiUrl}/repartos/${id}`,
      reparto,
      this.httpOptions
    ).pipe(
      map(response => response.data!),
      catchError(this.handleError)
    );
  }

  /**
   * Eliminar reparto
   */
  deleteReparto(id: string): Observable<void> {
    return this.http.delete<ApiResponse<void>>(`${this.apiUrl}/repartos/${id}`)
      .pipe(
        map(() => undefined),
        catchError(this.handleError)
      );
  }

  /**
   * Buscar repartos por nombre
   */
  searchRepartos(nombre: string): Observable<RepartoBackend[]> {
    return this.http.get<ApiResponse<RepartoBackend[]>>(`${this.apiUrl}/repartos/search/${nombre}`)
      .pipe(
        map(response => response.data || []),
        catchError(this.handleError)
      );
  }

  // =====================================================
  // HEALTH CHECK
  // =====================================================

  /**
   * Health check del backend
   */
  healthCheck(): Observable<boolean> {
    return this.http.get<ApiResponse<any>>('/health')
      .pipe(
        map(response => response.success),
        catchError(() => {
          console.warn('Backend no disponible');
          return throwError(() => new Error('Backend no disponible'));
        })
      );
  }
}
