export class AppError extends Error {
  constructor(public message: string, public statusCode: number = 500) {
    super(message);
    this.name = 'AppError';
  }
}

export const handleAppError = (error: unknown) => {
  console.error('[ERROR]', error);
  if (error instanceof AppError) {
    return { status: error.statusCode, message: error.message };
  }
  return { status: 500, message: 'Internal Server Error' };
};
