import { CodeLanguage, ContentType } from './types';

/**
 * Estimation du nombre de tokens dans un texte
 * Approximation basée sur le nombre de caractères
 * Note: 1 token ≈ 4 caractères en moyenne pour les modèles Mistral
 */
export function estimateTokenCount(text: string): number {
  // Supprimer les espaces multiples
  const cleanedText = text.replace(/\s+/g, ' ').trim();
  
  // Estimation simple: environ 4 caractères = 1 token
  // C'est une approximation, pour une estimation précise il faudrait utiliser
  // un tokenizer comme celui de Mistral
  const charCount = cleanedText.length;
  
  // Approximation: 1 token ≈ 4 caractères (basé sur les modèles Mistral)
  return Math.ceil(charCount / 4);
}

/**
 * Détection du type de contenu
 */
export function detectContentType(content: string): ContentType {
  const trimmed = content.trim();
  
  // Détecter le markdown
  if (trimmed.startsWith('# ') || 
      trimmed.startsWith('## ') || 
      trimmed.startsWith('### ') ||
      trimmed.startsWith('#### ') ||
      trimmed.startsWith('##### ') ||
      trimmed.startsWith('###### ') ||
      trimmed.includes('```') ||
      (trimmed.includes('[') && trimmed.includes(']('))) {
    return 'markdown';
  }
  
  // Détecter le HTML
  if (trimmed.startsWith('<!DOCTYPE') || 
      trimmed.startsWith('<html') ||
      trimmed.includes('<div') ||
      trimmed.includes('<p>') ||
      trimmed.includes('<body') ||
      trimmed.includes('<head')) {
    return 'html';
  }
  
  // Détecter le code (par les mots-clés communs)
  const codeKeywords = [
    'function', 'const', 'let', 'var', 'return', 'class',
    'import', 'export', 'from', 'require', 'module',
    'if', 'else', 'for', 'while', 'switch', 'case',
    'try', 'catch', 'finally', 'throw',
    'public', 'private', 'protected', 'static',
    'def', 'class', 'import', 'from', 'return',
    'SELECT', 'INSERT', 'UPDATE', 'DELETE', 'FROM', 'WHERE',
    'async', 'await', 'Promise', 'new', 'this',
    'interface', 'type', 'extends', 'implements'
  ];
  
  const hasCodeKeyword = codeKeywords.some(keyword => 
    new RegExp(`\\b${keyword}\\b`).test(trimmed)
  );
  
  if (hasCodeKeyword) {
    return 'code';
  }
  
  return 'text';
}

/**
 * Détection du langage de code
 */
export function detectCodeLanguage(content: string): CodeLanguage {
  const trimmed = content.trim();
  
  // JavaScript/TypeScript
  if (trimmed.includes('=>') || 
      trimmed.includes('import ') && trimmed.includes('from ') || 
      trimmed.includes('export ')) {
    if (trimmed.includes('interface ') || 
        trimmed.includes(': ') && trimmed.includes('{') ||
        trimmed.includes('type ') && trimmed.includes('=')) {
      return 'typescript';
    }
    return 'javascript';
  }
  
  // Python
  if (trimmed.includes('def ') || 
      trimmed.includes('class ') && !trimmed.includes('{') ||
      trimmed.includes('import ') && !trimmed.includes('from ') ||
      trimmed.includes('print(') ||
      trimmed.includes('self.') ||
      trimmed.includes('lambda ')) {
    return 'python';
  }
  
  // Java
  if (trimmed.includes('public class ') || 
      trimmed.includes('public static void main') ||
      trimmed.includes('System.out.println')) {
    return 'java';
  }
  
  // C#
  if (trimmed.includes('using ') && trimmed.includes(';') || 
      trimmed.includes('namespace ') ||
      (trimmed.includes('public class ') && trimmed.includes(' : '))) {
    return 'csharp';
  }
  
  // C++
  if (trimmed.includes('#include ') || 
      trimmed.includes('cout <<') ||
      trimmed.includes('cin >>') ||
      trimmed.includes('std::')) {
    return 'cpp';
  }
  
  // Go
  if (trimmed.includes('package ') && trimmed.includes('import (') ||
      trimmed.includes('func ') && trimmed.includes('(') ||
      trimmed.includes('var ') && trimmed.includes('=')) {
    return 'go';
  }
  
  // Rust
  if (trimmed.includes('fn ') || 
      trimmed.includes('pub ') ||
      trimmed.includes('use ') ||
      trimmed.includes('struct ')) {
    return 'rust';
  }
  
  // SQL
  if (trimmed.toUpperCase().includes('SELECT ') || 
      trimmed.toUpperCase().includes('INSERT INTO ') ||
      trimmed.toUpperCase().includes('UPDATE ') ||
      trimmed.toUpperCase().includes('DELETE FROM ') ||
      trimmed.toUpperCase().includes('CREATE TABLE ') ||
      trimmed.toUpperCase().includes('ALTER TABLE ')) {
    return 'sql';
  }
  
  // Bash
  if (trimmed.startsWith('#!/bin/bash') || 
      trimmed.startsWith('#!/bin/sh') ||
      trimmed.includes('echo ') && !trimmed.includes('"') ||
      trimmed.includes('cd ') ||
      trimmed.includes('mkdir ') ||
      trimmed.includes('rm ') ||
      trimmed.includes('cp ') ||
      trimmed.includes('mv ')) {
    return 'bash';
  }
  
  return 'unknown';
}

/**
 * Générer un ID unique pour un chunk
 */
export function generateChunkId(documentId: string, chunkIndex: number): string {
  return `chunk-${documentId}-${chunkIndex}`;
}

/**
 * Vérifier si un chunk est valide (non vide, taille raisonnable)
 */
export function isValidChunk(content: string, minTokens: number = 10): boolean {
  const tokenCount = estimateTokenCount(content);
  return content.trim().length > 0 && tokenCount >= minTokens;
}

/**
 * Extraire les lignes d'un texte
 */
export function extractLines(text: string): string[] {
  return text.split('\n').filter(line => line.trim().length > 0);
}

/**
 * Nettoyer le texte (supprimer les espaces multiples, etc.)
 */
export function cleanText(text: string): string {
  return text
    .replace(/[ \t]+/g, ' ')  // Remplacer les espaces multiples par un seul
    .replace(/\n\n+/g, '\n\n')  // Remplacer les sauts de ligne multiples
    .trim();
}
