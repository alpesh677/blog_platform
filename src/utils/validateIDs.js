import { StatusCodes } from 'http-status-codes';
import { ApiError } from './ApiError.js';
import { isValidObjectId } from 'mongoose';

function validateIds(...Ids) {
    const allInvalidIds = Ids.filter((id) => !isValidObjectId(id));

    if (allInvalidIds.length > 0) {
        throw new ApiError(
            StatusCodes.BAD_REQUEST,
            `Invalid Ids: ${allInvalidIds.join(', ')}`
        );
    }
}

export { validateIds };
