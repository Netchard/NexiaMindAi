---
story_id: ST-004
epic: Epic 1
title: Mettre en place le Logging
description: Configurer un système de logging avec Winston pour suivre les requêtes et erreurs afin de pouvoir déboguer et monitorer l'application.
status: in-progress
priority: ⭐⭐⭐⭐
estimation: 3 heures
assigned_to: Dday
start_date: 2026-06-25 01:15:00
end_date: ""
user_skill_level: intermediate
baseline_commit: ""
workflow: dev-story

# BMAD Metadata
epic_title: Configuration & Infrastructure
epic_goal: Mise en place de l'infrastructure de base nécessaire pour le développement
project: NexiaMind AI
dependencies: ["ST-001", "ST-002", "ST-003"]
related_documents:
  - "_bmad-output/planning-artifacts/epics-and-stories-nexiamind-ai/epics-and-stories.md"
  - "_bmad-output/planning-artifacts/architecture-nexiamind-ai/architecture.md"
---

## 🎯 Objectif

**En tant que** Développeur
**Je veux** un système de logging configuré (Winston) pour suivre les requêtes et erreurs
**Afin de** pouvoir déboguer et monitorer l'application.

---

## 📋 Contexte

Cette story fait partie de l'**Epic 1: Configuration & Infrastructure**. Après avoir configuré le projet Next.js (ST-001), Supabase (ST-002) et les variables d'environnement (ST-003), cette story permet d'ajouter un système de logging robuste pour :
- Suivre toutes les requêtes API
- Enregistrer les erreurs de manière structurée
- Faciliter le débogage et le monitoring
- Préparer l'application pour la production

---

## ✅ Critères d'Acceptation

### Configuration de Base
- [ ] Winston configuré avec transports Console et File
- [ ] Package winston installé
- [ ] Package winston-daily-rotate-file installé

### Fonctionnalités de Logging
- [ ] Logs des requêtes API (durée, tokens utilisés)
- [ ] Logs des erreurs dans un fichier dédié
- [ ] Format JSON pour l'analyse
- [ ] Rotation automatique des fichiers de log

### Intégration
- [ ] Configuration dans lib/logger.js
- [ ] Intégration dans les middleware API
- [ ] Tests de logging fonctionnels

### Structure
- [ ] Fichier de configuration du logger créé
- [ ] Middleware de logging créé
- [ ] Tests unitaires créés

---

## 📋 Tâches Principales

### Phase 1: Installation et Configuration de Base (Estimation: 1h)
- [ ] Installer Winston et winston-daily-rotate-file
- [ ] Créer le fichier de configuration du logger (lib/logger.js)
- [ ] Configurer les transports (Console et File)
- [ ] Configurer le format JSON

### Phase 2: Middleware de Logging (Estimation: 1h)
- [ ] Créer le middleware de logging pour Next.js
- [ ] Intégrer le middleware dans l'application
- [ ] Configurer le logging des requêtes
- [ ] Configurer le logging des erreurs

### Phase 3: Tests (Estimation: 1h)
- [ ] Créer des tests unitaires pour le logger
- [ ] Tester le logging des requêtes
- [ ] Tester le logging des erreurs
- [ ] Valider le format des logs

---

## 🛠 Configuration du Logger

### Fichier : `nexiamind-ai/src/lib/logger.js`

```javascript
const winston = require('winston');
const DailyRotateFile = require('winston-daily-rotate-file');
const { combine, timestamp, printf, json, colorize, errors } = winston.format;

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
  new winston.transports.Console({
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
const logger = winston.createLogger({
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
module.exports = {
  logger,
  loggerMiddleware,
  errorLogger,
};
```

---

## 🔧 Middleware pour Next.js API Routes

### Fichier : `nexiamind-ai/src/middleware/logger.js`

```javascript
import { logger, loggerMiddleware } from '@/lib/logger';

// Middleware pour Next.js (App Router)
export const loggerMiddleware = (req) => {
  const start = Date.now();
  
  const response = NextResponse.next();
  
  response.cookies.set('x-response-time', String(Date.now() - start));
  
  logger.info({
    type: 'API_REQUEST',
    method: req.method,
    path: req.nextUrl.pathname,
    duration: `${Date.now() - start}ms`,
    ip: req.ip || req.headers.get('x-forwarded-for'),
    userAgent: req.headers.get('user-agent'),
  });
  
  return response;
};

// Configuration pour Next.js
export const config = {
  matcher: ['/api/:path*'],
};
```

### Configuration dans `nexiamind-ai/middleware.js`

```javascript
import { NextResponse } from 'next/server';
import { logger } from './lib/logger';

export function middleware(request) {
  const start = Date.now();
  
  const response = NextResponse.next();
  
  // Log à la fin de la requête
  response.cookies.set('x-response-time', String(Date.now() - start));
  
  return response;
}

export const config = {
  matcher: '/api/:path*',
};

// Log manuel pour Next.js (à utiliser dans les API Routes)
export async function logRequest(req, context) {
  const start = Date.now();
  const response = await context.next();
  const duration = Date.now() - start;
  
  logger.info({
    type: 'API_REQUEST',
    method: req.method,
    path: req.nextUrl.pathname,
    duration: `${duration}ms`,
    status: response.status,
  });
  
  return response;
}
```

---

## 📋 Exemple d'Intégration dans une API Route

### Fichier : `nexiamind-ai/src/app/api/example/route.js`

```javascript
import { NextResponse } from 'next/server';
import { logger } from '@/lib/logger';

export async function GET(request) {
  try {
    logger.info('Exemple de requête API');
    
    // Votre logique ici
    const data = { message: 'Hello World' };
    
    logger.info('Requête traitée avec succès', { data });
    
    return NextResponse.json(data, { status: 200 });
  } catch (error) {
    logger.error('Erreur dans l API example', {
      error: error.message,
      stack: error.stack,
    });
    
    return NextResponse.json(
      { error: 'Internal Server Error' },
      { status: 500 }
    );
  }
}
```

---

## 🧪 Tests Unitaires

### Fichier : `nexiamind-ai/src/lib/logger.test.js`

```javascript
const { logger } = require('./logger');
const fs = require('fs');
const path = require('path');

describe('Logger Configuration', () => {
  beforeAll(() => {
    // Créer un dossier temporaire pour les tests
    if (!fs.existsSync('logs-test')) {
      fs.mkdirSync('logs-test');
    }
  });

  afterAll(() => {
    // Nettoyer les fichiers de test
    const testLogs = fs.readdirSync('logs-test');
    testLogs.forEach((file) => {
      fs.unlinkSync(path.join('logs-test', file));
    });
    fs.rmdirSync('logs-test');
  });

  describe('Basic Logging', () => {
    it('should log info messages', () => {
      const spy = jest.spyOn(logger, 'info');
      logger.info('Test info message');
      expect(spy).toHaveBeenCalledWith('Test info message', expect.any(Object));
    });

    it('should log error messages', () => {
      const spy = jest.spyOn(logger, 'error');
      logger.error('Test error message');
      expect(spy).toHaveBeenCalledWith('Test error message', expect.any(Object));
    });

    it('should log warnings', () => {
      const spy = jest.spyOn(logger, 'warn');
      logger.warn('Test warning message');
      expect(spy).toHaveBeenCalledWith('Test warning message', expect.any(Object));
    });
  });

  describe('Log Levels', () => {
    it('should log at different levels', () => {
      const levels = ['error', 'warn', 'info', 'http', 'verbose', 'debug', 'silly'];
      levels.forEach((level) => {
        const spy = jest.spyOn(logger, level);
        logger[level](`Test ${level} message`);
        expect(spy).toHaveBeenCalled();
      });
    });
  });

  describe('Log Format', () => {
    it('should include timestamp in logs', () => {
      const consoleSpy = jest.spyOn(console, 'log').mockImplementation();
      logger.info('Test with timestamp');
      expect(consoleSpy.mock.calls[0][0]).toMatch(/\d{4}-\d{2}-\d{2} \d{2}:\d{2}:\d{2}/);
    });
  });
});
```

---

## 📚 Références

- **Winston Documentation** : https://github.com/winstonjs/winston
- **winston-daily-rotate-file** : https://github.com/winstonjs/winston-daily-rotate-file
- **Next.js Middleware** : https://nextjs.org/docs/app/building-your-application/routing/middleware
- **Next.js API Routes** : https://nextjs.org/docs/app/building-your-application/routing/route-handlers

---

## 📝 Journal du Développeur

### 🟢 Enregistrements de Développement
*Date : [À remplir]*
*Statut : in-progress*

### 🟡 Journal de Débogage
*(Vide - aucun problème rencontré)*

### ✅ Notes de Complétion
*(À remplir à la fin de la story)*

---

## 📁 Liste des Fichiers Modifiés
*(À remplir pendant le développement)*

- `nexiamind-ai/src/lib/logger.js` (créé)
- `nexiamind-ai/src/middleware/logger.js` (optionnel)
- `nexiamind-ai/src/app/api/example/route.js` (exemple)
- `nexiamind-ai/src/lib/logger.test.js` (tests)

---

## 🔄 Journal des Changements
*(À remplir pendant le développement)*
