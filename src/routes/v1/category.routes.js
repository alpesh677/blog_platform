import express from 'express';
import { categoryController } from '../../controllers/index.js';
import { authMiddleware } from '../../middlewares/index.js';
import { adminMiddleware } from '../../middlewares/index.js';

const router = express.Router();

// Apply authentication and admin middleware to all routes
router.use(authMiddleware);
router.use(adminMiddleware);

router.post('/add', categoryController.addCategory);
router.put('/update/:id', categoryController.updateCategory);
router.delete('/delete/:id', categoryController.deleteCategory);
router.get('/all', categoryController.getAllCategories);
router.get('/get/:id', categoryController.getCategoryById);
router.get('/search', categoryController.searchCategories);

export default router;
