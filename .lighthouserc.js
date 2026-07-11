/**
 * Configuration Lighthouse pour NexiaMind AI
 * Fait partie de ST-309: Optimiser les Performances Frontend
 * 
 * Ce fichier configure les audits Lighthouse pour le projet.
 * Exécuter avec: npx lighthouse http://localhost:3000/chat
 */

module.exports = {
  ci: {
    // Configuration pour les tests CI
    collect: {
      // URL à tester
      url: ['http://localhost:3000/chat'],
      
      // Commande pour démarrer le serveur
      startServerCommand: 'npm run dev',
      
      // Attendre que le serveur soit prêt
      startServerReadyTimeout: 30000,
      
      // Nombre d'exécutions
      numberOfRuns: 3,
      
      // Configuration du navigateur
      chrome: {
        flags: '--headless',
      },
    },
    
    // Assertions pour les tests CI
    assert: {
      preset: 'lighthouse:recommended',
      assertions: {
        // Performance
        'performance': ['error', { minScore: 0.8 }],
        
        // Accessibilité
        'accessibility': ['error', { minScore: 0.9 }],
        
        // SEO
        'seo': ['warn', { minScore: 0.8 }],
        
        // Best Practices
        'best-practices': ['warn', { minScore: 0.8 }],
        
        // Métriques spécifiques
        'first-contentful-paint': ['error', { maxNumericValue: 2000 }], // 2s max
        'largest-contentful-paint': ['error', { maxNumericValue: 3500 }], // 3.5s max
        'cumulative-layout-shift': ['error', { maxNumericValue: 0.1 }],
        'total-blocking-time': ['error', { maxNumericValue: 300 }], // 300ms max
        'server-response-time': ['error', { maxNumericValue: 500 }], // 500ms max
      },
    },
    
    // Upload des résultats
    upload: {
      target: 'filesystem',
      outputDir: './lighthouse-results',
      reportFilenamePattern: 'lighthouse-report-%%DATE%%-%%TIME%%.%%EXTENSION%%',
    },
  },
  
  // Configuration pour les audits manuels
  extends: 'lighthouse:default',
  
  settings: {
    // Seuil de score global
    performance: {
      budget: {
        // Budget de performance
        // Ces valeurs sont des exemples, à ajuster selon les besoins
      },
    },
    
    // Configuration spécifique
    chrome: {
      flags: {
        // Mode headless
        headless: true,
        
        // Désactiver le GPU (problèmes sous Windows)
        disableGpu: true,
        
        // Résolution d'écran
        windowSize: '1350,940',
        
        // User agent
        userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
      },
    },
    
    // Emulation mobile
    emulatedFormFactor: 'mobile',
    
    // Conditions réseau (simulation 3G)
    throttlingMethod: 'simulate',
    throttling: {
      cpu: '4x slowdown',
      network: {
        latency: 150, // ms
        throughput: 1.6 * 1024 * 1024 / 8, // 1.6 Mbps en bytes/s
        requestLatency: 150, // ms
        downloadThroughput: 1.6 * 1024 * 1024 / 8,
        uploadThroughput: 0.7 * 1024 * 1024 / 8,
      },
    },
    
    // Cache
    clearStorage: true,
    
    // Localisation
    locale: 'fr-FR',
  },
  
  // Métriques personnalisées
  audits: {
    // Désactiver certains audits si nécessaire
    'uses-rel-preload': { disabled: false },
    'uses-rel-preconnect': { disabled: false },
    'server-response-time': { disabled: false },
  },
}
