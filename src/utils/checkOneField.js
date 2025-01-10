import { StatusCodes } from 'http-status-codes';
import { ApiError } from './ApiError.js';

export default function checkOneField(req, allFields) {
    if (allFields?.length > 0) {
        const isOneFieldPresent = allFields.some((field) => req.body[field]);
        if (!isOneFieldPresent) {
            throw new ApiError(
                StatusCodes.BAD_REQUEST,
                `At-least one field required from ${allFields}`
            );
        }
    }
}
