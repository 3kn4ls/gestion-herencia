const Reparto = require('../models/Reparto');

// @desc    Obtener todos los repartos
// @route   GET /api/repartos
// @access  Public
exports.getRepartos = async (req, res) => {
  try {
    const repartos = await Reparto.find().sort({ fechaModificacion: -1 });

    res.json({
      success: true,
      count: repartos.length,
      data: repartos
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
};

// @desc    Obtener un reparto por ID
// @route   GET /api/repartos/:id
// @access  Public
exports.getRepartoById = async (req, res) => {
  try {
    const reparto = await Reparto.findById(req.params.id);

    if (!reparto) {
      return res.status(404).json({
        success: false,
        error: 'Reparto no encontrado'
      });
    }

    res.json({
      success: true,
      data: reparto
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
};

// @desc    Crear nuevo reparto
// @route   POST /api/repartos
// @access  Public
exports.createReparto = async (req, res) => {
  try {
    const reparto = await Reparto.create(req.body);

    res.status(201).json({
      success: true,
      data: reparto
    });
  } catch (error) {
    res.status(400).json({
      success: false,
      error: error.message
    });
  }
};

// @desc    Actualizar reparto
// @route   PUT /api/repartos/:id
// @access  Public
exports.updateReparto = async (req, res) => {
  try {
    const reparto = await Reparto.findByIdAndUpdate(
      req.params.id,
      req.body,
      {
        new: true,
        runValidators: true
      }
    );

    if (!reparto) {
      return res.status(404).json({
        success: false,
        error: 'Reparto no encontrado'
      });
    }

    res.json({
      success: true,
      data: reparto
    });
  } catch (error) {
    res.status(400).json({
      success: false,
      error: error.message
    });
  }
};

// @desc    Eliminar reparto
// @route   DELETE /api/repartos/:id
// @access  Public
exports.deleteReparto = async (req, res) => {
  try {
    const reparto = await Reparto.findByIdAndDelete(req.params.id);

    if (!reparto) {
      return res.status(404).json({
        success: false,
        error: 'Reparto no encontrado'
      });
    }

    res.json({
      success: true,
      data: {},
      message: 'Reparto eliminado'
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
};

// @desc    Buscar repartos por nombre
// @route   GET /api/repartos/search/:nombre
// @access  Public
exports.searchRepartos = async (req, res) => {
  try {
    const repartos = await Reparto.find({
      nombre: new RegExp(req.params.nombre, 'i')
    }).sort({ fechaModificacion: -1 });

    res.json({
      success: true,
      count: repartos.length,
      data: repartos
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
};
