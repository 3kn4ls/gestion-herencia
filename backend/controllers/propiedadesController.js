const Propiedad = require('../models/Propiedad');

// @desc    Obtener todas las propiedades
// @route   GET /api/propiedades
// @access  Public
exports.getPropiedades = async (req, res) => {
  try {
    const propiedades = await Propiedad.find().sort({ createdAt: -1 });
    res.json({
      success: true,
      count: propiedades.length,
      data: propiedades
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
};

// @desc    Obtener una propiedad por ID
// @route   GET /api/propiedades/:id
// @access  Public
exports.getPropiedadById = async (req, res) => {
  try {
    const propiedad = await Propiedad.findById(req.params.id);

    if (!propiedad) {
      return res.status(404).json({
        success: false,
        error: 'Propiedad no encontrada'
      });
    }

    res.json({
      success: true,
      data: propiedad
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
};

// @desc    Obtener una propiedad por referencia catastral
// @route   GET /api/propiedades/referencia/:ref
// @access  Public
exports.getPropiedadByReferencia = async (req, res) => {
  try {
    const propiedad = await Propiedad.findOne({
      referencia_catastral: req.params.ref
    });

    if (!propiedad) {
      return res.status(404).json({
        success: false,
        error: 'Propiedad no encontrada'
      });
    }

    res.json({
      success: true,
      data: propiedad
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
};

// @desc    Crear nueva propiedad
// @route   POST /api/propiedades
// @access  Public
exports.createPropiedad = async (req, res) => {
  try {
    const propiedad = await Propiedad.create(req.body);

    res.status(201).json({
      success: true,
      data: propiedad
    });
  } catch (error) {
    // Error de duplicado (referencia catastral única)
    if (error.code === 11000) {
      return res.status(400).json({
        success: false,
        error: 'La referencia catastral ya existe'
      });
    }

    res.status(400).json({
      success: false,
      error: error.message
    });
  }
};

// @desc    Actualizar propiedad
// @route   PUT /api/propiedades/:id
// @access  Public
exports.updatePropiedad = async (req, res) => {
  try {
    const propiedad = await Propiedad.findByIdAndUpdate(
      req.params.id,
      req.body,
      {
        new: true,
        runValidators: true
      }
    );

    if (!propiedad) {
      return res.status(404).json({
        success: false,
        error: 'Propiedad no encontrada'
      });
    }

    res.json({
      success: true,
      data: propiedad
    });
  } catch (error) {
    res.status(400).json({
      success: false,
      error: error.message
    });
  }
};

// @desc    Eliminar propiedad
// @route   DELETE /api/propiedades/:id
// @access  Public
exports.deletePropiedad = async (req, res) => {
  try {
    const propiedad = await Propiedad.findByIdAndDelete(req.params.id);

    if (!propiedad) {
      return res.status(404).json({
        success: false,
        error: 'Propiedad no encontrada'
      });
    }

    res.json({
      success: true,
      data: {},
      message: 'Propiedad eliminada'
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
};

// @desc    Buscar propiedades por filtros
// @route   POST /api/propiedades/search
// @access  Public
exports.searchPropiedades = async (req, res) => {
  try {
    const { municipio, provincia, clase, uso } = req.body;
    const query = {};

    if (municipio) query['localizacion.municipio'] = new RegExp(municipio, 'i');
    if (provincia) query['localizacion.provincia'] = new RegExp(provincia, 'i');
    if (clase) query['datos_inmueble.clase'] = new RegExp(clase, 'i');
    if (uso) query['datos_inmueble.uso_principal'] = new RegExp(uso, 'i');

    const propiedades = await Propiedad.find(query).sort({ createdAt: -1 });

    res.json({
      success: true,
      count: propiedades.length,
      data: propiedades
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
};
