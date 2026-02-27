import express, { Express } from 'express';
import { config } from '@/config';
import { Logger } from '@/middleware/logger';
import { ErrorHandler } from '@/middleware/errorHandler';
import routes from '@/routes';

export function createApp(): Express {
  const app = express();

  // Middleware
  app.use(express.json());
  app.use(express.urlencoded({ extended: true }));
  app.use(express.static('src/public'));
  app.set('view engine', 'ejs');
  app.set('views', 'src/views');

  // Logger
  app.use(Logger.log);

  // Routes
  app.use(routes);

  // 404 Not Found
  app.all('*', ErrorHandler.notFound);

  // Error Handler
  app.use(ErrorHandler.handle.bind(ErrorHandler));

  return app;
}
