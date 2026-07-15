#!/usr/bin/env powershell
# =============================================================================
# Vercel Setup Script - NexiaMind AI
# =============================================================================
# Ce script automatise la configuration de Vercel pour NexiaMind AI
# Exécutez ce script après avoir créé manuellement le projet dans Vercel Dashboard
# =============================================================================

param(
    [switch]$Help,
    [switch]$Check,
    [switch]$Deploy,
    [string]$ProjectName = "nexiamind-ai",
    [string]$TeamName
)

function Write-Header {
    param([string]$Message)
    Write-Host "`n============================================================" -ForegroundColor Cyan
    Write-Host "  $Message" -ForegroundColor White
    Write-Host "============================================================`n" -ForegroundColor Cyan
}

function Write-Step {
    param([int]$Number, [string]$Message)
    Write-Host "[$Number] $Message" -ForegroundColor Yellow
}

function Write-Success {
    param([string]$Message)
    Write-Host "✅ $Message" -ForegroundColor Green
}

function Write-Warning {
    param([string]$Message)
    Write-Host "⚠️  $Message" -ForegroundColor Yellow
}

function Write-Error {
    param([string]$Message)
    Write-Host "❌ $Message" -ForegroundColor Red
}

# ============================================================================
# AFFICHER L'AIDE
# ============================================================================
if ($Help) {
    Write-Header "AIDE - Vercel Setup Script"
    Write-Host "Usage: .\vercel-setup.ps1 [options]" -ForegroundColor White
    Write-Host ""
    Write-Host "Options:" -ForegroundColor White
    Write-Host "  -Help           Affiche cette aide" -ForegroundColor Cyan
    Write-Host "  -Check          Vérifie la configuration actuelle" -ForegroundColor Cyan
    Write-Host "  -Deploy         Déclenche un déploiement manuel" -ForegroundColor Cyan
    Write-Host "  -ProjectName    Nom du projet (par défaut: nexiamind-ai)" -ForegroundColor Cyan
    Write-Host "  -TeamName       Nom de l'équipe Vercel" -ForegroundColor Cyan
    Write-Host ""
    Write-Host "Étapes manuelles requises AVANT d'exécuter ce script:" -ForegroundColor Red
    Write-Host "  1. Créer un compte sur https://vercel.com" -ForegroundColor White
    Write-Host "  2. Créer un projet manuellement dans Vercel Dashboard" -ForegroundColor White
    Write-Host "  3. Lier le dépôt GitHub Netchard/NexiaMindAi" -ForegroundColor White
    Write-Host "  4. Configurer les variables d'environnement dans Vercel Dashboard" -ForegroundColor White
    Write-Host "     - SUPABASE_URL" -ForegroundColor White
    Write-Host "     - SUPABASE_ANON_KEY" -ForegroundColor White
    Write-Host "     - SUPABASE_SERVICE_ROLE_KEY" -ForegroundColor White
    Write-Host "     - MISTRAL_API_KEY" -ForegroundColor White
    Write-Host ""
    exit 0
}

# ============================================================================
# VÉRIFIER LES PRÉREQUIS
# ============================================================================
Write-Header "Vercel Setup - NexiaMind AI"

# Vérifier Node.js
Write-Step 0 "Vérification des prérequis..."
$nodeVersion = node --version 2>$null
if (-not $nodeVersion) {
    Write-Error "Node.js n'est pas installé. Téléchargez-le depuis https://nodejs.org/"
    exit 1
}
Write-Success "Node.js $nodeVersion est installé"

# Vérifier npm
$npmVersion = npm --version 2>$null
if (-not $npmVersion) {
    Write-Error "npm n'est pas installé"
    exit 1
}
Write-Success "npm $npmVersion est installé"

# Vérifier Vercel CLI
$vercelVersion = vercel --version 2>$null
if (-not $vercelVersion) {
    Write-Warning "Vercel CLI n'est pas installé. Installation..."
    npm install -g vercel 2>&1 | Out-Null
    $vercelVersion = vercel --version 2>$null
    if (-not $vercelVersion) {
        Write-Error "Impossible d'installer Vercel CLI"
        exit 1
    }
}
Write-Success "Vercel CLI $vercelVersion est installé"

# Vérifier Git
$gitVersion = git --version 2>$null
if (-not $gitVersion) {
    Write-Error "Git n'est pas installé. Téléchargez-le depuis https://git-scm.com/"
    exit 1
}
Write-Success "Git $gitVersion est installé"

# ============================================================================
# VÉRIFIER LA CONFIGURATION LOCALE
# ============================================================================
if ($Check) {
    Write-Header "Vérification de la configuration"
    
    Write-Step 1 "Vérification de vercel.json..."
    if (Test-Path "vercel.json") {
        $vercelJson = Get-Content vercel.json -Raw | ConvertFrom-Json
        Write-Success "vercel.json existe"
        Write-Host "  Version: $($vercelJson.version)" -ForegroundColor White
        Write-Host "  Régions: $($vercelJson.regions -join ', ')" -ForegroundColor White
        if ($vercelJson.routes) {
            Write-Host "  Routes: $($vercelJson.routes.Count) configurées" -ForegroundColor White
        }
    } else {
        Write-Error "vercel.json n'existe pas"
    }
    
    Write-Step 2 "Vérification de package.json..."
    if (Test-Path "package.json") {
        $packageJson = Get-Content package.json -Raw | ConvertFrom-Json
        Write-Success "package.json existe"
        Write-Host "  Scripts:" -ForegroundColor White
        $packageJson.scripts | Get-Member -MemberType NoteProperty | ForEach-Object {
            Write-Host "    $($_.Name): $($packageJson.scripts[$_.Name])" -ForegroundColor Gray
        }
    } else {
        Write-Error "package.json n'existe pas"
    }
    
    Write-Step 3 "Vérification de .env.example..."
    if (Test-Path ".env.example") {
        Write-Success ".env.example existe"
        $envContent = Get-Content .env.example -Raw
        $varCount = ($envContent -split "`n" | Where-Object { $_ -match "^[A-Z_]+=" }).Count
        Write-Host "  Variables: $varCount définies" -ForegroundColor White
    } else {
        Write-Error ".env.example n'existe pas"
    }
    
    Write-Step 4 "Test du build local..."
    Write-Host "  Exécution: npm run build" -ForegroundColor White
    $buildOutput = npm run build 2>&1
    if ($LASTEXITCODE -eq 0) {
        Write-Success "Build réussi"
    } else {
        Write-Error "Build échoué"
        Write-Host "  Dernières lignes de sortie:" -ForegroundColor White
        $buildOutput[-10..-1] | ForEach-Object { Write-Host "  $_" -ForegroundColor Gray }
    }
    
    exit $LASTEXITCODE
}

# ============================================================================
# CONFIGURATION VERCEL
# ============================================================================
Write-Header "Configuration Vercel"

Write-Step 1 "Connexion à Vercel..."
if (-not (vercel whoami 2>$null)) {
    Write-Host "  Connectez-vous à Vercel:" -ForegroundColor White
    vercel login
    if ($LASTEXITCODE -ne 0) {
        Write-Error "Connexion à Vercel échouée"
        exit 1
    }
}
Write-Success "Connecté à Vercel en tant que $(vercel whoami)"

Write-Step 2 "Lier le projet local..."
if (-not (Test-Path ".vercel")) {
    Write-Host "  Liaison du projet..." -ForegroundColor White
    vercel link --name $ProjectName
    if ($LASTEXITCODE -ne 0) {
        Write-Error "Liaison du projet échouée"
        Write-Warning "Assurez-vous que le projet existe dans Vercel Dashboard"
        Write-Warning "ou exécutez: vercel link"
        exit 1
    }
}
Write-Success "Projet lié"

Write-Step 3 "Vérification des variables d'environnement..."
Write-Warning "Les variables d'environnement doivent être configurées dans Vercel Dashboard:"
Write-Host "  https://vercel.com/$TeamName/$ProjectName/settings/environment-variables" -ForegroundColor Cyan
Write-Host "" -ForegroundColor White
Write-Host "Variables requises:" -ForegroundColor White
Write-Host "  ✓ SUPABASE_URL" -ForegroundColor Green
Write-Host "  ✓ SUPABASE_ANON_KEY" -ForegroundColor Green
Write-Host "  ✓ SUPABASE_SERVICE_ROLE_KEY" -ForegroundColor Green
Write-Host "  ✓ MISTRAL_API_KEY" -ForegroundColor Green
Write-Host "" -ForegroundColor White

Write-Step 4 "Vérification de la configuration de build..."
Write-Host "  Build command: npm run build" -ForegroundColor White
Write-Host "  Output directory: .next" -ForegroundColor White
Write-Host "  Development command: npm run dev" -ForegroundColor White

# ============================================================================
# DÉPLOIEMENT
# ============================================================================
if ($Deploy) {
    Write-Header "Déploiement"
    
    Write-Step 5 "Déclenchement du déploiement..."
    Write-Host "  Déploiement en production..." -ForegroundColor White
    vercel --prod
    
    if ($LASTEXITCODE -eq 0) {
        Write-Success "Déploiement réussi!"
        Write-Host "" -ForegroundColor White
        Write-Host "Votre application est maintenant disponible à:" -ForegroundColor Green
        $projectInfo = vercel inspect 2>$null
        if ($projectInfo) {
            Write-Host "  $($projectInfo.url)" -ForegroundColor Cyan
        } else {
            Write-Host "  https://$ProjectName.vercel.app" -ForegroundColor Cyan
        }
    } else {
        Write-Error "Déploiement échoué"
        exit 1
    }
}

# ============================================================================
# INFORMATIONS FINALES
# ============================================================================
Write-Header "Étapes Suivantes"
Write-Host ""
Write-Host "1. Configurer les variables d'environnement dans Vercel Dashboard:" -ForegroundColor White
Write-Host "   https://vercel.com/$TeamName/$ProjectName/settings/environment-variables" -ForegroundColor Cyan
Write-Host ""
Write-Host "2. Vérifier que toutes les variables sont ajoutées:" -ForegroundColor White
Write-Host "   - SUPABASE_URL=https://pppmwsnpgsvipvwyeyfv.supabase.co" -ForegroundColor Gray
Write-Host "   - SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..." -ForegroundColor Gray
Write-Host "   - SUPABASE_SERVICE_ROLE_KEY=sb_secret_..." -ForegroundColor Gray
Write-Host "   - MISTRAL_API_KEY=sk-xxxxxx" -ForegroundColor Gray
Write-Host ""
Write-Host "3. Pousser un commit vers master pour déclencher le déploiement automatique:" -ForegroundColor White
Write-Host "   git add ." -ForegroundColor Gray
Write-Host "   git commit -m \"chore: prêt pour déploiement Vercel\"" -ForegroundColor Gray
Write-Host "   git push origin master" -ForegroundColor Gray
Write-Host ""
Write-Host "4. Accéder à l'application déployée:" -ForegroundColor White
Write-Host "   https://$ProjectName.vercel.app" -ForegroundColor Cyan
Write-Host ""

Write-Success "Configuration Vercel terminée!"
