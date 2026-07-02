import { logger } from '@/lib/logger';

/**
 * Validateur de requêtes
 * Fournit des utilitaires pour valider les données des requêtes
 */

export interface ValidationError {
  field: string;
  message: string;
  value?: any;
}

export interface ValidationResult {
  isValid: boolean;
  errors: ValidationError[];
  data?: any;
}

/**
 * Types de validation supportés
 */
export type ValidatorType = 
  | 'string'
  | 'number'
  | 'boolean'
  | 'email'
  | 'object'
  | 'array'
  | 'date'
  | 'custom';

/**
 * Règles de validation
 */
export interface ValidationRule {
  type: ValidatorType;
  required?: boolean;
  min?: number;
  max?: number;
  pattern?: RegExp;
  customValidator?: (value: any) => boolean;
  customMessage?: string;
}

/**
 * Schéma de validation
 */
export interface ValidationSchema {
  [key: string]: ValidationRule | ValidationSchema;
}

/**
 * Classe de validation
 */
export class RequestValidator {
  /**
   * Valider un objet selon un schéma
   */
  static validate(schema: ValidationSchema, data: any): ValidationResult {
    const errors: ValidationError[] = [];
    const validatedData: any = {};
    
    for (const [fieldName, rule] of Object.entries(schema)) {
      const value = data?.[fieldName];
      
      // Vérifier si le champ est requis
      if (rule.required && (value === undefined || value === null || value === '')) {
        errors.push({
          field: fieldName,
          message: `${fieldName} is required`,
          value,
        });
        continue;
      }
      
      // Si le champ n'est pas requis et n'est pas présent, passer
      if (!rule.required && (value === undefined || value === null)) {
        continue;
      }
      
      // Valider selon le type
      const validationError = this.validateField(fieldName, value, rule as ValidationRule);
      if (validationError) {
        errors.push(validationError);
      } else {
        // Ajouter au données validées
        validatedData[fieldName] = value;
      }
    }
    
    return {
      isValid: errors.length === 0,
      errors,
      data: validatedData,
    };
  }
  
  /**
   * Valider un champ selon une règle
   */
  private static validateField(
    fieldName: string,
    value: any,
    rule: ValidationRule
  ): ValidationError | null {
    // Si la valeur est vide et le champ est requis, c'est déjà géré avant
    if (value === undefined || value === null || value === '') {
      return null;
    }
    
    switch (rule.type) {
      case 'string':
        if (typeof value !== 'string') {
          return {
            field: fieldName,
            message: rule.customMessage || `${fieldName} must be a string`,
            value,
          };
        }
        
        if (rule.min !== undefined && value.length < rule.min) {
          return {
            field: fieldName,
            message: rule.customMessage || `${fieldName} must be at least ${rule.min} characters`,
            value,
          };
        }
        
        if (rule.max !== undefined && value.length > rule.max) {
          return {
            field: fieldName,
            message: rule.customMessage || `${fieldName} must be at most ${rule.max} characters`,
            value,
          };
        }
        
        if (rule.pattern && !rule.pattern.test(value)) {
          return {
            field: fieldName,
            message: rule.customMessage || `${fieldName} has invalid format`,
            value,
          };
        }
        
        break;
      
      case 'number':
        if (typeof value !== 'number' && isNaN(Number(value))) {
          return {
            field: fieldName,
            message: rule.customMessage || `${fieldName} must be a number`,
            value,
          };
        }
        
        const numValue = Number(value);
        
        if (rule.min !== undefined && numValue < rule.min) {
          return {
            field: fieldName,
            message: rule.customMessage || `${fieldName} must be at least ${rule.min}`,
            value,
          };
        }
        
        if (rule.max !== undefined && numValue > rule.max) {
          return {
            field: fieldName,
            message: rule.customMessage || `${fieldName} must be at most ${rule.max}`,
            value,
          };
        }
        
        break;
      
      case 'boolean':
        if (typeof value !== 'boolean') {
          return {
            field: fieldName,
            message: rule.customMessage || `${fieldName} must be a boolean`,
            value,
          };
        }
        break;
      
      case 'email':
        if (typeof value !== 'string') {
          return {
            field: fieldName,
            message: rule.customMessage || `${fieldName} must be a string`,
            value,
          };
        }
        
        const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!emailPattern.test(value)) {
          return {
            field: fieldName,
            message: rule.customMessage || `${fieldName} must be a valid email address`,
            value,
          };
        }
        break;
      
      case 'object':
        if (typeof value !== 'object' || value === null || Array.isArray(value)) {
          return {
            field: fieldName,
            message: rule.customMessage || `${fieldName} must be an object`,
            value,
          };
        }
        break;
      
      case 'array':
        if (!Array.isArray(value)) {
          return {
            field: fieldName,
            message: rule.customMessage || `${fieldName} must be an array`,
            value,
          };
        }
        
        if (rule.min !== undefined && value.length < rule.min) {
          return {
            field: fieldName,
            message: rule.customMessage || `${fieldName} must have at least ${rule.min} items`,
            value,
          };
        }
        
        if (rule.max !== undefined && value.length > rule.max) {
          return {
            field: fieldName,
            message: rule.customMessage || `${fieldName} must have at most ${rule.max} items`,
            value,
          };
        }
        break;
      
      case 'date':
        if (isNaN(Date.parse(value))) {
          return {
            field: fieldName,
            message: rule.customMessage || `${fieldName} must be a valid date`,
            value,
          };
        }
        break;
      
      case 'custom':
        if (rule.customValidator && !rule.customValidator(value)) {
          return {
            field: fieldName,
            message: rule.customMessage || `${fieldName} is invalid`,
            value,
          };
        }
        break;
    }
    
    return null;
  }
  
  /**
   * Valider et logger les erreurs
   */
  static validateAndLog(
    schema: ValidationSchema,
    data: any,
    context: string = 'Request'
  ): ValidationResult {
    const result = this.validate(schema, data);
    
    if (!result.isValid) {
      logger.warn(`${context} validation échouée`, {
        errors: result.errors,
        data,
      });
    }
    
    return result;
  }
  
  /**
   * Schémas de validation communs
   */
  static schemas = {
    // Schéma pour le login
    login: {
      email: {
        type: 'email' as const,
        required: true,
      },
      password: {
        type: 'string' as const,
        required: true,
        min: 8,
      },
    },
    
    // Schéma pour le message de chat
    chatMessage: {
      message: {
        type: 'string' as const,
        required: true,
        min: 1,
        max: 10000,
      },
      conversationId: {
        type: 'string' as const,
        required: false,
      },
      userId: {
        type: 'string' as const,
        required: true,
      },
    },
    
    // Schéma pour l'indexation de document
    indexDocument: {
      documentId: {
        type: 'string' as const,
        required: true,
      },
      content: {
        type: 'string' as const,
        required: true,
        min: 1,
      },
      metadata: {
        type: 'object' as const,
        required: false,
      },
    },
    
    // Schéma pour la synchronisation
    syncSource: {
      source: {
        type: 'string' as const,
        required: true,
        customValidator: (value: string) => ['supabase', 'gitlab', 'nexia', 'all'].includes(value),
        customMessage: 'Source must be one of: supabase, gitlab, nexia, all',
      },
      sourceId: {
        type: 'string' as const,
        required: false,
      },
    },
    
    // Schéma pour le refresh token
    refreshToken: {
      refresh_token: {
        type: 'string' as const,
        required: true,
      },
    },
  };
}
