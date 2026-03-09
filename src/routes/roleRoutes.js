const express = require('express');
const roleController = require('../controllers/roleController');
const { authenticateToken, authorizeAdminOrReadAll } = require('../middleware/authMiddleware');

const router = express.Router();

router.get('/', authenticateToken, authorizeAdminOrReadAll, roleController.getAllRoles);
router.get('/:id', authenticateToken, authorizeAdminOrReadAll, roleController.getRoleById);
router.post('/', authenticateToken, authorizeAdminOrReadAll, roleController.createRole);
router.put('/:id', authenticateToken, authorizeAdminOrReadAll, roleController.updateRole);
router.delete('/:id', authenticateToken, authorizeAdminOrReadAll, roleController.softDeleteRole);

module.exports = router;
