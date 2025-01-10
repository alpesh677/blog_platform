import { Router } from 'express';
import { authController } from '../../controllers/index.js';
import { authMiddleware } from '../../middlewares/auth.middleware.js';

const router = Router();
router.get('/signup', (req, res) => {
    try {
        res.render('auth/signup', {
            body: 'auth/signup',
            user: req.user,
        });
    } catch (error) {
        console.error('Render Error:', error);
        res.status(500).send('Error rendering signup page');
    }
});
router.get('/signin', (req, res) => {
    try {
        res.render('auth/signin', {
            body: 'auth/signin',
            user: req.user,
        });
    } catch (error) {
        console.error('Render Error:', error);
        res.status(500).send('Error rendering signin page');
    }
});

router.post('/signup', authController.signUp);
router.post('/signin', authController.signIn);
router.get('/me', authMiddleware, authController.me);
router.post('/logout', authController.logout);

export default router;
