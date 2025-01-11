import { Router } from 'express';

import authRouter from "./auth.routes.js";
import blogRouter from "./blog.routes.js";
import categoryRouter from "./category.routes.js"
import adminRouter from "./admin.routes.js"

const v1Router = Router();
v1Router.use('/auth',authRouter)
v1Router.use('/blog',blogRouter)
v1Router.use('/category', categoryRouter);
v1Router.use('/admin', adminRouter);

export default v1Router;