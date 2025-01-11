import { Router } from 'express';

const router = Router();

router.get("/",(req,res)=>{
    res.render('admin/layout', {
        title : 'Admin Dashboard',
        user: req.user,
    });
});

export default router