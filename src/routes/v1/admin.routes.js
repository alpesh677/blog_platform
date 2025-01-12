import { Router } from 'express';
import { Blog, Category } from '../../models/index.js';
import { authMiddleware } from '../../middlewares/auth.middleware.js';
import { adminMiddleware } from '../../middlewares/admin.middleware.js';
import { blogController, categoryController } from '../../controllers/index.js';

const router = Router();

router.use(authMiddleware, adminMiddleware);

router.use((req, res, next) => {
    res.locals.layout = 'admin/layout';
    next();
});

router.get('/', async (req, res) => {
    const blogsResponse = await new Promise((resolve) => {
        blogController.getLatestBlogs(req, {
            status: () => ({ json: resolve }),
            json: resolve,
        });
    });
    const totalBlogs = await Blog.countDocuments();
    const totalCategories = await Category.countDocuments();

    if (!blogsResponse.success) {
        throw new Error(blogsResponse.message || 'Failed to fetch blogs');
    }

    // console.log("Blogs fetched:", blogsResponse.data);

    res.render('admin/layout', {
        title: 'Admin Dashboard',
        totalBlogs,
        totalCategories,
        blogs: blogsResponse.data || [],
        body: 'admin/blogs', // Add this line
    });
});

router.post('/blogs/delete/:id', async (req, res) => {
    try {
        const blogId = req.params.id;
        await new Promise((resolve, reject) => {
            blogController.deleteBlog(
                { ...req, params: { id: blogId } },
                {
                    status: () => ({ json: resolve }),
                    json: resolve,
                }
            );
        });

        res.redirect('/api/v1/admin');
    } catch (error) {
        console.error('Error deleting blog:', error);
        res.status(500).render('admin/layout', {
            title: 'Error',
            body: 'admin/error',
            error: 'Failed to delete blog',
        });
    }
});

router.get('/categories', async (req, res) => {
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

    res.render('admin/layout', {
        title: 'All Categories',
        categories: categoriesResponse.data,
        body: 'admin/categories',
    });
});

router.post('/categories/delete/:id', async (req, res) => {
    try {
        const categoryId = req.params.id;
        await new Promise((resolve, reject) => {
            categoryController.deleteCategory(
                { ...req, params: { id: categoryId } },
                {
                    status: () => ({ json: resolve }),
                    json: resolve,
                }
            );
        });

        res.redirect('/api/v1/admin/categories');
    } catch (error) {
        console.error('Error deleting category:', error);
        res.status(500).render('admin/layout', {
            title: 'Error',
            body: 'admin/error',
            error: 'Failed to delete category',
        });
    }
});

router.get('/categories/add', (req, res) => {
    res.render('admin/layout', {
        title: 'Add Category',
        body: 'admin/add-category',
    });
});

router.post('/categories/add', async (req, res) => {
    try {
        const result = await new Promise((resolve, reject) => {
            categoryController.addCategory(req, {
                status: (statusCode) => ({
                    json: (data) => resolve({ statusCode, ...data }),
                }),
                json: (data) => resolve({ statusCode: 200, ...data }),
            });
        });

        if (result.success) {
            // req.flash('success', 'Category added successfully');
            res.redirect('/api/v1/admin/categories');
        } else {
            res.status(result.statusCode).render('admin/layout', {
                title: 'Add Category',
                body: 'admin/add-category',
                error: result.message || 'Failed to add category',
            });
        }
    } catch (error) {
        console.error('Error adding category:', error);
        res.status(500).render('admin/layout', {
            title: 'Error',
            body: 'admin/error',
            error: 'An unexpected error occurred while adding the category',
        });
    }
});




export default router;
