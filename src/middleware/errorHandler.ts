import { Request, Response, NextFunction } from 'express';
import * as ejs from 'ejs';
import * as path from 'path';

export class ErrorHandler {
  static handle(err: any, req: Request, res: Response, next: NextFunction) {
    console.error('Error:', err);

    if (err instanceof SyntaxError && 'body' in err) {
      return res.status(400).json({
        success: false,
        error: 'INVALID_JSON',
        message: 'JSON inválido no corpo da requisição',
      });
    }

    res.status(500).json({
      success: false,
      error: 'INTERNAL_SERVER_ERROR',
      message: 'Erro interno do servidor',
      ...(process.env.NODE_ENV === 'development' && { details: err.message }),
    });
  }

  static notFound(req: Request, res: Response) {
    // If accepting HTML, render error page
    if (req.accepts('html')) {
      try {
        const viewPath = path.join(process.cwd(), 'src', 'views', 'errors', '404.ejs');
        ejs.renderFile(viewPath, {}, {}, (err: any, html: string) => {
          if (err) {
            return res.status(404).json({
              success: false,
              error: 'NOT_FOUND',
              message: `Página não encontrada: ${req.method} ${req.path}`,
            });
          }
          res.status(404).render('layout/main', {
            title: '404 - Página Não Encontrada',
            body: html,
          });
        });
      } catch (err) {
        res.status(404).json({
          success: false,
          error: 'NOT_FOUND',
          message: `Página não encontrada: ${req.method} ${req.path}`,
        });
      }
    } else {
      // JSON response for API calls
      res.status(404).json({
        success: false,
        error: 'NOT_FOUND',
        message: `Rota ${req.method} ${req.path} não encontrada`,
      });
    }
  }
}
