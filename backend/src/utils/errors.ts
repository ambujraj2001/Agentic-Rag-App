export class ApiError extends Error {
  public statusCode: number;

  constructor(message: string, statusCode: number = 500) {
    super(message);
    this.name = "ApiError";
    this.statusCode = statusCode;
    Object.setPrototypeOf(this, ApiError.prototype);
  }
}

export function createApiError(
  message: string,
  statusCode: number = 500
): ApiError {
  return new ApiError(message, statusCode);
}
