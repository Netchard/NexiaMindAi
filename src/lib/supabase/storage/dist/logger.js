"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.errorLogger = exports.loggerMiddleware = exports.logger = void 0;
const winston_1 = require("winston");
const winston_daily_rotate_file_1 = require("winston-daily-rotate-file");
const { combine, timestamp, printf, json, colorize, errors } = winston_1.format;
// Format personnalisé pour la console
const consoleFormat = combine(colorize(), timestamp({ format: 'YYYY-MM-DD HH:mm:ss' }), printf((info) => {
    return `${info.timestamp} ${info.level}: ${info.message}`;
}));
// Format JSON pour les fichiers
const fileFormat = combine(timestamp({ format: 'YYYY-MM-DD HH:mm:ss' }), errors({ stack: true }), json());
// Configuration des transports
const transportList = [
    // Console transport (pour développement)
    new winston_1.transports.Console({
        level: 'info',
        format: consoleFormat,
    }),
    // Fichier pour les erreurs
    new winston_daily_rotate_file_1.default({
        filename: 'logs/error-%DATE%.log',
        datePattern: 'YYYY-MM-DD',
        maxSize: '20m',
        maxFiles: '30d',
        level: 'error',
        format: fileFormat,
    }),
    // Fichier pour toutes les logs
    new winston_daily_rotate_file_1.default({
        filename: 'logs/combined-%DATE%.log',
        datePattern: 'YYYY-MM-DD',
        maxSize: '20m',
        maxFiles: '30d',
        level: 'info',
        format: fileFormat,
    }),
    // Fichier dédié aux requêtes API
    new winston_daily_rotate_file_1.default({
        filename: 'logs/api-%DATE%.log',
        datePattern: 'YYYY-MM-DD',
        maxSize: '20m',
        maxFiles: '30d',
        level: 'http',
        format: fileFormat,
    }),
];
// Créer le logger
const logger = (0, winston_1.createLogger)({
    level: 'info',
    format: combine(timestamp(), errors({ stack: true }), json()),
    transports: transportList,
    exitOnError: false,
});
exports.logger = logger;
// Ajouter un stream pour morgan (si utilisé)
// Désactivé pour éviter les erreurs de typage - à réactiver si nécessaire
// logger.stream = {
//   write: (message: string) => {
//     logger.info(message.trim());
//   },
// };
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
exports.loggerMiddleware = loggerMiddleware;
// Middleware pour capturer les erreurs
const errorLogger = (err, req, res, next) => {
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
exports.errorLogger = errorLogger;
