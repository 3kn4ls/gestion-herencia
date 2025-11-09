import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { HttpClientModule } from '@angular/common/http';

import { DataService } from './services/data.service';
import { ValoracionService } from './services/valoracion.service';
import { Propiedad } from './models/propiedad.model';
import { Valoracion, ResultadoValoracion } from './models/valoracion.model';
import { CriteriosValoracion } from './models/criterios.model';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [CommonModule, FormsModule, HttpClientModule],
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.css']
})
export class AppComponent implements OnInit {
  title = 'Gestor de Datos Catastrales';

  // Datos
  propiedades: Propiedad[] = [];
  propiedadesFiltradas: Propiedad[] = [];
  criterios: CriteriosValoracion | null = null;
  resultadoValoracion: ResultadoValoracion | null = null;

  // Filtros
  filtros = {
    clase: 'all',
    provincia: 'all',
    municipio: 'all',
    uso: 'all',
    busqueda: ''
  };

  // Vista
  vistaActual: 'tabla' | 'tarjetas' = 'tabla';

  // Loading states
  cargandoDatos = false;
  cargandoCriterios = false;

  // Opciones para filtros
  opcionesClase: string[] = [];
  opcionesProvincia: string[] = [];
  opcionesMunicipio: string[] = [];
  opcionesUso: string[] = [];

  constructor(
    private dataService: DataService,
    private valoracionService: ValoracionService
  ) {}

  ngOnInit(): void {
    this.cargarCriterios();
  }

  /**
   * Carga los criterios de valoración
   */
  cargarCriterios(): void {
    this.cargandoCriterios = true;
    this.dataService.cargarCriterios().subscribe({
      next: (criterios) => {
        this.criterios = criterios;
        this.cargandoCriterios = false;
        console.log('✅ Criterios cargados:', criterios);
      },
      error: (error) => {
        console.error('❌ Error al cargar criterios:', error);
        this.cargandoCriterios = false;
      }
    });
  }

  /**
   * Maneja la carga de archivo
   */
  onFileSelected(event: any): void {
    const file = event.target.files[0];
    if (file) {
      this.cargandoDatos = true;
      this.dataService.cargarArchivo(file).then(
        (propiedades) => {
          this.propiedades = propiedades;
          this.aplicarFiltros();
          this.construirFiltros();
          this.valorarAutomaticamente();
          this.cargandoDatos = false;
          console.log(`✅ ${propiedades.length} propiedades cargadas`);
        },
        (error) => {
          console.error('❌ Error al cargar archivo:', error);
          alert('Error al cargar el archivo. Verifica que sea un JSON válido.');
          this.cargandoDatos = false;
        }
      );
    }
  }

  /**
   * Carga datos de muestra
   */
  cargarDatosMuestra(): void {
    this.cargandoDatos = true;
    this.dataService.cargarPropiedades().subscribe({
      next: (propiedades) => {
        this.propiedades = propiedades;
        this.aplicarFiltros();
        this.construirFiltros();
        this.valorarAutomaticamente();
        this.cargandoDatos = false;
        console.log(`✅ ${propiedades.length} propiedades de muestra cargadas`);
      },
      error: (error) => {
        console.error('❌ Error al cargar datos de muestra:', error);
        this.cargandoDatos = false;
      }
    });
  }

  /**
   * Valora las propiedades automáticamente
   */
  valorarAutomaticamente(): void {
    if (!this.criterios) {
      console.warn('⚠️ No hay criterios cargados');
      return;
    }

    if (this.propiedades.length === 0) {
      console.warn('⚠️ No hay propiedades para valorar');
      return;
    }

    this.resultadoValoracion = this.valoracionService.valorarPropiedades(
      this.propiedades,
      this.criterios
    );

    console.log('✅ Valoración completada:', this.resultadoValoracion);
  }

  /**
   * Construye las opciones de los filtros
   */
  construirFiltros(): void {
    const clases = new Set<string>();
    const provincias = new Set<string>();
    const municipios = new Set<string>();
    const usos = new Set<string>();

    this.propiedades.forEach(p => {
      if (p.datos_inmueble?.clase) clases.add(p.datos_inmueble.clase);
      if (p.localizacion?.provincia) provincias.add(p.localizacion.provincia);
      if (p.localizacion?.municipio) municipios.add(p.localizacion.municipio);
      if (p.datos_inmueble?.uso_principal) usos.add(p.datos_inmueble.uso_principal);
    });

    this.opcionesClase = Array.from(clases).sort();
    this.opcionesProvincia = Array.from(provincias).sort();
    this.opcionesMunicipio = Array.from(municipios).sort();
    this.opcionesUso = Array.from(usos).sort();
  }

  /**
   * Aplica los filtros a las propiedades
   */
  aplicarFiltros(): void {
    this.propiedadesFiltradas = this.propiedades.filter(p => {
      // Filtro por clase
      if (this.filtros.clase !== 'all' && p.datos_inmueble?.clase !== this.filtros.clase) {
        return false;
      }

      // Filtro por provincia
      if (this.filtros.provincia !== 'all' && p.localizacion?.provincia !== this.filtros.provincia) {
        return false;
      }

      // Filtro por municipio
      if (this.filtros.municipio !== 'all' && p.localizacion?.municipio !== this.filtros.municipio) {
        return false;
      }

      // Filtro por uso
      if (this.filtros.uso !== 'all' && p.datos_inmueble?.uso_principal !== this.filtros.uso) {
        return false;
      }

      // Búsqueda por texto
      if (this.filtros.busqueda) {
        const termino = this.filtros.busqueda.toLowerCase();
        const ref = p.referencia_catastral?.toLowerCase() || '';
        const provincia = p.localizacion?.provincia?.toLowerCase() || '';
        const municipio = p.localizacion?.municipio?.toLowerCase() || '';
        const partida = p.localizacion?.partida?.toLowerCase() || '';
        const clase = p.datos_inmueble?.clase?.toLowerCase() || '';
        const uso = p.datos_inmueble?.uso_principal?.toLowerCase() || '';

        if (!ref.includes(termino) && !provincia.includes(termino) &&
            !municipio.includes(termino) && !partida.includes(termino) &&
            !clase.includes(termino) && !uso.includes(termino)) {
          return false;
        }
      }

      return true;
    });
  }

  /**
   * Cambia la vista (tabla/tarjetas)
   */
  cambiarVista(vista: 'tabla' | 'tarjetas'): void {
    this.vistaActual = vista;
  }

  /**
   * Obtiene la valoración de una propiedad
   */
  getValoracion(refCatastral: string): Valoracion | undefined {
    return this.resultadoValoracion?.valoraciones.find(
      v => v.referencia_catastral === refCatastral
    );
  }

  /**
   * Exporta a Excel (formato TSV)
   */
  async exportarAExcel(): Promise<void> {
    if (!this.propiedadesFiltradas || this.propiedadesFiltradas.length === 0) {
      alert('No hay datos para exportar');
      return;
    }

    try {
      const headers = [
        'Referencia Catastral', 'Provincia', 'Municipio', 'Partida', 'Polígono', 'Parcela',
        'Clase', 'Uso Principal', 'Superficie Total (m²)',
        'Subparcela', 'Cultivo/Aprovechamiento', 'Intensidad', 'Superficie Subparcela (m²)',
        'Cultivo Valorado', 'Superficie Cultivo (ha)', 'Precio €/ha', 'Valor Cultivo (€)',
        'Valor Total Calculado (€)', 'Valor Catastral (€)', 'Valor Oficial Referencia (€)',
        'Diferencia vs Oficial (€)', 'Diferencia vs Oficial (%)'
      ];

      const rows: string[][] = [];

      for (const propiedad of this.propiedadesFiltradas) {
        const valoracion = this.getValoracion(propiedad.referencia_catastral);
        const valorCalculado = valoracion?.valor_estimado_euros || 0;
        const valorCatastral = propiedad.datos_catastrales?.valor_catastral || 0;
        const valorOficial = propiedad.valor_referencia_oficial?.valor_referencia || 0;
        const diferencia = valorOficial > 0 ? (valorCalculado - valorOficial) : 0;
        const diferenciaPct = valorOficial > 0 ? ((diferencia / valorOficial) * 100) : 0;

        const datosComunes = [
          propiedad.referencia_catastral || '',
          propiedad.localizacion?.provincia || '',
          propiedad.localizacion?.municipio || '',
          propiedad.localizacion?.partida || '',
          propiedad.localizacion?.poligono || '',
          propiedad.localizacion?.parcela || '',
          propiedad.datos_inmueble?.clase || '',
          propiedad.datos_inmueble?.uso_principal || '',
          propiedad.datos_inmueble?.superficie_construida?.toString() || '0'
        ];

        if (propiedad.cultivos && propiedad.cultivos.length > 0) {
          const detallesDisponibles = [...(valoracion?.detalles_cultivos || [])];

          for (let i = 0; i < propiedad.cultivos.length; i++) {
            const cultivo = propiedad.cultivos[i];
            const superficieHa = parseFloat(cultivo.superficie_m2.toString()) / 10000;

            let detalle = null;
            const idx = detallesDisponibles.findIndex(d =>
              Math.abs((d.superficie_ha || 0) - superficieHa) < 0.0001
            );

            if (idx >= 0) {
              detalle = detallesDisponibles[idx];
              detallesDisponibles.splice(idx, 1);
            } else if (detallesDisponibles.length > 0) {
              detalle = detallesDisponibles.shift();
            }

            rows.push([
              ...datosComunes,
              cultivo.subparcela || '',
              cultivo.cultivo_aprovechamiento || '',
              cultivo.intensidad_productiva || '',
              cultivo.superficie_m2?.toString() || '',
              detalle?.cultivo || '',
              detalle?.superficie_ha?.toString() || '',
              detalle?.precio_ha?.toString() || '',
              detalle?.valor_estimado?.toString() || '',
              i === 0 ? valorCalculado.toString() : '',
              i === 0 ? valorCatastral.toString() : '',
              i === 0 ? valorOficial.toString() : '',
              i === 0 ? diferencia.toString() : '',
              i === 0 ? diferenciaPct.toFixed(2) : ''
            ]);
          }
        } else {
          rows.push([
            ...datosComunes,
            '', '', '', '',
            '', '', '', '',
            valorCalculado.toString(),
            valorCatastral.toString(),
            valorOficial.toString(),
            diferencia.toString(),
            diferenciaPct.toFixed(2)
          ]);
        }
      }

      const tsvContent = [
        headers.join('\t'),
        ...rows.map(row => row.join('\t'))
      ].join('\n');

      await navigator.clipboard.writeText(tsvContent);

      alert(`✅ ¡Datos copiados al portapapeles!\n\n` +
            `${this.propiedadesFiltradas.length} propiedades\n` +
            `${rows.length} filas (incluyendo subparcelas desglosadas)\n\n` +
            `Ahora puedes pegar (Ctrl+V) en Excel`);

      console.log(`✅ Exportación completada: ${rows.length} filas`);

    } catch (error) {
      console.error('Error al exportar:', error);
      alert('❌ Error al copiar los datos. Verifica que tu navegador permita acceso al portapapeles.');
    }
  }

  /**
   * Formatea moneda
   */
  formatCurrency(value: number): string {
    return new Intl.NumberFormat('es-ES', {
      style: 'currency',
      currency: 'EUR'
    }).format(value);
  }

  /**
   * Formatea número
   */
  formatNumber(value: number): string {
    return new Intl.NumberFormat('es-ES', {
      minimumFractionDigits: 0,
      maximumFractionDigits: 2
    }).format(value);
  }
}
