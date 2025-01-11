import { Blog, Category } from '../models/index.js';
import { StatusCodes } from 'http-status-codes';
import {
    ApiError,
    asyncHandler,
    handleError,
    handleInternalServerError,
    handleResponse,
    validateFields,
    validateIds,
} from '../utils/index.js';
import cloudinaryUtils from '../utils/cloudinary.js';

const { uploadImageOnCloudinary } = cloudinaryUtils;

const addBlog = asyncHandler(async (req, res) => {
    try {
        validateFields(req, {
            body: ['title', 'categories', 'description', 'content'],
        });

        const { title, categories, description, content } = req.body;
        const categoryIds = Array.isArray(categories)
            ? categories
            : [categories];

        // Validate that all category IDs exist
        const validCategories = await Category.find({
            _id: { $in: categoryIds },
        });
        if (validCategories.length !== categoryIds.length) {
            throw new ApiError(
                StatusCodes.BAD_REQUEST,
                'Invalid category ID(s) provided'
            );
        }

        let thumbnailImage = null;
        if (req.file) {
            const cloudinaryResponse = await uploadImageOnCloudinary(
                req.file.path
            );
            if (!cloudinaryResponse) {
                throw new ApiError(
                    StatusCodes.INTERNAL_SERVER_ERROR,
                    'Failed to upload image to Cloudinary.'
                );
            }
            thumbnailImage = cloudinaryResponse.secure_url;
        }

        // Create and save the blog
        const blog = new Blog({
            title,
            categories: categoryIds,
            description,
            content,
            image : thumbnailImage,
            author: req.user._id,
        });

        const savedBlog = await blog.save();

        handleResponse(
            res,
            StatusCodes.CREATED,
            savedBlog,
            'Blog created successfully.'
        );
    } catch (error) {
        throw new ApiError(
            StatusCodes.INTERNAL_SERVER_ERROR,
            'Failed to create blog',
            error
        );
    }
});

const updateBlog = asyncHandler(async (req, res) => {
    try {
        // Validate required ID parameter
        validateFields(req, { params: ['id'] });
        validateIds(req.params.id);

        // Validate optional fields in request body
        const { title, description, content, categories } = req.body;

        // Handle image upload if a new file is provided
        let image = req.body.image;
        if (req.file) {
            const cloudinaryResponse = await uploadImageOnCloudinary(
                req.file.path
            );
            if (!cloudinaryResponse) {
                throw new ApiError(
                    StatusCodes.INTERNAL_SERVER_ERROR,
                    'Failed to upload image to Cloudinary.'
                );
            }
            image = cloudinaryResponse.secure_url;
        }

        // Find and update the blog
        const blog = await Blog.findOneAndUpdate(
            { _id: req.params.id, author: req.user._id }, // Ensure user is the author
            { title, description, content, image, categories },
            { new: true } // Return the updated blog
        );

        if (!blog) {
            throw new ApiError(
                StatusCodes.NOT_FOUND,
                'Blog not found or you are not the author.'
            );
        }

        // Respond with the updated blog
        handleResponse(res, StatusCodes.OK, blog, 'Blog updated successfully.');
    } catch (error) {
        handleError(error, res);
    }
});

const deleteBlog = asyncHandler(async (req, res) => {
    try {
        // Validate required ID parameter
        validateFields(req, { params: ['id'] });
        validateIds(req.params.id);

        // Find the blog by ID
        const blog = await Blog.findById(req.params.id);
        if (!blog || String(blog.author) !== String(req.user._id)) {
            throw new ApiError(
                StatusCodes.NOT_FOUND,
                'Blog not found or you are not the author.'
            );
        }

        await Blog.findByIdAndDelete(req.params.id);

        await Comment.deleteMany({ blog: blog._id });

        handleResponse(res, StatusCodes.OK, null, 'Blog deleted successfully.');
    } catch (error) {
        handleError(error, res);
    }
});

const getBlogBySlug = asyncHandler(async (req, res) => {
    try {
        validateFields(req, { params: ['slug'] });

        if (!/^[a-z0-9-]+$/i.test(req.params.slug)) {
            throw new ApiError(StatusCodes.BAD_REQUEST, 'Invalid slug format');
        }

        // Aggregate pipeline to retrieve the blog and populate related data
        const blog = await Blog.aggregate([
            {
                $match: { slug: req.params.slug },
            },
            {
                $lookup: {
                    from: 'categories',
                    localField: 'categories',
                    foreignField: '_id',
                    as: 'categories',
                },
            },
            {
                $lookup: {
                    from: 'users',
                    localField: 'author',
                    foreignField: '_id',
                    as: 'author',
                },
            },
            {
                $unwind: {
                    path: '$author',
                    preserveNullAndEmptyArrays: true,
                },
            },
            {
                $lookup: {
                    from: 'comments',
                    let: { blogId: '$_id' },
                    pipeline: [
                        { $match: { $expr: { $eq: ['$blog', '$$blogId'] } } },
                        {
                            $lookup: {
                                from: 'users',
                                localField: 'author',
                                foreignField: '_id',
                                as: 'authorDetails',
                            },
                        },
                        { $unwind: '$authorDetails' },
                        {
                            $project: {
                                text: 1,
                                author: { username: '$authorDetails.username' },
                            },
                        },
                    ],
                    as: 'comments',
                },
            },
            {
                $project: {
                    title: 1,
                    slug: 1,
                    image: 1,
                    description: 1,
                    content: 1,
                    categories: { name: 1 },
                    author: { username: 1 },
                    comments: 1,
                    createdAt: 1,
                },
            },
        ]).hint({ slug: 1 });

        // Handle case where blog is not found
        // if (!blog || blog.length === 0) {
        //     console.log("error in getblogby slug")
        //     throw new ApiError(StatusCodes.NOT_FOUND, 'Blog not found');
        // }

        // Send the successful response
        handleResponse(
            res,
            StatusCodes.OK,
            blog[0],
            'Blog retrieved successfully.'
        );
    } catch (error) {
        handleInternalServerError(error, 'Failed to retrieve the blog');
    }
});

const getLatestBlogs = asyncHandler(async (req, res) => {
    try {
        const blogs = await Blog.aggregate([
            {
                $sort: { createdAt: -1 },
            },
            {
                $limit: 10,
            },
            {
                $lookup: {
                    from: 'categories',
                    localField: 'categories',
                    foreignField: '_id',
                    as: 'categories',
                },
            },
            {
                $lookup: {
                    from: 'users',
                    localField: 'author',
                    foreignField: '_id',
                    as: 'author',
                },
            },
            {
                $unwind: {
                    path: '$author',
                    preserveNullAndEmptyArrays: true, 
                },
            },
            {
                $project: {
                    title: 1,
                    slug: 1,
                    description: 1,
                    image: 1,
                    createdAt: 1,
                    categories: { name: 1 }, // Include only category names
                    author: { username: 1 }, // Include only author's username
                },
            },
        ]);
        return handleResponse(
            res,
            StatusCodes.OK,
            blogs,
            'Blogs fetched successfully.'
        );
    } catch (error) {
        console.log("Error in controller latest blog")
        handleError(error, 'Failed to retrieve latest blogs');
    }
});

const searchBlogs = asyncHandler(async (req, res) => {
    try {
        const page = parseInt(req.query.page, 10) || 1;
        const limit = parseInt(req.query.limit, 10) || 10;
        const query = req.query.query;

        if (!query) {
            throw new ApiError(StatusCodes.BAD_REQUEST, 'Query is required');
        }

        const skip = (page - 1) * limit;

        const searchPipeline = [
            {
                $search: {
                    index: 'default',
                    compound: {
                        should: [
                            {
                                text: {
                                    query: query,
                                    path: ['title', 'content'],
                                    fuzzy: {
                                        maxEdits: 2,
                                        prefixLength: 3,
                                    },
                                },
                            },
                            {
                                text: {
                                    query: query,
                                    path: 'author.username',
                                    fuzzy: {
                                        maxEdits: 2,
                                        prefixLength: 3,
                                    },
                                },
                            },
                        ],
                    },
                },
            },
            { $addFields: { score: { $meta: 'searchScore' } } },
            { $sort: { score: -1 } },
            { $skip: skip },
            { $limit: limit },
            {
                $lookup: {
                    from: 'categories',
                    localField: 'categories',
                    foreignField: '_id',
                    as: 'categories',
                },
            },
            {
                $lookup: {
                    from: 'users',
                    localField: 'author',
                    foreignField: '_id',
                    as: 'author',
                },
            },
            { $unwind: { path: '$author', preserveNullAndEmptyArrays: true } },
            {
                $project: {
                    title: 1,
                    slug: 1,
                    description: 1,
                    image: 1,
                    createdAt: 1,
                    categories: { name: 1 },
                    author: { username: 1 },
                    score: 1,
                },
            },
        ];

        const result = await Blog.aggregate([
            {
                $facet: {
                    blogs: searchPipeline,
                    totalCount: [searchPipeline[0], { $count: 'total' }],
                },
            },
        ]);

        const blogs = result[0].blogs;
        const total =
            result[0].totalCount.length > 0 ? result[0].totalCount[0].total : 0;

        const response = {
            blogs,
            pagination: {
                total,
                page,
                limit,
                totalPages: Math.ceil(total / limit),
            },
        };

        handleResponse(
            res,
            StatusCodes.OK,
            response,
            'Blogs retrieved successfully'
        );
    } catch (error) {
        handleInternalServerError(error, 'Failed to retrieve blogs');
    }
});

const getBlogs = asyncHandler(async (req, res) => {
    try {
        const {
            page = 1,
            limit = 10,
            sort = '-createdAt',
            search = '',
            filter = '{}',
        } = req.query;

        let filterCriteria;
        try {
            filterCriteria = JSON.parse(filter);
        } catch {
            throw new ApiError(
                StatusCodes.BAD_REQUEST,
                'Invalid filter format. Expected JSON.'
            );
        }

        const pipeline = [];

        if (search) {
            pipeline.push({
                $match: {
                    $text: { $search: search },
                },
            });
        }

        pipeline.push({
            $match: filterCriteria,
        });

        pipeline.push({
            $sort: { [sort.replace('-', '')]: sort.startsWith('-') ? -1 : 1 },
        });

        const skip = (parseInt(page, 10) - 1) * parseInt(limit, 10);
        pipeline.push({ $skip: skip });
        pipeline.push({ $limit: parseInt(limit, 10) });

        pipeline.push(
            {
                $lookup: {
                    from: 'categories',
                    localField: 'categories',
                    foreignField: '_id',
                    as: 'categories',
                },
            },
            {
                $lookup: {
                    from: 'users',
                    localField: 'author',
                    foreignField: '_id',
                    as: 'author',
                },
            },
            {
                $unwind: {
                    path: '$author',
                    preserveNullAndEmptyArrays: true,
                },
            }
        );

        pipeline.push({
            $project: {
                title: 1,
                slug: 1,
                description: 1,
                image: 1,
                createdAt: 1,
                categories: { name: 1 },
                author: { username: 1 },
            },
        });

        const blogs = await Blog.aggregate(pipeline);

        const totalBlogs = await Blog.countDocuments(filterCriteria);

        const response = {
            blogs,
            pagination: {
                total: totalBlogs,
                page: parseInt(page, 10),
                limit: parseInt(limit, 10),
                totalPages: Math.ceil(totalBlogs / limit),
            },
        };

        handleResponse(
            res,
            StatusCodes.OK,
            response,
            'Blogs retrieved successfully.'
        );
    } catch (error) {
        handleInternalServerError(error, 'Failed to retrieve blogs');
    }
});

const getBlogByCatagories = asyncHandler(async (req, res) => {
    try {
        const { categoryId } = req.params;

        const { page = 1, limit = 1, sort = '-createdAt' } = req.query;

        validateFields(categoryId);

        const pipeline = [
            {
                $match: {
                    categories: { $in: [categoryId] },
                },
            },
            {
                $sort: {
                    [sort.replace('-', '')]: sort.startsWith('-') ? -1 : 1,
                },
            },
            {
                $skip: (parseInt(page, 10) - 1) * parseInt(limit, 10),
            },
            {
                $limit: parseInt(limit, 10),
            },
            {
                $lookup: {
                    from: 'categories',
                    localField: 'categories',
                    foreignField: '_id',
                    as: 'categories',
                },
            },
            {
                $lookup: {
                    from: 'users',
                    localField: 'author',
                    foreignField: '_id',
                    as: 'author',
                },
            },
            {
                $unwind: {
                    path: '$author',
                    preserveNullAndEmptyArrays: true,
                },
            },
            {
                $project: {
                    title: 1,
                    slug: 1,
                    description: 1,
                    image: 1,
                    createdAt: 1,
                    categories: { name: 1 },
                    author: { username: 1 },
                },
            },
        ];

        const blogs = await Blog.aggregate(pipeline);

        const totalBlogs = await Blog.countDocuments({
            categories: { $in: [categoryId] },
        });

        const response = {
            blogs,
            pagination: {
                total: totalBlogs,
                page: parseInt(page, 10),
                limit: parseInt(limit, 10),
                totalPages: Math.ceil(totalBlogs / limit),
            },
        };

        handleResponse(
            res,
            StatusCodes.OK,
            response,
            'Blogs retrived successfully'
        );
    } catch (error) {
        handleInternalServerError(error, 'Failed to retrieve the blog');
    }
});

const getBlogByID = asyncHandler(async (req, res) => {
    try {
        const { categoryId } = req.params;
        const { page = 1, limit = 10, sort = '-createdAt' } = req.query;

        // Validate category ID
        validateIds(categoryId);

        // Aggregation pipeline to retrieve blogs by category
        const pipeline = [
            {
                $match: { categories: { $in: [categoryId] } }, // Filter by category
            },
            {
                $sort: {
                    [sort.replace('-', '')]: sort.startsWith('-') ? -1 : 1,
                }, // Sort blogs
            },
            {
                $skip: (parseInt(page, 10) - 1) * parseInt(limit, 10), // Pagination skip
            },
            {
                $limit: parseInt(limit, 10), // Pagination limit
            },
            {
                $lookup: {
                    from: 'categories',
                    localField: 'categories',
                    foreignField: '_id',
                    as: 'categories',
                },
            },
            {
                $lookup: {
                    from: 'users',
                    localField: 'author',
                    foreignField: '_id',
                    as: 'author',
                },
            },
            {
                $unwind: {
                    path: '$author',
                    preserveNullAndEmptyArrays: true, // Handle blogs without authors
                },
            },
            {
                $project: {
                    title: 1,
                    slug: 1,
                    description: 1,
                    image: 1,
                    createdAt: 1,
                    categories: { name: 1 }, // Include only category names
                    author: { username: 1 }, // Include only author's username
                },
            },
        ];

        // Execute aggregation
        const blogs = await Blog.aggregate(pipeline);

        // Total count for pagination
        const totalBlogs = await Blog.countDocuments({
            categories: { $in: [categoryId] },
        });

        // Prepare response
        const response = {
            blogs,
            pagination: {
                total: totalBlogs,
                page: parseInt(page, 10),
                limit: parseInt(limit, 10),
                totalPages: Math.ceil(totalBlogs / limit),
            },
        };

        handleResponse(
            res,
            StatusCodes.OK,
            response,
            'Blogs retrieved successfully.'
        );
    } catch (error) {
        handleInternalServerError(
            error,
            'Failed to retrieve blogs by category'
        );
    }
});

const blogController = {
    addBlog,
    updateBlog,
    deleteBlog,
    getLatestBlogs,
    searchBlogs,
    getBlogs,
    getBlogByID,
    getBlogByCatagories,
    getBlogBySlug,
};

export default blogController;
