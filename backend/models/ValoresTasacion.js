const mongoose = require('mongoose');

const CultivoMunicipioSchema = new mongoose.Schema({
  nombre: String,
  valor_por_hectarea: Number
}, { _id: false });

const MunicipioSchema = new mongoose.Schema({
  nombre: String,
  provincia: String,
  cultivos: mongoose.Schema.Types.Mixed, // Objeto con códigos de cultivo como keys
  alias_de: String
}, { _id: false });

const ValoresDefectoSchema = new mongoose.Schema({
  valor_por_hectarea: Number,
  descripcion: String
}, { _id: false });

const ValoresTasacionSchema = new mongoose.Schema({
  fecha: String,
  fuente: String,
  descripcion: String,
  municipios: {
    type: Map,
    of: mongoose.Schema.Types.Mixed
  },
  valores_por_defecto: ValoresDefectoSchema
}, {
  timestamps: true,
  collection: 'valores_tasacion'
});

// Solo puede haber un documento en esta colección
ValoresTasacionSchema.pre('save', async function(next) {
  // Si es un nuevo documento y ya existe uno, lanzar error
  if (this.isNew) {
    const count = await this.constructor.countDocuments();
    if (count > 0) {
      throw new Error('Solo puede existir un documento de ValoresTasacion. Use update en su lugar.');
    }
  }
  next();
});

module.exports = mongoose.model('ValoresTasacion', ValoresTasacionSchema);
