<#
.SYNOPSIS
    Script PowerShell pour exécuter l'audit Lighthouse sur ST-309
.DESCRIPTION
    Ce script démarre le serveur Next.js et exécute Lighthouse audit
    pour mesurer les performances du frontend.

    Fait partie de ST-309: Optimiser les Performances Frontend
#>

param(
    [string]$Url = "http://localhost:3000/chat",
    [string]$OutputPath = "./lighthouse-report.html",
    [int]$Port = 3000,
    [int]$Timeout = 60
)

Write-Host "==========================================" -ForegroundColor Cyan
Write-Host "Lighthouse Audit pour ST-309" -ForegroundColor Cyan
Write-Host "==========================================" -ForegroundColor Cyan
Write-Host ""

# Vérifier que npm est disponible
try {
    $npmPath = (Get-Command npm).Source
    Write-Host "✓ npm trouvé: $npmPath" -ForegroundColor Green
} catch {
    Write-Host "✗ npm non trouvé. Veuillez installer Node.js" -ForegroundColor Red
    exit 1
}

# Vérifier que npx est disponible
try {
    $npxVersion = npx --version 2>$null
    Write-Host "✓ npx disponible" -ForegroundColor Green
} catch {
    Write-Host "✗ npx non trouvé" -ForegroundColor Red
    exit 1
}

# Vérifier que lighthouse est installé
try {
    $lighthouseVersion = npx lighthouse --version 2>$null
    Write-Host "✓ Lighthouse installé" -ForegroundColor Green
} catch {
    Write-Host "⚠ Lighthouse non trouvé, installation..." -ForegroundColor Yellow
    npm install -g lighthouse
}

Write-Host ""
Write-Host "Option 1: Démarrer le serveur manuellement" -ForegroundColor Yellow
Write-Host "----------------------------------------" -ForegroundColor Yellow
Write-Host "1. Dans un terminal: npm run dev" -ForegroundColor Yellow
Write-Host "2. Attendre que le serveur soit prêt (http://localhost:3000)" -ForegroundColor Yellow
Write-Host "3. Dans un autre terminal: npx lighthouse $Url --output=html --output-path=$OutputPath" -ForegroundColor Yellow
Write-Host ""

Write-Host "Option 2: Utiliser la build de production" -ForegroundColor Yellow
Write-Host "----------------------------------------" -ForegroundColor Yellow
Write-Host "1. npm run build" -ForegroundColor Yellow
Write-Host "2. npx next start --port $Port &" -ForegroundColor Yellow
Write-Host "3. Attendre que le serveur démarre (~5-10 secondes)" -ForegroundColor Yellow
Write-Host "4. npx lighthouse $Url --output=html --output-path=$OutputPath" -ForegroundColor Yellow
Write-Host ""

Write-Host "Option 3: Lancer automatiquement (requiert PowerShell 7+)" -ForegroundColor Yellow
Write-Host "----------------------------------------" -ForegroundColor Yellow
Write-Host "Exécuter: .\scripts\run-lighthouse-auto.ps1" -ForegroundColor Yellow
Write-Host ""

Write-Host "==========================================" -ForegroundColor Cyan
Write-Host "Commande directe pour Lighthouse:" -ForegroundColor Cyan
Write-Host "==========================================" -ForegroundColor Cyan
Write-Host "npx lighthouse $Url --output=html --output-path=$OutputPath --chrome-flags='--headless'"
Write-Host ""
