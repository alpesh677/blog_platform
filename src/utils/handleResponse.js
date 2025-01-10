import { ApiResponse } from './ApiResponse.js';

function handleResponse(res, statusCode, data, message) {
    res.status(statusCode).json(new ApiResponse(statusCode, data, message));
}

export { handleResponse };
