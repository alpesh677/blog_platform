import { StatusCodes } from 'http-status-codes';
import { ApiError } from './ApiError.js';

export const handleError = (error, res) => {
    console.error('ERROR ::', error);

    if (error instanceof ApiError) {
        if (res && typeof res.status === 'function') {
            res.status(error.statusCode).json({
                success: false,
                statusCode: error.statusCode,
                message: error.message,
                errors: error.errors,
            });
        } else {
            console.error('Invalid response object provided to handleError');
            return {
                success: false,
                statusCode: error.statusCode,
                message: error.message,
                errors: error.errors,
            };
        }
    } else {
        const statusCode = StatusCodes.INTERNAL_SERVER_ERROR;
        const message = 'Internal Server Error';

        if (res && typeof res.status === 'function') {
            res.status(statusCode).json({
                success: false,
                statusCode,
                message,
            });
        } else {
            console.error('Invalid response object provided to handleError');
            return {
                success: false,
                statusCode,
                message,
            };
        }
    }
};
