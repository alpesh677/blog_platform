import { StatusCodes } from 'http-status-codes';
import { ApiError } from './ApiError.js';

function validateFields(req, requiredFields) {
    const missingFields = {
        body: [],
        params: [],
    };

    if (requiredFields?.body) {
        missingFields.body = requiredFields.body.filter(
            (field) => !req.body[field]
        );
    }

    if (requiredFields?.params) {
        missingFields.params = requiredFields.params.filter(
            (field) => !req.params[field]
        );
    }

    const allMissingFields = [...missingFields.body, ...missingFields.params];

    if (allMissingFields.length > 0) {
        throw new ApiError(
            StatusCodes.BAD_REQUEST,
            `Missing fields: ${allMissingFields.join(', ')}`
        );
    }
}

export { validateFields };
