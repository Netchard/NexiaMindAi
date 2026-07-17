import { format, createLogger, transports as winstonTransports } from 'winston';
import DailyRotateFile from 'winston-daily-rotate-file';
const { combine, timestamp, printf, json, colorize, errors } = format;

// Système de fichiers en lecture seule sur les plateformes serverless (Vercel, AWS Lambda, ...)
// -> on n'active les transports fichiers qu'en environnement local/dev.
const isServerless = Boolean(
  process.env.VERCEL || process.env.AWS_LAMBDA_FUNCTION_NAME || process.env.NETLIFY
);

// Format personnalisé pour la console
const consoleFormat = combine(
  colorize(),
  timestamp({ format: 'YYYY-MM-DD HH:mm:ss' }),
  printf((info) => {
    return `${info.timestamp} ${info.level}: ${info.message}`;
  })
);

// Configuration des transports
const transportList: (winstonTransports.ConsoleTransportInstance | DailyRotateFile)[] = [
  // Console transport (toujours actif - capturé par Vercel/plateformes serverless)
  new winstonTransports.Console({
    level: 'info',
    format: consoleFormat,
  }),
];

// Fichiers de logs locaux (non disponibles en environnement serverless)
if (!isServerless) {
  // Format JSON pour les fichiers
  const fileFormat = combine(
    timestamp({ format: 'YYYY-MM-DD HH:mm:ss' }),
    errors({ stack: true }),
    json()
  );

  transportList.push(
    // Fichier pour les erreurs
    new DailyRotateFile({
      filename: 'logs/error-%DATE%.log',
      datePattern: 'YYYY-MM-DD',
      maxSize: '20m',
      maxFiles: '30d',
      level: 'error',
      format: fileFormat,
    }),

    // Fichier pour toutes les logs
    new DailyRotateFile({
      filename: 'logs/combined-%DATE%.log',
      datePattern: 'YYYY-MM-DD',
      maxSize: '20m',
      maxFiles: '30d',
      level: 'info',
      format: fileFormat,
    }),

    // Fichier dédié aux requêtes API
    new DailyRotateFile({
      filename: 'logs/api-%DATE%.log',
      datePattern: 'YYYY-MM-DD',
      maxSize: '20m',
      maxFiles: '30d',
      level: 'http',
      format: fileFormat,
    })
  );
}

// Créer le logger
const logger = createLogger({
  level: 'info',
  format: combine(timestamp(), errors({ stack: true }), json()),
  transports: transportList,
  exitOnError: false,
});

// Ajouter un stream pour morgan (si utilisé)
// Désactivé pour éviter les erreurs de typage - à réactiver si nécessaire
// logger.stream = {
//   write: (message: string) => {
//     logger.info(message.trim());
//   },
// };

// Middleware pour Express/Next.js API Routes
const loggerMiddleware = (req: any, res: any, next: any) => {
  const start = Date.now();
  
  res.on('finish', () => {
    const duration = Date.now() - start;
    logger.info({
      type: 'API_REQUEST',
      method: req.method,
      path: req.path,
      status: res.statusCode,
      duration: `${duration}ms`,
      ip: req.ip || req.connection.remoteAddress,
      userAgent: req.headers['user-agent'],
    });
  });
  
  next();
};

// Middleware pour capturer les erreurs
const errorLogger = (err: any, req: any, res: any, next: any) => {
  logger.error({
    type: 'API_ERROR',
    message: err.message,
    stack: err.stack,
    method: req.method,
    path: req.path,
    status: err.status || 500,
  });
  
  next(err);
};

export { logger, loggerMiddleware, errorLogger };
