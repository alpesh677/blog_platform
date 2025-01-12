import { Router } from 'express';
import { blogController, categoryController } from '../../controllers/index.js';
import { authMiddleware } from '../../middlewares/auth.middleware.js';
import { adminMiddleware } from '../../middlewares/admin.middleware.js';
import { upload } from '../../middlewares/multer.middleware.js';

const router = Router();

//public routes
router.get('/latest', blogController.getLatestBlogs);
router.get('/search', blogController.searchBlogs);
router.get('/', async (req, res) => {
    try {
        const blogs = await new Promise((resolve, reject) => {
            const fakeRes = {
                status: () => fakeRes,
                json: (data) => {
                    if (data.success) {
                        resolve(data.data);
                    } else {
                        reject(new Error(data.message));
                    }
                },
            };

            blogController.getLatestBlogs(req, fakeRes);
        });

        // console.log('Blogs fetched:', blogs);

        res.render('layout/main', {
            body: 'home',
            blogs: blogs || [],
            user: req.user || null,
        });
    } catch (error) {
        console.error('Error fetching blogs:', error);
    }
});

router.get('/new', authMiddleware, async (req, res) => {
    // console.log('new route');
    try {
        const categoriesResponse = await new Promise((resolve) => {
            categoryController.getAllCategories(req, {
                status: () => ({ json: resolve }),
                json: resolve,
            });
        });

        if (!categoriesResponse.success) {
            throw new Error(
                categoriesResponse.message || 'Failed to fetch categories'
            );
        }

        res.render('layout/main', {
            body: 'blog/new',
            categories: categoriesResponse.data,
            user: req.user,
        });
    } catch (error) {
        console.error('Error fetching categories:', error);
    }
});

//private routes
router.post(
    '/add',
    upload.single('image'),
    authMiddleware,
    async (req, res, next) => {
        try {
            // Using the Promise-based pattern to handle the blog creation process
            const blogResponse = await new Promise((resolve, reject) => {
                blogController.addBlog(req, res, (err) => {
                    if (err) {
                        reject(err); 
                    } else {
                        resolve(res);
                    }
                });
            });

            // Once resolved, the redirect happens
            res.render('layout/main', {
                body: 'home',
            });
        } catch (err) {
            next(err); // Pass the error to the error handler
        }
    }
);


router.put('/update/:id',authMiddleware,upload.single('image'),async (req, res) => {
        try {
            const blogId = req.params.id;
            await new Promise((resolve, reject) => {
                blogController.updateBlog(
                    { ...req, params: { id: blogId } },
                    {
                        status: () => ({ json: resolve }),
                        json: resolve,
                    }
                );
            });

            res.redirect('/api/v1/blog/');
        } catch (error) {
            console.error('Error updating blog:', error);
            res.status(500).render('admin/layout', {
                title: 'Error',
                body: 'admin/error',
                error: 'Failed to update blog',
            });
        }
    }
);

router.post('/delete/:id', authMiddleware ,async (req, res) => {
    try {
        const blogId = req.params.id;
        console.log("blog id in the delete route", blogId);
        await new Promise((resolve, reject) => {
            blogController.deleteBlog(
                { ...req, params: { id: blogId } },
                {
                    status: () => ({ json: resolve }),
                    json: resolve,
                }
            );
        });

        res.redirect('/api/v1/blog/');
    } catch (error) {
        console.error('Error deleting blog:', error);
        res.status(500).render('admin/layout', {
            title: 'Error',
            body: 'admin/error',
            error: 'Failed to delete blog',
        });
    }
});

router.get('/all', authMiddleware, blogController.getBlogs);
router.get('/get/:id', authMiddleware, blogController.getBlogByID);
router.get('/category/:id', authMiddleware, blogController.getBlogByCatagories);

router.get("/edit/:slug",authMiddleware,async(req,res)=>{
    try {
        const blogResponse = await new Promise((resolve, reject) => {
            blogController.getBlogBySlug(req, {
                status: () => ({ json: resolve }),
                json: resolve,
            });
        });

        if (!blogResponse.success) {
            throw new Error(blogResponse.message || 'Failed to fetch blog');
        }

        const blog = blogResponse.data;
        console.log('data in the blog by slug', blog);
        if (!blog) {
            return res.status(404).render('layout/main', {
                body: 'error',
                message: 'Blog not found',
                user: req.user || null,
            });
        }

        const categoriesResponse = await new Promise((resolve) => {
            categoryController.getAllCategories(req, {
                status: () => ({ json: resolve }),
                json: resolve,
            });
        });

        if (!categoriesResponse.success) {
            throw new Error(
                categoriesResponse.message || 'Failed to fetch categories'
            );
        }
        res.render('layout/main', {
            body: 'blog/edit',
            blog: blog,
            categories: categoriesResponse.data,
            user: req.user || null,
        });
    } catch (error) {
        console.error('Error fetching blog:', error);
        res.status(500).render('layout/main', {
            body: 'error',
            message: 'Error loading blog: ' + error.message,
            user: req.user || null,
        });
    }
})

router.get('/:slug',authMiddleware ,async (req, res) => {
    try {
        const blogResponse = await new Promise((resolve, reject) => {
            blogController.getBlogBySlug(req, {
                status: () => ({ json: resolve }),
                json: resolve,
            });
        });

        if (!blogResponse.success) {
            throw new Error(blogResponse.message || 'Failed to fetch blog');
        }

        const blog = blogResponse.data;
        // console.log('data in the blog by slug', blog);
        // console.log('user in the blog by slug', req.user);

        if (!blog) {
            return res.status(404).render('layout/main', {
                body: 'error',
                message: 'Blog not found',
                user: req.user || null,
            });
        }

        res.render('layout/main', {
            body: 'blog/single',
            blog: blog,
            user: req.user || null,
        });
    } catch (error) {
        console.error('Error fetching blog:', error);
        res.status(500).render('layout/main', {
            body: 'error',
            message: 'Error loading blog: ' + error.message,
            user: req.user || null,
        });
    }
});

export default router;
