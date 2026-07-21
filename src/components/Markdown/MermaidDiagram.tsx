'use client'

import React, { useEffect, useRef, useState } from 'react'
import mermaid from 'mermaid'
import styles from './Markdown.module.css'

/**
 * Props du composant MermaidDiagram
 */
export interface MermaidDiagramProps {
  code: string
  className?: string
}

/**
 * Statut de validation du code Mermaid
 */
type ValidationStatus = 'loading' | 'valid' | 'error' | 'fixed'

/**
 * Erreurs courantes de syntaxe Mermaid et leurs corrections
 */
const MERMAID_FIXES: Array<{
  pattern: RegExp
  replacement: string
  description: string
}> = [
  // Remplace TOUS les sauts de ligne dans les labels par des tirets
  {
    pattern: /(\[[^\]]*?)\n([^\]]*?\])/g,
    replacement: '[$1-$2]',
    description: 'Remplace les sauts de ligne dans les labels par des tirets'
  },
  // Remplace les sauts de ligne simples entre mots par des espaces
  {
    pattern: /(\w+)\s*\n\s*(\w+)/g,
    replacement: '$1 $2',
    description: 'Remplace les sauts de ligne par des espaces'
  },
  // Corrige les flèches mal formées
  {
    pattern: /->>|<->/g,
    replacement: '-->',
    description: 'Corrige les flèches'
  },
  {
    pattern: /<---/g,
    replacement: '<--',
    description: 'Corrige les flèches inverse'
  },
  // Ajoute des espaces autour des tirets pour les flèches
  {
    pattern: /(\w+)\s*-\s*(\w+)/g,
    replacement: '$1 -- $2',
    description: 'Ajoute des espaces autour des tirets'
  },
  // Corrige la syntaxe des graphes (graph TD, graph LR, etc.)
  {
    pattern: /^(graph)\s+([A-Z]{2})/gm,
    replacement: '$1 $2',
    description: 'Corrige la déclaration du graphe'
  },
  // Corrige les flèches orphelines : A --  ->  A -- [Fin]
  {
    pattern: /(\w+\s*--\s*)$/gm,
    replacement: '$1 [Fin]',
    description: 'Ajoute un nœud final aux flèches orphelines'
  },
  // Corrige : A[text] --  ->  A[text] -- [Fin]
  {
    pattern: /(\[[^\]]+\]\s*--\s*)$/gm,
    replacement: '$1 [Fin]',
    description: 'Ajoute un nœud final aux flèches orphelines après label'
  },
]

/**
 * Fonction de validation et correction du code Mermaid
 */
function validateAndFixMermaid(code: string): { fixedCode: string; wasFixed: boolean } {
  let fixedCode = code.trim()
  let wasFixed = false
  
  if (!fixedCode) {
    return { fixedCode: '', wasFixed: false }
  }
  
  for (const fix of MERMAID_FIXES) {
    const newCode = fixedCode.replace(fix.pattern, fix.replacement)
    if (newCode !== fixedCode) {
      fixedCode = newCode
      wasFixed = true
    }
  }
  
  const graphDeclaration = fixedCode.match(/^graph\s+(TD|LR|RL|BT|TB|LRTB|TRLB)\s*/i)
  if (!graphDeclaration) {
    fixedCode = 'graph TD\n' + fixedCode
    wasFixed = true
  }
  
  return { fixedCode, wasFixed }
}

/**
 * Composant pour rendre les diagrammes Mermaid
 * Si Mermaid échoue, affiche simplement le code comme du texte formaté
 * Aucune erreur n'est affichée à l'utilisateur
 */
export function MermaidDiagram({ code, className = '' }: MermaidDiagramProps) {
  const containerRef = useRef<HTMLDivElement>(null)
  const [svgContent, setSvgContent] = useState<string>('')
  const [isLoading, setIsLoading] = useState<boolean>(true)
  const [validationStatus, setValidationStatus] = useState<ValidationStatus>('loading')

  useEffect(() => {
    async function renderMermaid() {
      setIsLoading(true)
      setValidationStatus('loading')

      try {
        const { fixedCode, wasFixed } = validateAndFixMermaid(code)
        
        if (wasFixed) {
          setValidationStatus('fixed')
        }

        mermaid.initialize({
          startOnLoad: false,
          theme: 'default',
          securityLevel: 'loose',
          fontFamily: 'Inter, system-ui, sans-serif',
        })

        if (!fixedCode || fixedCode.trim() === '') {
          throw new Error('empty')
        }

        const { svg, bindFunctions } = await mermaid.render(
          `mermaid-${Date.now()}`,
          fixedCode,
          containerRef.current || undefined
        )
        
        setSvgContent(svg)
        setValidationStatus('valid')
        
        return () => {
          if (bindFunctions && containerRef.current) {
            bindFunctions(containerRef.current)
          }
        }
      } catch (err) {
        // AUCUN message d'erreur, AUCUN console.error
        // Affichage du code en fallback
        setValidationStatus('error')
        return () => {}
      } finally {
        setIsLoading(false)
      }
    }

    renderMermaid()
  }, [code])

  const StatusBadge = () => {
    const badgeConfig = {
      loading: { icon: '⏳', bgColor: 'bg-yellow-600', textColor: 'text-black' },
      valid: { icon: '✅', bgColor: 'bg-green-500', textColor: 'text-white' },
      fixed: { icon: '✨', bgColor: 'bg-blue-500', textColor: 'text-white' },
      error: { icon: '📄', bgColor: 'bg-gray-600', textColor: 'text-white' }
    }
    
    const config = badgeConfig[validationStatus]
    
    return (
      <span 
        className={`inline-flex items-center px-1.5 py-0.5 rounded text-xs font-medium ${config.bgColor} ${config.textColor} opacity-70`}
        title={validationStatus === 'fixed' ? 'Code Mermaid corrigé automatiquement' : 
              validationStatus === 'valid' ? 'Diagramme Mermaid valide' :
              validationStatus === 'error' ? 'Affiché comme code' : 'Validation...'}
      >
        {config.icon}
      </span>
    )
  }

  // Pendant le chargement, afficher le code
  if (isLoading || !svgContent) {
    return (
      <div className={`${styles['mermaid-container']} ${className}`.trim()} data-testid="mermaid-fallback">
        <div className="flex items-center justify-end mb-1">
          <StatusBadge />
        </div>
        <pre className={styles['mermaid-fallback-code']}>
          {code.trim()}
        </pre>
      </div>
    )
  }

  // Affichage du diagramme réussi
  return (
    <div 
      className={`${styles['mermaid-diagram']} ${className}`.trim()}
      data-testid="mermaid-container"
      style={{ position: 'relative' }}
    >
      <div className="absolute top-1 right-1 z-10">
        <StatusBadge />
      </div>
      
      <div 
        ref={containerRef}
        dangerouslySetInnerHTML={{ __html: svgContent }}
      />
    </div>
  )
}

export default MermaidDiagram
