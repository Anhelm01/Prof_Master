const express = require('express');
const router = express.Router();
const routesController = require('../controllers/routesController');
const { verifyToken, optionalAuth } = require('../middleware/auth');
const { validateRoute } = require('../middleware/validator');

router.post('/calculate', routesController.calculateAdHoc);

router.get('/', verifyToken, routesController.getUserRoutes);

router.get('/:id', optionalAuth, routesController.getRouteById);

router.post('/', verifyToken, validateRoute, routesController.createRoute);

router.put('/:id', verifyToken, validateRoute, routesController.updateRoute);

router.delete('/:id', verifyToken, routesController.deleteRoute);

router.post('/:id/places', verifyToken, routesController.addPlaceToRoute);

router.delete('/:id/places/:placeId', verifyToken, routesController.removePlaceFromRoute);

router.put('/:id/places/reorder', verifyToken, routesController.reorderRoutePlaces);

router.patch('/:id/status', verifyToken, routesController.changeRouteStatus);

module.exports = router;
