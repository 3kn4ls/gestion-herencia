import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { HttpClientModule } from '@angular/common/http';
import { forkJoin } from 'rxjs';

import { DataService, ValoresTasacion, PropiedadPersonalizada } from './services/data.service';
import { ValoracionService } from './services/valoracion.service';
import { ConfigService } from './services/config.service';
import { Propiedad } from './models/propiedad.model';
import { Valoracion, ResultadoValoracion } from './models/valoracion.model';
import { RepartoHerenciaComponent } from './reparto-herencia/reparto-herencia.component';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [CommonModule, FormsModule, HttpClientModule, RepartoHerenciaComponent],
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.css']
})
export class AppComponent implements OnInit {
  title = 'Valoración de Propiedades Catastrales';

  // Datos
  propiedades: Propiedad[] = [];
  propiedadesFiltradas: Propiedad[] = [];
  valoresTasacion: ValoresTasacion | null = null;
  valoresTasacionDefecto: ValoresTasacion | null = null;
  resultadoValoracion: ResultadoValoracion | null = null;

  // Configuración
  mostrarConfiguracion = false;
  valoresEditables: ValoresTasacion | null = null;
  municipios: string[] = [];

  // Módulo de Reparto de Herencia
  mostrarReparto = false;

  // Filtros
  filtros = {
    clase: 'all',
    provincia: 'all',
    municipio: 'all',
    uso: 'all',
    busqueda: ''
  };

  // Vista
  vistaActual: 'tabla' | 'tarjetas' | 'resumen' = 'tabla';

  // Loading states
  cargandoDatos = false;

  // Opciones para filtros
  opcionesClase: string[] = [];
  opcionesProvincia: string[] = [];
  opcionesMunicipio: string[] = [];
  opcionesUso: string[] = [];

  constructor(
    private dataService: DataService,
    private valoracionService: ValoracionService,
    private configService: ConfigService
  ) {}

  ngOnInit(): void {
    this.cargarDatos();
  }

  /**
   * Carga los datos automáticamente al iniciar
   */
  cargarDatos(): void {
    this.cargandoDatos = true;

    forkJoin({
      propiedades: this.dataService.cargarPropiedades(),
      valores: this.dataService.cargarValoresTasacion()
    }).subscribe({
      next: ({ propiedades, valores }) => {
        this.propiedades = propiedades;
        this.valoresTasacionDefecto = valores;

        // Verificar si hay valores personalizados guardados
        const valoresPersonalizados = this.configService.getValores();
        this.valoresTasacion = valoresPersonalizados || valores;

        // Guardar lista de municipios para la configuración
        this.municipios = Object.keys(valores.municipios);

        this.aplicarFiltros();
        this.construirFiltros();
        this.valorarAutomaticamente();
        this.cargandoDatos = false;

        if (valoresPersonalizados) {
          console.log(`✅ ${propiedades.length} propiedades cargadas con valores personalizados`);
        } else {
          console.log(`✅ ${propiedades.length} propiedades cargadas con valores por defecto`);
        }
      },
      error: (error) => {
        console.error('❌ Error al cargar datos:', error);
        alert('Error al cargar los datos. Por favor, verifica los archivos JSON.');
        this.cargandoDatos = false;
      }
    });
  }

  /**
   * Valora las propiedades automáticamente
   */
  valorarAutomaticamente(): void {
    if (!this.valoresTasacion) {
      console.warn('⚠️ No hay valores de tasación cargados');
      return;
    }

    if (this.propiedades.length === 0) {
      console.warn('⚠️ No hay propiedades para valorar');
      return;
    }

    this.resultadoValoracion = this.valoracionService.valorarPropiedades(
      this.propiedades,
      this.valoresTasacion
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
   * Cambia la vista (tabla/tarjetas/resumen)
   */
  cambiarVista(vista: 'tabla' | 'tarjetas' | 'resumen'): void {
    this.vistaActual = vista;
  }

  /**
   * Abre la página del catastro en una ventana popup
   */
  abrirCatastro(propiedad: Propiedad): void {
    if (propiedad.url_consultada) {
      const width = 1200;
      const height = 800;
      const left = (screen.width / 2) - (width / 2);
      const top = (screen.height / 2) - (height / 2);

      window.open(
        propiedad.url_consultada,
        'catastro',
        `width=${width},height=${height},left=${left},top=${top},resizable=yes,scrollbars=yes`
      );
    } else {
      alert('No hay URL del catastro disponible para esta propiedad');
    }
  }

  /**
   * Obtiene propiedades agrupadas por referencia catastral para vista resumen
   */
  getPropiedadesResumen(): any[] {
    const resumenMap = new Map<string, any>();

    this.propiedadesFiltradas.forEach(propiedad => {
      const ref = propiedad.referencia_catastral || '';
      if (!resumenMap.has(ref)) {
        const valoracion = this.getValoracion(ref);
        const superficieTotalM2 = propiedad.cultivos?.reduce((sum, c) => sum + (c.superficie_m2 || 0), 0) || 0;
        const superficieTotalHa = superficieTotalM2 / 10000;
        const valorTotalCalculado = valoracion?.valor_estimado_euros || 0;
        const precioMedioHa = superficieTotalHa > 0 ? valorTotalCalculado / superficieTotalHa : 0;

        resumenMap.set(ref, {
          referencia_catastral: ref,
          municipio: propiedad.localizacion?.municipio || '',
          partida: propiedad.localizacion?.partida || '',
          escritura: propiedad.escritura || '',
          superficie_m2: superficieTotalM2,
          superficie_ha: superficieTotalHa,
          precio_medio_ha: precioMedioHa,
          valor_calculado: valorTotalCalculado,
          valor_oficial: propiedad.valor_referencia || 0,
          propiedad: propiedad
        });
      }
    });

    return Array.from(resumenMap.values());
  }

  /**
   * Obtiene la valoración de una propiedad
   */
  getValoracion(refCatastral: string | undefined): Valoracion | undefined {
    if (!refCatastral) return undefined;
    return this.resultadoValoracion?.valoraciones.find(
      v => v.referencia_catastral === refCatastral
    );
  }

  /**
   * Calcula la diferencia entre valor calculado y valor catastral oficial
   */
  getDiferencia(propiedad: Propiedad): { absoluta: number, porcentaje: number } {
    const valoracion = this.getValoracion(propiedad.referencia_catastral);
    const valorCalculado = valoracion?.valor_estimado_euros || 0;
    const valorOficial = propiedad.valor_referencia || 0;

    const diferencia = valorOficial > 0 ? (valorCalculado - valorOficial) : 0;
    const porcentaje = valorOficial > 0 ? ((diferencia / valorOficial) * 100) : 0;

    return {
      absoluta: diferencia,
      porcentaje: porcentaje
    };
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
        'Clase', 'Uso Principal', 'Superficie Total (m²)', 'Escritura',
        'Subparcela', 'Cultivo/Aprovechamiento', 'Código Catastral', 'Intensidad', 'Superficie Cultivo (m²)',
        'Superficie Cultivo (ha)', 'Precio €/ha', 'Valor Cultivo (€)',
        'Valor Total Calculado (€)', 'Valor Catastral Oficial (€)',
        'Diferencia (€)', 'Diferencia (%)'
      ];

      const rows: string[][] = [];

      for (const propiedad of this.propiedadesFiltradas) {
        const valoracion = this.getValoracion(propiedad.referencia_catastral);
        const valorCalculado = valoracion?.valor_estimado_euros || 0;
        const valorOficial = propiedad.valor_referencia || 0;
        const diferencia = this.getDiferencia(propiedad);

        const datosComunes = [
          propiedad.referencia_catastral || '',
          propiedad.localizacion?.provincia || '',
          propiedad.localizacion?.municipio || '',
          propiedad.localizacion?.partida || '',
          propiedad.localizacion?.poligono || '',
          propiedad.localizacion?.parcela || '',
          propiedad.datos_inmueble?.clase || '',
          propiedad.datos_inmueble?.uso_principal || '',
          propiedad.datos_inmueble?.superficie_construida?.toString() || '0',
          propiedad.escritura || ''
        ];

        if (propiedad.cultivos && propiedad.cultivos.length > 0) {
          const detallesDisponibles = [...(valoracion?.detalles_cultivos || [])];

          for (let i = 0; i < propiedad.cultivos.length; i++) {
            const cultivo = propiedad.cultivos[i];
            const superficieHa = (cultivo.superficie_m2 || 0) / 10000;

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
              detalle?.codigo_catastral || '',
              cultivo.intensidad_productiva || '',
              cultivo.superficie_m2?.toString() || '',
              detalle?.superficie_ha?.toFixed(4) || '',
              detalle?.precio_ha?.toString() || '',
              detalle?.valor_estimado?.toFixed(2) || '',
              i === 0 ? valorCalculado.toFixed(2) : '',
              i === 0 ? valorOficial.toFixed(2) : '',
              i === 0 ? diferencia.absoluta.toFixed(2) : '',
              i === 0 ? diferencia.porcentaje.toFixed(2) : ''
            ]);
          }
        } else {
          rows.push([
            ...datosComunes,
            '', '', '', '', '',
            '', '', '',
            valorCalculado.toFixed(2),
            valorOficial.toFixed(2),
            diferencia.absoluta.toFixed(2),
            diferencia.porcentaje.toFixed(2)
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
            `${rows.length} filas (incluyendo cultivos desglosados)\n\n` +
            `Ahora puedes pegar (Ctrl+V) en Excel`);

      console.log(`✅ Exportación completada: ${rows.length} filas`);

    } catch (error) {
      console.error('Error al exportar:', error);
      alert('❌ Error al copiar los datos. Verifica que tu navegador permita acceso al portapapeles.');
    }
  }

  /**
   * Abre el modal de configuración
   */
  abrirConfiguracion(): void {
    // Crear una copia profunda de los valores actuales para editarlos
    this.valoresEditables = JSON.parse(JSON.stringify(this.valoresTasacion));
    this.mostrarConfiguracion = true;
  }

  /**
   * Cierra el modal de configuración sin guardar
   */
  cerrarConfiguracion(): void {
    this.mostrarConfiguracion = false;
    this.valoresEditables = null;
  }

  /**
   * Guarda los valores editados y recalcula valoraciones
   */
  guardarConfiguracion(): void {
    if (!this.valoresEditables) return;

    // Actualizar fecha de modificación
    this.valoresEditables.fecha = new Date().getFullYear().toString();

    // Guardar en localStorage
    this.configService.guardarValoresPersonalizados(this.valoresEditables);

    // Aplicar los nuevos valores
    this.valoresTasacion = this.valoresEditables;

    // Recalcular valoraciones
    this.valorarAutomaticamente();

    // Cerrar modal
    this.mostrarConfiguracion = false;
    this.valoresEditables = null;

    alert('✅ Configuración guardada. Las valoraciones se han recalculado con los nuevos valores.');
  }

  /**
   * Resetea a valores por defecto
   */
  resetearADefecto(): void {
    if (confirm('¿Estás seguro de que deseas resetear a los valores por defecto? Se perderán los valores personalizados.')) {
      this.configService.resetearADefecto();
      this.valoresTasacion = this.valoresTasacionDefecto;
      this.valorarAutomaticamente();
      this.cerrarConfiguracion();
      alert('✅ Valores reseteados a por defecto');
    }
  }

  /**
   * Verifica si está usando valores personalizados
   */
  usandoValoresPersonalizados(): boolean {
    return this.configService.tieneValoresPersonalizados();
  }

  /**
   * Obtiene los municipios principales (sin alias) agrupados
   */
  getMunicipiosPrincipales(): Array<{nombre: string, municipios: string[], codigoAth: string, provincia: string}> {
    if (!this.valoresEditables) return [];

    const grupos: Array<{nombre: string, municipios: string[], codigoAth: string, provincia: string}> = [];
    const procesados = new Set<string>();

    Object.keys(this.valoresEditables.municipios).forEach(municipio => {
      if (!procesados.has(municipio)) {
        const config = this.valoresEditables!.municipios[municipio];

        // Si no tiene alias_de, es un municipio principal
        if (!config.alias_de) {
          const municipiosGrupo = [municipio];
          procesados.add(municipio);

          // Buscar municipios que sean alias de este
          Object.keys(this.valoresEditables!.municipios).forEach(otroMunicipio => {
            const otraConfig = this.valoresEditables!.municipios[otroMunicipio];
            if (otraConfig.alias_de === municipio) {
              municipiosGrupo.push(otroMunicipio);
              procesados.add(otroMunicipio);
            }
          });

          grupos.push({
            nombre: municipiosGrupo.join(' / '),
            municipios: municipiosGrupo,
            codigoAth: config.codigo_ath,
            provincia: config.provincia
          });
        }
      }
    });

    return grupos;
  }

  /**
   * Obtiene los códigos de cultivo de un municipio
   */
  getCodigosCultivo(municipio: string): string[] {
    if (!this.valoresEditables) return [];
    const cultivosMunicipio = this.valoresEditables.municipios[municipio]?.cultivos;
    return cultivosMunicipio ? Object.keys(cultivosMunicipio) : [];
  }

  /**
   * Actualiza los valores de todos los municipios de un grupo
   */
  actualizarValorCultivo(municipios: string[], codigoCultivo: string, nuevoValor: number): void {
    if (!this.valoresEditables) return;

    municipios.forEach(municipio => {
      if (this.valoresEditables!.municipios[municipio]?.cultivos[codigoCultivo]) {
        this.valoresEditables!.municipios[municipio].cultivos[codigoCultivo].valor_por_hectarea = nuevoValor;
      }
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
  formatNumber(value: number | null | undefined): string {
    if (value === null || value === undefined) return '-';
    return new Intl.NumberFormat('es-ES', {
      minimumFractionDigits: 0,
      maximumFractionDigits: 2
    }).format(value);
  }

  /**
   * Abre el módulo de reparto de herencia
   */
  abrirReparto(): void {
    if (!this.resultadoValoracion || this.resultadoValoracion.valoraciones.length === 0) {
      alert('No hay propiedades valoradas. Por favor, espera a que se complete la valoración.');
      return;
    }
    this.mostrarReparto = true;
  }

  /**
   * Cierra el módulo de reparto de herencia
   */
  cerrarReparto(): void {
    this.mostrarReparto = false;
  }

  /**
   * Actualiza los m2 de escritura de una propiedad
   */
  actualizarM2Escritura(propiedad: Propiedad, valor: number | null): void {
    if (!propiedad.referencia_catastral) return;

    propiedad.m2_escritura = valor ?? undefined;
    this.dataService.guardarPropiedadPersonalizada(propiedad.referencia_catastral, {
      m2_escritura: valor ?? undefined
    });
  }

  /**
   * Actualiza el flag ignorarReparto de una propiedad
   */
  actualizarIgnorarReparto(propiedad: Propiedad, valor: boolean): void {
    if (!propiedad.referencia_catastral) return;

    propiedad.ignorarReparto = valor;
    this.dataService.guardarPropiedadPersonalizada(propiedad.referencia_catastral, {
      ignorarReparto: valor
    });
  }

  /**
   * Obtiene el conteo de propiedades ignoradas en el reparto
   */
  getPropiedadesIgnoradas(): number {
    return this.propiedades.filter(p => p.ignorarReparto).length;
  }
}
