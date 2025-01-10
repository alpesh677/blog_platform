import { Router } from 'express';
import v1Router from './v1/index.js';
import { blogController } from "../controllers/index.js"
import { authMiddleware } from '../middlewares/auth.middleware.js';

const router = Router();
router.get('/', blogController.getLatestBlogs, (req, res) => {
    res.render('layout/main', {
        body: 'home',
        blogs: res.locals.latestBlogs || [],
    });
});


router.use('/v1', v1Router);

export default router;
