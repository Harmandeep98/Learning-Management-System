class ErrorHandler extends Error {
    statusCode: number;
    constructor(message: string, code: number) {
        super(message);
        this.statusCode = code;
        Error.captureStackTrace(this, this.constructor);
    }
}

export default ErrorHandler;