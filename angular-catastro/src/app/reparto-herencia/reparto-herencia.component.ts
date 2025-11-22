import { Component, Input, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { CdkDragDrop, DragDropModule, moveItemInArray, transferArrayItem } from '@angular/cdk/drag-drop';

import { Propiedad } from '../models/propiedad.model';
import { Valoracion } from '../models/valoracion.model';
import { Heredero, PropiedadAsignada, ConfiguracionReparto, EstadisticasReparto } from '../models/reparto.model';
import { RepartoService } from '../services/reparto.service';
import { ApiService, RepartoBackend } from '../services/api.service';

@Component({
  selector: 'app-reparto-herencia',
  standalone: true,
  imports: [CommonModule, FormsModule, DragDropModule],
  templateUrl: './reparto-herencia.component.html',
  styleUrls: ['./reparto-herencia.component.css']
})
export class RepartoHerenciaComponent implements OnInit {
  @Input() propiedades: Propiedad[] = [];
  @Input() valoraciones: Valoracion[] = [];

  // Estado del componente
  herederos: Heredero[] = [];
  propiedadesDisponibles: PropiedadAsignada[] = [];
  mostrarConfiguracion = true;
  estadisticas: EstadisticasReparto | null = null;

  // Configuración
  config: ConfiguracionReparto = {
    numeroHerederos: 2,
    criterioBalance: 'mixto',
    permitirDesequilibrio: true,
    porcentajeDesequilibrioMaximo: 10
  };

  // IDs para drag and drop
  listasHerederos: string[] = [];

  // Estado para guardar/cargar
  mostrarModalGuardar = false;
  mostrarModalCargar = false;
  nombreReparto = '';
  descripcionReparto = '';
  repartoActualId: string | null = null;
  repartosGuardados: RepartoBackend[] = [];

  constructor(
    private repartoService: RepartoService,
    private apiService: ApiService
  ) {}

  ngOnInit(): void {
    this.inicializarPropiedadesDisponibles();
  }

  /**
   * Inicializa las propiedades disponibles para repartir
   * Excluye propiedades con ignorarReparto=true
   */
  private inicializarPropiedadesDisponibles(): void {
    this.propiedadesDisponibles = this.propiedades
      // Filtrar propiedades que deben ignorarse en el reparto
      .filter(p => !p.ignorarReparto)
      .map(p => {
        const valoracion = this.valoraciones.find(v => v.referencia_catastral === p.referencia_catastral);
        if (!valoracion) return null;

        const tipo = this.determinarTipo(p);
        const superficie = this.calcularSuperficie(p);

        // Usar precio manual si existe, sino usar el calculado
        const valorFinal = p.precioManual || valoracion.valor_estimado_euros || 0;

        return {
          propiedad: p,
          valoracion,
          valor: valorFinal,
          superficie,
          tipo
        } as PropiedadAsignada;
      })
      .filter(p => p !== null) as PropiedadAsignada[];
  }

  /**
   * Inicia el reparto con la configuración
   */
  iniciarReparto(): void {
    if (this.config.numeroHerederos < 1 || this.config.numeroHerederos > 10) {
      alert('El número de herederos debe estar entre 1 y 10');
      return;
    }

    // Inicializar herederos
    this.herederos = this.repartoService.inicializarHerederos(this.config.numeroHerederos);

    // Crear IDs para las listas de drag & drop
    this.listasHerederos = this.herederos.map(h => `heredero-${h.id}`);
    this.listasHerederos.push('disponibles'); // Añadir la lista de disponibles

    // Resetear propiedades disponibles
    this.inicializarPropiedadesDisponibles();

    this.mostrarConfiguracion = false;
    this.calcularEstadisticas();
  }

  /**
   * Vuelve a la configuración
   */
  volverAConfiguracion(): void {
    if (confirm('¿Estás seguro? Se perderá el reparto actual.')) {
      this.mostrarConfiguracion = true;
      this.herederos = [];
      this.estadisticas = null;
      this.inicializarPropiedadesDisponibles();
    }
  }

  /**
   * Maneja el evento de drop en drag & drop
   */
  onDrop(event: CdkDragDrop<PropiedadAsignada[]>, herederoDestino?: Heredero): void {
    if (event.previousContainer === event.container) {
      // Reordenar dentro de la misma lista
      moveItemInArray(event.container.data, event.previousIndex, event.currentIndex);
    } else {
      // Mover entre listas
      const propiedad = event.previousContainer.data[event.previousIndex];

      // Quitar de la lista origen
      transferArrayItem(
        event.previousContainer.data,
        event.container.data,
        event.previousIndex,
        event.currentIndex
      );

      // Actualizar totales de herederos
      this.actualizarTotalesHerederos();
      this.calcularEstadisticas();
    }
  }

  /**
   * Actualiza los totales de todos los herederos
   */
  private actualizarTotalesHerederos(): void {
    this.herederos.forEach(h => {
      h.valorTotal = 0;
      h.superficieTotal = 0;
      h.cantidadRusticas = 0;
      h.cantidadUrbanas = 0;

      h.propiedades.forEach(p => {
        h.valorTotal += p.valor;
        h.superficieTotal += p.superficie;
        if (p.tipo === 'rustico') {
          h.cantidadRusticas++;
        } else {
          h.cantidadUrbanas++;
        }
      });
    });
  }

  /**
   * Realiza el reparto automático
   */
  repartirAutomaticamente(): void {
    if (this.propiedadesDisponibles.length === 0 && !this.tieneAlgunaPropiedadAsignada()) {
      alert('No hay propiedades para repartir');
      return;
    }

    if (confirm('¿Deseas realizar un reparto automático? Esto reemplazará el reparto actual.')) {
      // Recopilar todas las propiedades (disponibles + asignadas)
      const todasPropiedades = [...this.propiedadesDisponibles];
      this.herederos.forEach(h => {
        todasPropiedades.push(...h.propiedades);
      });

      // Resetear herederos
      this.herederos.forEach(h => {
        h.propiedades = [];
      });

      // Realizar reparto
      const propiedadesBase = todasPropiedades.map(pa => pa.propiedad);
      const herederosNuevos = this.repartoService.repartirAutomaticamente(
        propiedadesBase,
        this.valoraciones,
        this.config
      );

      // Actualizar herederos existentes con el nuevo reparto
      this.herederos = herederosNuevos;

      // Limpiar propiedades disponibles
      this.propiedadesDisponibles = [];

      this.calcularEstadisticas();
      alert('✅ Reparto automático completado');
    }
  }

  /**
   * Verifica si hay alguna propiedad asignada
   */
  private tieneAlgunaPropiedadAsignada(): boolean {
    return this.herederos.some(h => h.propiedades.length > 0);
  }

  /**
   * Resetea el reparto
   */
  resetearReparto(): void {
    if (confirm('¿Estás seguro de que deseas resetear el reparto?')) {
      this.herederos.forEach(h => {
        this.propiedadesDisponibles.push(...h.propiedades);
        h.propiedades = [];
      });

      this.actualizarTotalesHerederos();
      this.calcularEstadisticas();
    }
  }

  /**
   * Calcula las estadísticas del reparto actual
   */
  calcularEstadisticas(): void {
    this.estadisticas = this.repartoService.calcularEstadisticas(
      this.herederos,
      this.config.porcentajeDesequilibrioMaximo
    );
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
   * Calcula la superficie de una propiedad
   */
  private calcularSuperficie(propiedad: Propiedad): number {
    if (propiedad.cultivos && propiedad.cultivos.length > 0) {
      return propiedad.cultivos.reduce((sum, c) => sum + (c.superficie_m2 || 0), 0) / 10000;
    }
    return (propiedad.datos_inmueble?.superficie_construida || 0) / 10000;
  }

  /**
   * Obtiene todas las listas conectadas para drag & drop
   */
  getListasConectadas(): string[] {
    return this.listasHerederos;
  }

  /**
   * Exporta el reparto a formato de texto
   */
  exportarReparto(): void {
    if (!this.estadisticas) {
      alert('No hay datos para exportar');
      return;
    }

    let texto = '='.repeat(80) + '\n';
    texto += 'REPARTO DE HERENCIA\n';
    texto += '='.repeat(80) + '\n\n';

    texto += `Fecha: ${new Date().toLocaleDateString('es-ES')}\n`;
    texto += `Número de herederos: ${this.herederos.length}\n`;
    texto += `Valor total: ${this.formatCurrency(this.estadisticas.valorTotal)}\n`;
    texto += `Valor promedio por heredero: ${this.formatCurrency(this.estadisticas.valorPromedioPorHeredero)}\n`;
    texto += `Equilibrado: ${this.estadisticas.equilibrado ? 'Sí' : 'No'}\n\n`;

    this.herederos.forEach(h => {
      texto += '-'.repeat(80) + '\n';
      texto += `${h.nombre.toUpperCase()}\n`;
      texto += '-'.repeat(80) + '\n';
      texto += `Valor total: ${this.formatCurrency(h.valorTotal)}\n`;
      texto += `Superficie total: ${h.superficieTotal.toFixed(4)} ha\n`;
      texto += `Propiedades rústicas: ${h.cantidadRusticas}\n`;
      texto += `Propiedades urbanas: ${h.cantidadUrbanas}\n\n`;

      if (h.propiedades.length > 0) {
        texto += 'PROPIEDADES:\n';
        h.propiedades.forEach((p, idx) => {
          texto += `  ${idx + 1}. ${p.propiedad.referencia_catastral}\n`;
          texto += `     Municipio: ${p.propiedad.localizacion?.municipio || 'N/A'}\n`;
          texto += `     Tipo: ${p.tipo}\n`;
          texto += `     Valor: ${this.formatCurrency(p.valor)}\n`;
          texto += `     Superficie: ${p.superficie.toFixed(4)} ha\n\n`;
        });
      } else {
        texto += 'Sin propiedades asignadas\n\n';
      }
    });

    texto += '='.repeat(80) + '\n';
    texto += 'ESTADÍSTICAS DEL REPARTO\n';
    texto += '='.repeat(80) + '\n';
    texto += `Desviación estándar: ${this.formatCurrency(this.estadisticas.desviacionEstandar)}\n`;
    texto += `Desviación porcentual: ${this.estadisticas.desviacionPorcentual.toFixed(2)}%\n`;
    texto += `Diferencia máx-mín: ${this.formatCurrency(this.estadisticas.diferenciaMaxMin)}\n`;
    texto += `Heredero con más valor: Heredero ${this.estadisticas.herederoMayor.id} (${this.formatCurrency(this.estadisticas.herederoMayor.valor)})\n`;
    texto += `Heredero con menos valor: Heredero ${this.estadisticas.herederoMenor.id} (${this.formatCurrency(this.estadisticas.herederoMenor.valor)})\n`;

    // Copiar al portapapeles
    navigator.clipboard.writeText(texto).then(() => {
      alert('✅ Reparto exportado al portapapeles. Puedes pegarlo en un archivo de texto.');
    }).catch(err => {
      console.error('Error al copiar:', err);
      alert('❌ Error al copiar al portapapeles');
    });
  }

  // =====================================================
  // GUARDAR/CARGAR REPARTOS
  // =====================================================

  /**
   * Abre el modal para guardar reparto
   */
  abrirModalGuardar(): void {
    if (!this.estadisticas) {
      alert('No hay reparto para guardar');
      return;
    }

    if (this.herederos.every(h => h.propiedades.length === 0)) {
      alert('El reparto está vacío. Asigna propiedades antes de guardar.');
      return;
    }

    this.mostrarModalGuardar = true;
    if (!this.nombreReparto) {
      this.nombreReparto = `Reparto ${new Date().toLocaleDateString('es-ES')}`;
    }
  }

  /**
   * Guarda el reparto actual en el backend
   */
  guardarReparto(): void {
    if (!this.nombreReparto.trim()) {
      alert('Debes proporcionar un nombre para el reparto');
      return;
    }

    if (!this.estadisticas) {
      alert('No hay estadísticas calculadas');
      return;
    }

    const reparto: Partial<RepartoBackend> = {
      nombre: this.nombreReparto.trim(),
      descripcion: this.descripcionReparto.trim() || undefined,
      herederos: this.herederos,
      configuracion: this.config,
      estadisticas: this.estadisticas
    };

    // Si existe un ID, es una actualización, sino es creación
    if (this.repartoActualId) {
      this.apiService.updateReparto(this.repartoActualId, reparto).subscribe({
        next: (repartoGuardado) => {
          this.repartoActualId = repartoGuardado._id || null;
          this.mostrarModalGuardar = false;
          alert('✅ Reparto actualizado correctamente');
        },
        error: (error) => {
          console.error('Error al actualizar reparto:', error);
          alert(`❌ Error al actualizar: ${error.message}`);
        }
      });
    } else {
      this.apiService.createReparto(reparto).subscribe({
        next: (repartoGuardado) => {
          this.repartoActualId = repartoGuardado._id || null;
          this.mostrarModalGuardar = false;
          alert('✅ Reparto guardado correctamente');
        },
        error: (error) => {
          console.error('Error al guardar reparto:', error);
          alert(`❌ Error al guardar: ${error.message}`);
        }
      });
    }
  }

  /**
   * Abre el modal para cargar reparto
   */
  abrirModalCargar(): void {
    this.mostrarModalCargar = true;
    this.cargarListaRepartos();
  }

  /**
   * Carga la lista de repartos guardados
   */
  cargarListaRepartos(): void {
    this.apiService.getRepartos().subscribe({
      next: (repartos) => {
        this.repartosGuardados = repartos.sort((a, b) => {
          const dateA = a.fechaModificacion ? new Date(a.fechaModificacion).getTime() : 0;
          const dateB = b.fechaModificacion ? new Date(b.fechaModificacion).getTime() : 0;
          return dateB - dateA; // Más recientes primero
        });
      },
      error: (error) => {
        console.error('Error al cargar repartos:', error);
        alert(`❌ Error al cargar repartos: ${error.message}`);
      }
    });
  }

  /**
   * Carga un reparto seleccionado
   */
  cargarReparto(reparto: RepartoBackend): void {
    if (confirm(`¿Deseas cargar el reparto "${reparto.nombre}"? Se perderá el reparto actual.`)) {
      // Cargar configuración
      this.config = reparto.configuracion;
      this.herederos = reparto.herederos;
      this.estadisticas = reparto.estadisticas;
      this.repartoActualId = reparto._id || null;
      this.nombreReparto = reparto.nombre;
      this.descripcionReparto = reparto.descripcion || '';

      // Actualizar listas de drag & drop
      this.listasHerederos = this.herederos.map(h => `heredero-${h.id}`);
      this.listasHerederos.push('disponibles');

      // Recalcular propiedades disponibles (las que no están asignadas)
      const propiedadesAsignadas = new Set<string>();
      this.herederos.forEach(h => {
        h.propiedades.forEach(p => {
          propiedadesAsignadas.add(p.propiedad.referencia_catastral);
        });
      });

      this.propiedadesDisponibles = this.propiedades
        // Filtrar propiedades que deben ignorarse en el reparto y las ya asignadas
        .filter(p => !propiedadesAsignadas.has(p.referencia_catastral) && !p.ignorarReparto)
        .map(p => {
          const valoracion = this.valoraciones.find(v => v.referencia_catastral === p.referencia_catastral);
          if (!valoracion) return null;

          const tipo = this.determinarTipo(p);
          const superficie = this.calcularSuperficie(p);

          return {
            propiedad: p,
            valoracion,
            valor: valoracion.valor_estimado_euros || 0,
            superficie,
            tipo
          } as PropiedadAsignada;
        })
        .filter(p => p !== null) as PropiedadAsignada[];

      this.mostrarConfiguracion = false;
      this.mostrarModalCargar = false;
      alert('✅ Reparto cargado correctamente');
    }
  }

  /**
   * Elimina un reparto guardado
   */
  eliminarRepartoGuardado(reparto: RepartoBackend, event: Event): void {
    event.stopPropagation();

    if (confirm(`¿Estás seguro de eliminar el reparto "${reparto.nombre}"?`)) {
      if (!reparto._id) {
        alert('Error: ID de reparto no válido');
        return;
      }

      this.apiService.deleteReparto(reparto._id).subscribe({
        next: () => {
          this.repartosGuardados = this.repartosGuardados.filter(r => r._id !== reparto._id);
          alert('✅ Reparto eliminado correctamente');

          // Si eliminamos el reparto actual, limpiar ID
          if (this.repartoActualId === reparto._id) {
            this.repartoActualId = null;
          }
        },
        error: (error) => {
          console.error('Error al eliminar reparto:', error);
          alert(`❌ Error al eliminar: ${error.message}`);
        }
      });
    }
  }

  /**
   * Cierra el modal de guardar
   */
  cerrarModalGuardar(): void {
    this.mostrarModalGuardar = false;
  }

  /**
   * Cierra el modal de cargar
   */
  cerrarModalCargar(): void {
    this.mostrarModalCargar = false;
  }

  /**
   * Formatea moneda
   */
  formatCurrency(value: number | null | undefined): string {
    if (value === null || value === undefined) return '-';
    return new Intl.NumberFormat('es-ES', {
      style: 'currency',
      currency: 'EUR'
    }).format(value);
  }

  /**
   * Formatea número
   */
  formatNumber(value: number | null | undefined, decimals: number = 2): string {
    if (value === null || value === undefined) return '-';
    return new Intl.NumberFormat('es-ES', {
      minimumFractionDigits: 0,
      maximumFractionDigits: decimals
    }).format(value);
  }

  /**
   * Formatea fecha
   */
  formatDate(date: Date | undefined): string {
    if (!date) return '-';
    return new Date(date).toLocaleDateString('es-ES', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  }
}
