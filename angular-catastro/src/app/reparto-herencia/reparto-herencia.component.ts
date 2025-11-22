import { Component, Input, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';

import { Propiedad } from '../models/propiedad.model';
import { Valoracion } from '../models/valoracion.model';
import { Heredero, PropiedadAsignada, ConfiguracionReparto, EstadisticasReparto } from '../models/reparto.model';
import { RepartoService } from '../services/reparto.service';
import { ApiService, RepartoBackend } from '../services/api.service';

/**
 * Interfaz para representar un elemento en la vista de reparto
 * Puede ser una propiedad individual o un grupo de propiedades
 */
export interface ElementoReparto {
  esGrupo: boolean;
  codGrupo?: string;
  propiedades: PropiedadAsignada[];
  valorTotal: number;
  superficieTotal: number;
  tipoMayoritario: 'rustico' | 'urbano';
}

@Component({
  selector: 'app-reparto-herencia',
  standalone: true,
  imports: [CommonModule, FormsModule],
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

  // Estado para selección con doble click
  elementoSeleccionado: ElementoReparto | null = null;
  origenSeleccionado: 'disponibles' | Heredero | null = null;

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
   * Genera y descarga un PDF profesional con el informe del reparto
   */
  exportarPDF(): void {
    if (!this.estadisticas) {
      alert('No hay datos para exportar');
      return;
    }

    if (this.herederos.every(h => h.propiedades.length === 0)) {
      alert('El reparto está vacío. Asigna propiedades antes de exportar.');
      return;
    }

    const doc = new jsPDF();
    const pageWidth = doc.internal.pageSize.getWidth();
    const pageHeight = doc.internal.pageSize.getHeight();
    const margin = 20;
    let yPos = margin;

    // Colores corporativos
    const colorPrimario: [number, number, number] = [41, 128, 185];
    const colorSecundario: [number, number, number] = [52, 73, 94];
    const colorExito: [number, number, number] = [39, 174, 96];
    const colorAdvertencia: [number, number, number] = [243, 156, 18];

    // ==================== ENCABEZADO ====================
    // Línea decorativa superior
    doc.setFillColor(...colorPrimario);
    doc.rect(0, 0, pageWidth, 8, 'F');

    yPos = 25;

    // Título principal
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(24);
    doc.setTextColor(...colorSecundario);
    doc.text('INFORME DE REPARTO DE HERENCIA', pageWidth / 2, yPos, { align: 'center' });

    yPos += 12;

    // Fecha de generación
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(11);
    doc.setTextColor(100, 100, 100);
    const fechaActual = new Date().toLocaleDateString('es-ES', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
    doc.text(`Generado el ${fechaActual}`, pageWidth / 2, yPos, { align: 'center' });

    yPos += 15;

    // Línea separadora
    doc.setDrawColor(...colorPrimario);
    doc.setLineWidth(0.5);
    doc.line(margin, yPos, pageWidth - margin, yPos);

    yPos += 15;

    // ==================== RESUMEN EJECUTIVO ====================
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(14);
    doc.setTextColor(...colorPrimario);
    doc.text('RESUMEN EJECUTIVO', margin, yPos);

    yPos += 10;

    // Caja de resumen
    const resumenHeight = 45;
    doc.setFillColor(245, 247, 250);
    doc.setDrawColor(220, 220, 220);
    doc.roundedRect(margin, yPos, pageWidth - 2 * margin, resumenHeight, 3, 3, 'FD');

    yPos += 10;
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(11);
    doc.setTextColor(...colorSecundario);

    const col1X = margin + 10;
    const col2X = pageWidth / 2 + 10;

    doc.text(`Herederos: ${this.herederos.length}`, col1X, yPos);
    doc.text(`Valor Total: ${this.formatCurrency(this.estadisticas.valorTotal)}`, col2X, yPos);

    yPos += 8;
    doc.text(`Propiedades Repartidas: ${this.herederos.reduce((sum, h) => sum + h.propiedades.length, 0)}`, col1X, yPos);
    doc.text(`Valor Promedio/Heredero: ${this.formatCurrency(this.estadisticas.valorPromedioPorHeredero)}`, col2X, yPos);

    yPos += 8;
    const totalRusticas = this.herederos.reduce((sum, h) => sum + h.cantidadRusticas, 0);
    const totalUrbanas = this.herederos.reduce((sum, h) => sum + h.cantidadUrbanas, 0);
    doc.text(`Fincas Rústicas: ${totalRusticas}`, col1X, yPos);
    doc.text(`Fincas Urbanas: ${totalUrbanas}`, col2X, yPos);

    yPos += 8;
    // Estado de equilibrio
    doc.setFont('helvetica', 'bold');
    if (this.estadisticas.equilibrado) {
      doc.setTextColor(...colorExito);
      doc.text(`Estado: EQUILIBRADO (Desv. ${this.estadisticas.desviacionPorcentual.toFixed(1)}%)`, col1X, yPos);
    } else {
      doc.setTextColor(...colorAdvertencia);
      doc.text(`Estado: DESEQUILIBRADO (Desv. ${this.estadisticas.desviacionPorcentual.toFixed(1)}%)`, col1X, yPos);
    }

    yPos += 20;

    // ==================== DETALLE POR HEREDERO ====================
    this.herederos.forEach((heredero, index) => {
      // Verificar si necesitamos nueva página
      if (yPos > pageHeight - 80) {
        doc.addPage();
        yPos = margin;
      }

      // Calcular porcentaje
      const porcentaje = this.estadisticas!.valorTotal > 0
        ? (heredero.valorTotal / this.estadisticas!.valorTotal * 100)
        : 0;

      // Cabecera del heredero con fondo
      doc.setFillColor(41, 128, 185);
      doc.rect(margin, yPos - 5, pageWidth - 2 * margin, 10, 'F');

      // Título del heredero (en blanco sobre fondo azul)
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(11);
      doc.setTextColor(255, 255, 255);
      doc.text(`${heredero.nombre.toUpperCase()}`, margin + 3, yPos + 2);

      // Porcentaje a la derecha (separado del nombre)
      doc.setFont('helvetica', 'normal');
      doc.setFontSize(9);
      doc.text(`${porcentaje.toFixed(1)}% del total`, pageWidth - margin - 3, yPos + 2, { align: 'right' });

      yPos += 12;

      // Resumen del heredero
      doc.setFontSize(9);
      doc.setTextColor(...colorSecundario);
      const resumenHeredero = `Valor: ${this.formatCurrency(heredero.valorTotal)} | Superficie: ${heredero.superficieTotal.toFixed(4)} ha | Rústicas: ${heredero.cantidadRusticas} | Urbanas: ${heredero.cantidadUrbanas}`;
      doc.text(resumenHeredero, margin, yPos);

      yPos += 6;

      // Tabla de propiedades
      if (heredero.propiedades.length > 0) {
        const tableData = heredero.propiedades.map((p, idx) => {
          // Construir referencia con escritura si existe
          const refCatastral = p.propiedad.referencia_catastral.substring(0, 20);
          const escritura = p.propiedad.m2Escritura ? ` (${p.propiedad.m2Escritura.toLocaleString('es-ES')} m²)` : '';

          return [
            (idx + 1).toString(),
            refCatastral + escritura,
            p.propiedad.localizacion?.partida || '-',
            p.tipo === 'rustico' ? 'Rústica' : 'Urbana',
            p.superficie.toFixed(4),
            this.formatCurrency(p.valor)
          ];
        });

        autoTable(doc, {
          startY: yPos,
          head: [['#', 'Ref. Catastral (Escritura)', 'Partida', 'Tipo', 'Sup. (ha)', 'Valor']],
          body: tableData,
          margin: { left: margin, right: margin },
          styles: {
            fontSize: 7,
            cellPadding: 1.5,
          },
          headStyles: {
            fillColor: colorSecundario,
            textColor: [255, 255, 255],
            fontStyle: 'bold',
            halign: 'center',
            fontSize: 7
          },
          columnStyles: {
            0: { halign: 'center', cellWidth: 8 },
            1: { cellWidth: 55 },
            2: { cellWidth: 35 },
            3: { halign: 'center', cellWidth: 18 },
            4: { halign: 'right', cellWidth: 20 },
            5: { halign: 'right', cellWidth: 28 }
          },
          alternateRowStyles: {
            fillColor: [248, 250, 252]
          },
          didDrawPage: (data) => {
            yPos = data.cursor?.y || yPos;
          }
        });

        // Obtener posición Y después de la tabla
        yPos = (doc as any).lastAutoTable.finalY + 12;
      } else {
        doc.setFontSize(8);
        doc.setTextColor(150, 150, 150);
        doc.text('Sin propiedades asignadas', margin, yPos);
        yPos += 12;
      }
    });

    // ==================== ESTADÍSTICAS FINALES ====================
    // Verificar si necesitamos nueva página
    if (yPos > pageHeight - 60) {
      doc.addPage();
      yPos = margin;
    }

    // Línea separadora
    doc.setDrawColor(...colorPrimario);
    doc.setLineWidth(0.5);
    doc.line(margin, yPos, pageWidth - margin, yPos);

    yPos += 10;

    doc.setFont('helvetica', 'bold');
    doc.setFontSize(14);
    doc.setTextColor(...colorPrimario);
    doc.text('ANÁLISIS ESTADÍSTICO', margin, yPos);

    yPos += 10;

    // Tabla de estadísticas
    const statsData = [
      ['Valor Total del Reparto', this.formatCurrency(this.estadisticas.valorTotal)],
      ['Valor Promedio por Heredero', this.formatCurrency(this.estadisticas.valorPromedioPorHeredero)],
      ['Desviación Estándar', this.formatCurrency(this.estadisticas.desviacionEstandar)],
      ['Desviación Porcentual', this.estadisticas.desviacionPorcentual.toFixed(2) + '%'],
      ['Diferencia Máximo - Mínimo', this.formatCurrency(this.estadisticas.diferenciaMaxMin)],
      ['Heredero con Mayor Valor', `Heredero ${this.estadisticas.herederoMayor.id} (${this.formatCurrency(this.estadisticas.herederoMayor.valor)})`],
      ['Heredero con Menor Valor', `Heredero ${this.estadisticas.herederoMenor.id} (${this.formatCurrency(this.estadisticas.herederoMenor.valor)})`]
    ];

    autoTable(doc, {
      startY: yPos,
      body: statsData,
      margin: { left: margin, right: margin },
      styles: {
        fontSize: 10,
        cellPadding: 4,
      },
      columnStyles: {
        0: { fontStyle: 'bold', cellWidth: 80 },
        1: { halign: 'right' }
      },
      alternateRowStyles: {
        fillColor: [245, 247, 250]
      },
      theme: 'plain'
    });

    // ==================== PIE DE PÁGINA ====================
    const totalPages = doc.getNumberOfPages();
    for (let i = 1; i <= totalPages; i++) {
      doc.setPage(i);

      // Línea de pie de página
      doc.setDrawColor(200, 200, 200);
      doc.setLineWidth(0.3);
      doc.line(margin, pageHeight - 15, pageWidth - margin, pageHeight - 15);

      // Texto del pie de página
      doc.setFont('helvetica', 'normal');
      doc.setFontSize(8);
      doc.setTextColor(150, 150, 150);
      doc.text('Documento generado automáticamente - Gestión de Herencias', margin, pageHeight - 10);
      doc.text(`Página ${i} de ${totalPages}`, pageWidth - margin, pageHeight - 10, { align: 'right' });
    }

    // Generar nombre del archivo
    const fechaArchivo = new Date().toISOString().slice(0, 10);
    const nombreArchivo = this.nombreReparto
      ? `reparto_${this.nombreReparto.replace(/\s+/g, '_')}_${fechaArchivo}.pdf`
      : `reparto_herencia_${fechaArchivo}.pdf`;

    // Descargar PDF
    doc.save(nombreArchivo);
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

  // =====================================================
  // MÉTODOS DE SELECCIÓN CON DOBLE CLICK
  // =====================================================

  /**
   * Selecciona un elemento con doble click para moverlo
   */
  seleccionarElemento(elemento: ElementoReparto, origen: 'disponibles' | Heredero): void {
    // Si ya está seleccionado el mismo elemento, deseleccionar
    if (this.elementoSeleccionado === elemento) {
      this.cancelarSeleccion();
      return;
    }

    this.elementoSeleccionado = elemento;
    this.origenSeleccionado = origen;
  }

  /**
   * Mueve el elemento seleccionado al destino especificado
   */
  moverADestino(destino: 'disponibles' | Heredero): void {
    if (!this.elementoSeleccionado || !this.origenSeleccionado) {
      return;
    }

    // No mover si el destino es el mismo que el origen
    if (destino === this.origenSeleccionado) {
      this.cancelarSeleccion();
      return;
    }

    const propiedadesAMover = this.elementoSeleccionado.propiedades;

    // Obtener lista origen
    const listaOrigen = this.origenSeleccionado === 'disponibles'
      ? this.propiedadesDisponibles
      : this.origenSeleccionado.propiedades;

    // Obtener lista destino
    const listaDestino = destino === 'disponibles'
      ? this.propiedadesDisponibles
      : destino.propiedades;

    // Remover propiedades de la lista origen
    propiedadesAMover.forEach(prop => {
      const index = listaOrigen.findIndex(p =>
        p.propiedad.referencia_catastral === prop.propiedad.referencia_catastral
      );
      if (index !== -1) {
        listaOrigen.splice(index, 1);
      }
    });

    // Añadir propiedades a la lista destino
    listaDestino.push(...propiedadesAMover);

    // Actualizar totales y estadísticas
    this.actualizarTotalesHerederos();
    this.calcularEstadisticas();

    // Limpiar selección
    this.cancelarSeleccion();
  }

  /**
   * Cancela la selección actual
   */
  cancelarSeleccion(): void {
    this.elementoSeleccionado = null;
    this.origenSeleccionado = null;
  }

  /**
   * Verifica si un elemento está seleccionado
   */
  estaSeleccionado(elemento: ElementoReparto): boolean {
    if (!this.elementoSeleccionado) return false;
    // Comparar por la primera propiedad del grupo
    return this.elementoSeleccionado.propiedades[0]?.propiedad.referencia_catastral ===
           elemento.propiedades[0]?.propiedad.referencia_catastral;
  }

  // =====================================================
  // MÉTODOS DE AGRUPACIÓN PARA VISUALIZACIÓN
  // =====================================================

  /**
   * Agrupa las propiedades disponibles por codGrupo para mostrar en la vista
   * Las propiedades con el mismo codGrupo aparecen como un solo elemento
   */
  getElementosDisponiblesAgrupados(): ElementoReparto[] {
    return this.agruparPropiedades(this.propiedadesDisponibles);
  }

  /**
   * Agrupa las propiedades de un heredero por codGrupo para mostrar en la vista
   */
  getElementosHerederoAgrupados(heredero: Heredero): ElementoReparto[] {
    return this.agruparPropiedades(heredero.propiedades);
  }

  /**
   * Método privado que agrupa un array de propiedades por codGrupo
   */
  private agruparPropiedades(propiedades: PropiedadAsignada[]): ElementoReparto[] {
    const gruposMap = new Map<string, PropiedadAsignada[]>();
    const individuales: PropiedadAsignada[] = [];

    // Separar propiedades con grupo de las individuales
    propiedades.forEach(p => {
      const codGrupo = p.propiedad.codGrupo?.trim();
      if (codGrupo) {
        if (!gruposMap.has(codGrupo)) {
          gruposMap.set(codGrupo, []);
        }
        gruposMap.get(codGrupo)!.push(p);
      } else {
        individuales.push(p);
      }
    });

    const elementos: ElementoReparto[] = [];

    // Crear elementos para grupos
    gruposMap.forEach((props, codGrupo) => {
      const valorTotal = props.reduce((sum, p) => sum + p.valor, 0);
      const superficieTotal = props.reduce((sum, p) => sum + p.superficie, 0);
      const rusticas = props.filter(p => p.tipo === 'rustico').length;
      const tipoMayoritario = rusticas > props.length / 2 ? 'rustico' : 'urbano';

      elementos.push({
        esGrupo: true,
        codGrupo,
        propiedades: props,
        valorTotal,
        superficieTotal,
        tipoMayoritario
      });
    });

    // Crear elementos para propiedades individuales
    individuales.forEach(p => {
      elementos.push({
        esGrupo: false,
        propiedades: [p],
        valorTotal: p.valor,
        superficieTotal: p.superficie,
        tipoMayoritario: p.tipo
      });
    });

    return elementos;
  }

  /**
   * Obtiene el conteo total de propiedades (sumando las de los grupos)
   */
  getConteoTotalPropiedades(elementos: ElementoReparto[]): number {
    return elementos.reduce((sum, e) => sum + e.propiedades.length, 0);
  }
}
