class ApiError extends Error {
    constructor(
        statusCode,
        message = 'Something went wrong',
        data = null,
        errors = []
    ) {
        super(message);
        this.statusCode = statusCode;
        this.errors = errors;
        this.data = data;
        this.success = false;
    }
}

export { ApiError };
