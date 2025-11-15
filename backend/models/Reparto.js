const mongoose = require('mongoose');

const PropiedadAsignadaSchema = new mongoose.Schema({
  referencia_catastral: String,
  valor: Number,
  superficie: Number,
  tipo: {
    type: String,
    enum: ['rustico', 'urbano']
  }
}, { _id: false });

const HerederoSchema = new mongoose.Schema({
  id: Number,
  nombre: String,
  propiedades: [PropiedadAsignadaSchema],
  valorTotal: Number,
  superficieTotal: Number,
  cantidadRusticas: Number,
  cantidadUrbanas: Number
}, { _id: false });

const ConfiguracionRepartoSchema = new mongoose.Schema({
  numeroHerederos: Number,
  criterioBalance: {
    type: String,
    enum: ['valor', 'mixto']
  },
  permitirDesequilibrio: Boolean,
  porcentajeDesequilibrioMaximo: Number
}, { _id: false });

const EstadisticasRepartoSchema = new mongoose.Schema({
  valorTotal: Number,
  valorPromedioPorHeredero: Number,
  desviacionEstandar: Number,
  desviacionPorcentual: Number,
  diferenciaMaxMin: Number,
  herederoMayor: {
    id: Number,
    valor: Number
  },
  herederoMenor: {
    id: Number,
    valor: Number
  },
  equilibrado: Boolean
}, { _id: false });

const RepartoSchema = new mongoose.Schema({
  nombre: {
    type: String,
    required: true
  },
  descripcion: String,
  herederos: [HerederoSchema],
  configuracion: ConfiguracionRepartoSchema,
  estadisticas: EstadisticasRepartoSchema,
  fechaCreacion: {
    type: Date,
    default: Date.now
  },
  fechaModificacion: {
    type: Date,
    default: Date.now
  }
}, {
  timestamps: true,
  collection: 'reparto'
});

// Índice para búsquedas por nombre
RepartoSchema.index({ nombre: 1 });

// Actualizar fecha de modificación antes de guardar
RepartoSchema.pre('save', function(next) {
  this.fechaModificacion = new Date();
  next();
});

module.exports = mongoose.model('Reparto', RepartoSchema);
