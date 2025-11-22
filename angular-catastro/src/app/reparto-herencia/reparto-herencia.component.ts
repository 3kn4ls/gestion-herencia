import { Component, Input, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { CdkDragDrop, DragDropModule, moveItemInArray, transferArrayItem } from '@angular/cdk/drag-drop';

import { Propiedad } from '../models/propiedad.model';
import { Valoracion } from '../models/valoracion.model';
import { Heredero, PropiedadAsignada, ConfiguracionReparto, EstadisticasReparto } from '../models/reparto.model';
import { RepartoService } from '../services/reparto.service';

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

  constructor(private repartoService: RepartoService) {}

  ngOnInit(): void {
    this.inicializarPropiedadesDisponibles();
  }

  /**
   * Inicializa las propiedades disponibles para repartir
   * Filtra las propiedades que tienen ignorarReparto = true
   */
  private inicializarPropiedadesDisponibles(): void {
    this.propiedadesDisponibles = this.propiedades
      .filter(p => !p.ignorarReparto) // Excluir propiedades marcadas como ignorar
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
  }

  /**
   * Obtiene el número de propiedades ignoradas en el reparto
   */
  getPropiedadesIgnoradas(): number {
    return this.propiedades.filter(p => p.ignorarReparto).length;
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
}
