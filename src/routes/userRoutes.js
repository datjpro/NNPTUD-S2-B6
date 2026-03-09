const express = require('express');
const userController = require('../controllers/userController');
const { authenticateToken, authorizeAdminOrReadAll } = require('../middleware/authMiddleware');

const router = express.Router();

router.post('/', userController.createUser);
router.post('/checklogin', userController.checkLogin);
router.get('/me', authenticateToken, userController.getCurrentProfile);
router.post('/change-password', authenticateToken, userController.changePassword);
router.get('/', authenticateToken, authorizeAdminOrReadAll, userController.getAllUsers);
router.get('/:id', authenticateToken, authorizeAdminOrReadAll, userController.getUserById);
router.put('/:id', authenticateToken, authorizeAdminOrReadAll, userController.updateUser);
router.delete('/:id', authenticateToken, authorizeAdminOrReadAll, userController.softDeleteUser);

module.exports = router;
