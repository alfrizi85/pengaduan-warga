import {
  ArgumentsHost,
  Catch,
  ExceptionFilter,
  HttpException,
  HttpStatus,
} from '@nestjs/common';
import { Request, Response } from 'express';

@Catch()
export class HttpExceptionFilter implements ExceptionFilter {
  catch(exception: unknown, host: ArgumentsHost): void {
    const context = host.switchToHttp();
    const response = context.getResponse<Response>();
    const request = context.getRequest<Request>();

    const isHttpException = exception instanceof HttpException;

    const statusCode = isHttpException
      ? exception.getStatus()
      : HttpStatus.INTERNAL_SERVER_ERROR;

    const exceptionResponse = isHttpException
      ? exception.getResponse()
      : null;

    let message = 'Terjadi kesalahan pada server';
    let error = 'INTERNAL_SERVER_ERROR';

    if (isHttpException) {
      if (typeof exceptionResponse === 'string') {
        message = exceptionResponse;
      } else if (
        typeof exceptionResponse === 'object' &&
        exceptionResponse !== null
      ) {
        const responseBody = exceptionResponse as Record<string, unknown>;

        if (typeof responseBody.message === 'string') {
          message = responseBody.message;
        } else if (Array.isArray(responseBody.message)) {
          message = responseBody.message.join(', ');
        }

        if (typeof responseBody.error === 'string') {
          error = responseBody.error;
        }
      }
    }

    if (statusCode >= 500) {
      console.error('Internal Server Error:', exception);
    }

    response.status(statusCode).json({
      success: false,
      message,
      error,
      statusCode,
      timestamp: new Date().toISOString(),
      path: request.url,
    });
  }
}
