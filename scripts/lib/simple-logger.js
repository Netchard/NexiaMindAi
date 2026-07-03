// Simple logger for scripts - compatible with both JS and TS

const fs = require('fs');
const path = require('path');

// Ensure logs directory exists
const logsDir = path.join(__dirname, '..', '..', 'logs');
if (!fs.existsSync(logsDir)) {
  fs.mkdirSync(logsDir, { recursive: true });
}

const logger = {
  info: (message, context = {}) => {
    const logMessage = `[INFO] ${new Date().toISOString()} ${message}`;
    console.log(logMessage, context);
    
    // Also write to file
    try {
      const logEntry = `${logMessage}\n`;
      fs.appendFileSync(path.join(logsDir, 'script.log'), logEntry);
    } catch (error) {
      // Silent fail for logging
    }
  },
  
  error: (message, context = {}) => {
    const logMessage = `[ERROR] ${new Date().toISOString()} ${message}`;
    console.error(logMessage, context);
    
    // Also write to file
    try {
      const logEntry = `${logMessage}\n`;
      fs.appendFileSync(path.join(logsDir, 'error.log'), logEntry);
    } catch (error) {
      // Silent fail for logging
    }
  },
  
  warn: (message, context = {}) => {
    const logMessage = `[WARN] ${new Date().toISOString()} ${message}`;
    console.warn(logMessage, context);
    
    // Also write to file
    try {
      const logEntry = `${logMessage}\n`;
      fs.appendFileSync(path.join(logsDir, 'script.log'), logEntry);
    } catch (error) {
      // Silent fail for logging
    }
  },
  
  debug: (message, context = {}) => {
    const logMessage = `[DEBUG] ${new Date().toISOString()} ${message}`;
    console.debug(logMessage, context);
    
    // Also write to file
    try {
      const logEntry = `${logMessage}\n`;
      fs.appendFileSync(path.join(logsDir, 'debug.log'), logEntry);
    } catch (error) {
      // Silent fail for logging
    }
  }
};

module.exports = { logger };