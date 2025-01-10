import { StatusCodes } from 'http-status-codes';
import { ApiError } from './ApiError.js';

function handleInternalServerError(error, message) {
    if (error instanceof ApiError) {
        throw error;
    }
    throw new ApiError(StatusCodes.INTERNAL_SERVER_ERROR, message);
}

export { handleInternalServerError };
