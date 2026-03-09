const express = require('express');
const userRoutes = require('./userRoutes');
const roleRoutes = require('./roleRoutes');
const userController = require('../controllers/userController');
const { authenticateToken, authorizeRoles } = require('../middleware/authMiddleware');

const router = express.Router();

router.use('/users', userRoutes);
router.use('/roles', roleRoutes);
router.post('/enable', authenticateToken, authorizeRoles('admin'), userController.enableUser);
router.post('/disable', authenticateToken, authorizeRoles('admin'), userController.disableUser);

module.exports = router;
