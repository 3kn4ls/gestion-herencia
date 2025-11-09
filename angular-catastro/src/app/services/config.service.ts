import { Injectable } from '@angular/core';
import { BehaviorSubject, Observable } from 'rxjs';
import { ValoresTasacion } from './data.service';

const STORAGE_KEY = 'valores_tasacion_custom';

/**
 * Servicio para gestionar la configuración de valores de tasación
 * Permite editar y persistir valores personalizados
 */
@Injectable({
  providedIn: 'root'
})
export class ConfigService {

  private valoresSubject = new BehaviorSubject<ValoresTasacion | null>(null);
  public valores$ = this.valoresSubject.asObservable();

  constructor() {
    this.cargarValoresGuardados();
  }

  /**
   * Establece los valores de tasación (por defecto o personalizados)
   */
  setValores(valores: ValoresTasacion): void {
    this.valoresSubject.next(valores);
  }

  /**
   * Obtiene los valores actuales
   */
  getValores(): ValoresTasacion | null {
    return this.valoresSubject.value;
  }

  /**
   * Guarda valores personalizados en localStorage
   */
  guardarValoresPersonalizados(valores: ValoresTasacion): void {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(valores));
      this.valoresSubject.next(valores);
      console.log('✅ Valores de tasación guardados');
    } catch (error) {
      console.error('❌ Error al guardar valores:', error);
    }
  }

  /**
   * Carga valores guardados desde localStorage
   */
  private cargarValoresGuardados(): void {
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      if (stored) {
        const valores = JSON.parse(stored);
        this.valoresSubject.next(valores);
        console.log('✅ Valores personalizados cargados desde localStorage');
      }
    } catch (error) {
      console.error('❌ Error al cargar valores guardados:', error);
    }
  }

  /**
   * Verifica si hay valores personalizados guardados
   */
  tieneValoresPersonalizados(): boolean {
    return localStorage.getItem(STORAGE_KEY) !== null;
  }

  /**
   * Resetea a valores por defecto (elimina personalizados)
   */
  resetearADefecto(): void {
    try {
      localStorage.removeItem(STORAGE_KEY);
      this.valoresSubject.next(null);
      console.log('✅ Valores reseteados a por defecto');
    } catch (error) {
      console.error('❌ Error al resetear valores:', error);
    }
  }

  /**
   * Obtiene información sobre si se están usando valores personalizados
   */
  getEstado(): { personalizado: boolean, fecha?: string } {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored) {
      try {
        const valores = JSON.parse(stored);
        return {
          personalizado: true,
          fecha: valores.fecha || 'Desconocida'
        };
      } catch {
        return { personalizado: false };
      }
    }
    return { personalizado: false };
  }
}
