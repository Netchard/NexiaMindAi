import { logger } from './logger';

/**
 * Middleware pour capturer les erreurs non gérées
 */
export const errorHandler = (error, req, res, next) => {
  logger.error({
    type: 'UNHANDLED_ERROR',
    error: error.message,
    stack: error.stack,
    method: req.method,
    path: req.path,
  });

  // Passer à l'erreur suivante
  if (next) {
    next(error);
  }
};

// Pour Next.js API Routes
export const handleApiError = (handler) => {
  return async (req, res) => {
    try {
      return await handler(req, res);
    } catch (error) {
      logger.error({
        type: 'API_ERROR',
        error: error.message,
        stack: error.stack,
        method: req.method,
        path: req.url,
      });
      return res.status(500).json({ error: 'Internal Server Error' });
    }
  };
};