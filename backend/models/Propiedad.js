const mongoose = require('mongoose');

const CultivoSchema = new mongoose.Schema({
  subparcela: String,
  cultivo_aprovechamiento: String,
  intensidad_productiva: String,
  superficie_m2: Number
}, { _id: false });

const LocalizacionSchema = new mongoose.Schema({
  provincia: String,
  municipio: String,
  partida: String,
  poligono: String,
  parcela: String
}, { _id: false });

const DatosInmuebleSchema = new mongoose.Schema({
  clase: String,
  uso_principal: String,
  superficie_construida: Number
}, { _id: false });

const PropiedadSchema = new mongoose.Schema({
  referencia_catastral: {
    type: String,
    required: true,
    unique: true,
    index: true
  },
  fecha_extraccion: {
    type: Date,
    default: Date.now
  },
  localizacion: LocalizacionSchema,
  datos_inmueble: DatosInmuebleSchema,
  cultivos: [CultivoSchema],
  valor_referencia: Number,
  url_consultada: String,
  escritura: String,
  // Nuevos campos personalizados
  desc: {
    type: String,
    default: ''
  },
  precioManual: {
    type: Number,
    default: null
  },
  distanciaMar: {
    type: Number,
    default: null
  },
  codGrupo: {
    type: String,
    default: ''
  },
  precioValidado: {
    type: Boolean,
    default: false
  }
}, {
  timestamps: true,
  collection: 'propiedad'
});

// Índices para búsquedas frecuentes
PropiedadSchema.index({ 'localizacion.municipio': 1 });
PropiedadSchema.index({ 'localizacion.provincia': 1 });
PropiedadSchema.index({ 'datos_inmueble.clase': 1 });

module.exports = mongoose.model('Propiedad', PropiedadSchema);
