import {Category} from '../models/index.js';
import {
    asyncHandler,
    handleResponse,
    handleError,
    handleInternalServerError,
    validateIds,
    validateFields,
} from '../utils/index.js';
import { StatusCodes } from 'http-status-codes';

const addCategory = asyncHandler(async (req, res) => {
    try {
        // Validate required fields
        validateFields(req, { body: ['name'] });

        // Check if the category already exists
        const existingCategory = await Category.findOne({
            name: req.body.name,
        });
        if (existingCategory) {
            throw new ApiError(StatusCodes.CONFLICT, 'Category already exists');
        }

        // Create and save the category
        const category = new Category({ name: req.body.name });
        const savedCategory = await category.save();

        handleResponse(
            res,
            StatusCodes.CREATED,
            savedCategory,
            'Category created successfully.'
        );
    } catch (error) {
        handleInternalServerError(error, 'Failed to create category');
    }
});

const updateCategory = asyncHandler(async (req, res) => {
    try {
        const { id } = req.params;
        validateFields(req, { params: ['id'], body: ['name'] });
        validateIds(id);
        const updatedCategory = await Category.findByIdAndUpdate(
            id,
            { name: req.body.name },
            { new: true }
        );

        // Handle case where the category does not exist
        if (!updatedCategory) {
            throw new ApiError(StatusCodes.NOT_FOUND, 'Category not found');
        }

        handleResponse(
            res,
            StatusCodes.OK,
            updatedCategory,
            'Category updated successfully.'
        );
    } catch (error) {
        handleInternalServerError(error, 'Failed to update category');
    }
});

const deleteCategory = asyncHandler(async (req, res) => {
    try {
        const { id } = req.params;
        validateFields(req, { params: ['id'] });
        validateIds(id);

        const blogsUsingCategory = await Blog.countDocuments({ category: id });
        if (blogsUsingCategory > 0) {
            throw new ApiError(
                StatusCodes.CONFLICT,
                'Category cannot be deleted as it is linked to existing blogs'
            );
        }

        next();
        const deletedCategory = await Category.findByIdAndDelete(id);

        if(!deletedCategory) {
            throw new ApiError(StatusCodes.NOT_FOUND, 'Category not found');
        }

        handleResponse(
            res,
            StatusCodes.OK,
            deletedCategory,
            'Category deleted successfully.'
        );
    } catch (error) {
        handleInternalServerError(error, 'Failed to delete category');
    }
});

const getAllCategories = asyncHandler(async (req, res) => {
    try {
        const categories = await Category.find().select('name');
        handleResponse(res, StatusCodes.OK, categories, 'Categories fetched successfully.');
    } catch (error) {
        throw new ApiError(
            StatusCodes.INTERNAL_SERVER_ERROR,
            'Failed to fetch categories',
            error
        );
    }
});

const searchCategories = asyncHandler(async (req, res) => {
    try {
        const { query } = req.query;
        if (!query) {
            throw new ApiError(
                StatusCodes.BAD_REQUEST,
                'Search query is required'
            );
        }

        const categories = await Category.find({
            name: { $regex: query, $options: 'i' },
        });

        handleResponse(
            res,
            StatusCodes.OK,
            categories,
            'Categories searched successfully.'
        );
    } catch (error) {
        handleInternalServerError(error, 'Failed to search categories');
    }
});

const categoryController = {
    addCategory,
    updateCategory,
    deleteCategory,
    getAllCategories,
    searchCategories,
};

export default categoryController;