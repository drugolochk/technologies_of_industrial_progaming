export class ApiError extends Error {
  constructor(status, code, message, details) {
    super(message);
    this.name = "ApiError";
    this.status = status;
    this.code = code;
    this.details = details;
  }
}

export function errorHandler(err, req, res, next) {
  if (res.headersSent) {
    next(err);
    return;
  }

  if (err instanceof ApiError) {
    const payload = {
      error: {
        code: err.code,
        message: err.message,
      },
    };

    if (err.details !== undefined) {
      payload.error.details = err.details;
    }

    res.status(err.status).json(payload);
    return;
  }

  res.status(500).json({
    error: {
      code: "INTERNAL_ERROR",
      message: "Внутренняя ошибка сервера.",
    },
  });
}
