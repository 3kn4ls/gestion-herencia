const express = require('express');
const router = express.Router();
const {
  getRepartos,
  getRepartoById,
  createReparto,
  updateReparto,
  deleteReparto,
  searchRepartos
} = require('../controllers/repartosController');

router.route('/')
  .get(getRepartos)
  .post(createReparto);

router.route('/search/:nombre')
  .get(searchRepartos);

router.route('/:id')
  .get(getRepartoById)
  .put(updateReparto)
  .delete(deleteReparto);

module.exports = router;
