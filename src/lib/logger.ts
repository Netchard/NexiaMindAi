import { format, transports, createLogger } from 'winston';
import DailyRotateFile from 'winston-daily-rotate-file';
const { combine, timestamp, printf, json, colorize, errors } = format;

// Format personnalisé pour la console
const consoleFormat = combine(
  colorize(),
  timestamp({ format: 'YYYY-MM-DD HH:mm:ss' }),
  printf((info) => {
    return `${info.timestamp} ${info.level}: ${info.message}`;
  })
);

// Format JSON pour les fichiers
const fileFormat = combine(
  timestamp({ format: 'YYYY-MM-DD HH:mm:ss' }),
  errors({ stack: true }),
  json()
);

// Configuration des transports
const transports = [
  // Console transport (pour développement)
  new _transports.Console({
    level: 'info',
    format: consoleFormat,
    handleExceptions: true,
    json: false,
  }),
  
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
  }),
];

// Créer le logger
const logger = createLogger({
  level: 'info',
  format: combine(timestamp(), errors({ stack: true }), json()),
  transports,
  exitOnError: false,
});

// Ajouter un stream pour morgan (si utilisé)
logger.stream = {
  write: (message) => {
    logger.info(message.trim());
  },
};

// Middleware pour Express/Next.js API Routes
const loggerMiddleware = (req, res, next) => {
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
const errorLogger = (err, req, res, next) => {
  logger.error({
    type: 'API_ERROR',
    error: err.message,
    stack: err.stack,
    method: req.method,
    path: req.path,
    status: res.statusCode,
  });
  next(err);
};

// Exporter le logger et les middlewares
// eslint-disable-next-line import/no-anonymous-default-export
export  {
  logger,
  loggerMiddleware,
  errorLogger,
};