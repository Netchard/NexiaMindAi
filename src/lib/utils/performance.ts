/**
 * Utilitaires de performance pour NexiaMind AI
 * Fait partie de ST-309: Optimiser les Performances Frontend
 */

/**
 * Debounce une fonction pour éviter les appels trop fréquents
 * Utilisé pour la recherche, le scroll, etc.
 */
export function debounce<T extends (...args: any[]) => any>(
  func: T,
  wait: number = 300
): (...args: Parameters<T>) => void {
  let timeoutId: ReturnType<typeof setTimeout> | null = null

  return (...args: Parameters<T>) => {
    if (timeoutId) {
      clearTimeout(timeoutId)
    }
    timeoutId = setTimeout(() => {
      func(...args)
    }, wait)
  }
}

/**
 * Throttle une fonction pour limiter son exécution à une fois par période
 * Utilisé pour le scroll, resize, etc.
 */
export function throttle<T extends (...args: any[]) => any>(
  func: T,
  limit: number = 100
): (...args: Parameters<T>) => void {
  let inThrottle = false

  return (...args: Parameters<T>) => {
    if (!inThrottle) {
      func(...args)
      inThrottle = true
      setTimeout(() => {
        inThrottle = false
      }, limit)
    }
  }
}

/**
 * Mesurer le temps d'exécution d'une fonction
 * Utilisé pour le profiling
 */
export function measurePerformance<T extends (...args: any[]) => any>(
  func: T,
  label: string
): (...args: Parameters<T>) => ReturnType<T> {
  return (...args: Parameters<T>) => {
    const start = performance.now()
    const result = func(...args)
    const end = performance.now()
    
    console.log(`[Performance] ${label}: ${(end - start).toFixed(2)}ms`)
    
    return result
  }
}

/**
 * Vérifier si l'on est dans un environnement de développement
 */
export function isDevelopment(): boolean {
  return process.env.NODE_ENV === 'development'
}

/**
 * Vérifier si l'on est dans un navigateur
 */
export function isBrowser(): boolean {
  return typeof window !== 'undefined'
}

/**
 * Attendre un certain temps (utilitaire pour les animations et délais)
 */
export function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms))
}

/**
 * Charger une image de manière optimisée
 * Utilisé avec next/image pour le pré-chargement
 */
export function preloadImage(src: string): void {
  if (isBrowser()) {
    const img = new Image()
    img.src = src
  }
}

/**
 * Pré-charger un composant ou une ressource
 * Utilisé pour améliorer les performances perçues
 */
export function preloadResource(url: string, as: 'script' | 'style' | 'font' = 'script'): void {
  if (isBrowser()) {
    const link = document.createElement('link')
    link.rel = 'preload'
    link.href = url
    link.as = as
    document.head.appendChild(link)
  }
}

/**
 * Configurer le pré-chargement des assets critiques
 * Appelé au chargement initial de l'application
 */
export function setupCriticalPreloads(): void {
  if (!isBrowser()) return

  // Pré-charger les polices Google Fonts
  const fonts = [
    'https://fonts.googleapis.com/css2?family=Geist:wght@400;500;600;700&display=swap',
    'https://fonts.googleapis.com/css2?family=Geist+Mono:wght@400;500&display=swap',
  ]

  fonts.forEach((fontUrl) => {
    const link = document.createElement('link')
    link.rel = 'preload'
    link.as = 'style'
    link.href = fontUrl
    document.head.appendChild(link)
  })
}

/**
 * Vérifier si un élément est visible dans le viewport
 * Utilisé pour le lazy loading des images et composants
 */
export function isElementVisible(element: HTMLElement, offset: number = 100): boolean {
  if (!isBrowser()) return false

  const rect = element.getBoundingClientRect()
  const windowHeight = window.innerHeight || document.documentElement.clientHeight

  return (
    rect.top <= windowHeight + offset &&
    rect.bottom >= -offset &&
    rect.left <= window.innerWidth + offset &&
    rect.right >= -offset
  )
}

/**
 * Observer pour le lazy loading des éléments
 * Utilisé pour charger les composants quand ils deviennent visibles
 */
export class LazyLoader {
  private observer: IntersectionObserver | null = null
  private callbacks: Map<Element, () => void> = new Map()

  constructor(offset: number = 100) {
    if (!isBrowser()) return

    this.observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            const callback = this.callbacks.get(entry.target)
            if (callback) {
              callback()
              this.callbacks.delete(entry.target)
              this.observer?.unobserve(entry.target)
            }
          }
        })
      },
      {
        rootMargin: `${offset}px`,
        threshold: 0.01,
      }
    )
  }

  observe(element: Element, callback: () => void): void {
    if (!this.observer || !isBrowser()) {
      callback()
      return
    }
    this.callbacks.set(element, callback)
    this.observer.observe(element)
  }

  disconnect(): void {
    this.observer?.disconnect()
    this.callbacks.clear()
  }
}

// Singleton pour le lazy loader
let lazyLoaderInstance: LazyLoader | null = null
export function getLazyLoader(): LazyLoader {
  if (!lazyLoaderInstance) {
    lazyLoaderInstance = new LazyLoader()
  }
  return lazyLoaderInstance
}

export default {
  debounce,
  throttle,
  measurePerformance,
  isDevelopment,
  isBrowser,
  sleep,
  preloadImage,
  preloadResource,
  setupCriticalPreloads,
  isElementVisible,
  LazyLoader,
  getLazyLoader,
}
