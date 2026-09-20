import {
  ExceptionFilter,
  Catch,
  ArgumentsHost,
  HttpException,
  HttpStatus,
  Logger,
} from '@nestjs/common';
import { Request, Response } from 'express';

@Catch()
export class HttpExceptionFilter implements ExceptionFilter {
  private readonly logger = new Logger(HttpExceptionFilter.name);

  catch(exception: unknown, host: ArgumentsHost) {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse<Response>();
    const request = ctx.getRequest<Request>();

    const status =
      exception instanceof HttpException
        ? exception.getStatus()
        : HttpStatus.INTERNAL_SERVER_ERROR;

    let code = 'INTERNAL_ERROR';
    let message = 'An unexpected internal error occurred.';
    let details: unknown = undefined;

    if (exception instanceof HttpException) {
      const res = exception.getResponse();
      code = HttpStatus[status] || 'HTTP_ERROR';
      if (typeof res === 'string') {
        message = res;
      } else if (typeof res === 'object' && res !== null) {
        const resObj = res as Record<string, unknown>;
        message = (resObj.message as string) || exception.message;
        details = resObj.details || (Array.isArray(resObj.message) ? resObj.message : undefined);
      }
    } else if (exception instanceof Error) {
      message = exception.message;
      this.logger.error(`Unhandled Exception at ${request.url}: ${exception.message}`, exception.stack);
    }

    const errorEnvelope = {
      code,
      message,
      details,
      path: request.url,
      timestamp: new Date().toISOString(),
    };

    response.status(status).json(errorEnvelope);
  }
}
