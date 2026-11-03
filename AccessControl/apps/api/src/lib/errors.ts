export class AppError extends Error {
  constructor(
    public readonly statusCode: number,
    message: string,
    public readonly code = 'APP_ERROR',
  ) {
    super(message);
    this.name = 'AppError';
  }
}

export const badRequest = (message: string, code = 'BAD_REQUEST') => new AppError(400, message, code);
export const unauthorized = (message = 'Não autenticado', code = 'UNAUTHORIZED') => new AppError(401, message, code);
export const forbidden = (message: string, code = 'FORBIDDEN') => new AppError(403, message, code);
export const notFound = (message: string, code = 'NOT_FOUND') => new AppError(404, message, code);
export const conflict = (message: string, code = 'CONFLICT') => new AppError(409, message, code);
export const serviceUnavailable = (message: string, code = 'SERVICE_UNAVAILABLE') => new AppError(503, message, code);
