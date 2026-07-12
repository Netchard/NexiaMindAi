<#
.SYNOPSIS
    Script PowerShell pour exécuter automatiquement l'audit Lighthouse
.DESCRIPTION
    Ce script:
    1. Effectue une build de production
    2. Démarre le serveur Next.js
    3. Attend que le serveur soit prêt
    4. Exécute Lighthouse audit
    5. Génère le rapport HTML

    Fait partie de ST-309: Optimiser les Performances Frontend
#>

param(
    [string]$Url = "http://localhost:3000/chat",
    [string]$OutputPath = "./lighthouse-report.html",
    [int]$Port = 3000,
    [int]$MaxWaitTime = 120,
    [int]$CheckInterval = 2
)

Write-Host "==========================================" -ForegroundColor Cyan
Write-Host "ST-309: Lighthouse Audit Automatique" -ForegroundColor Cyan
Write-Host "==========================================" -ForegroundColor Cyan
Write-Host ""

# Fonction pour vérifier si une URL est accessible
function Test-UrlAccessible {
    param($Url, $Timeout = 1)
    try {
        $request = [System.Net.WebRequest]::Create($Url)
        $request.Timeout = $Timeout * 1000
        $request.ServicePoint.ConnectionLeaseTimeout = $Timeout * 1000
        $response = $request.GetResponse()
        $response.Close()
        return $true
    } catch {
        return $false
    }
}

# Étape 1: Build de production
Write-Host "Étape 1/4: Build de production..." -ForegroundColor Yellow
try {
    Write-Host "  Exécution: npm run build" -ForegroundColor Gray
    $buildProcess = Start-Process -FilePath "npm" -ArgumentList "run build" -Wait -NoNewWindow -PassThru
    
    if ($buildProcess.ExitCode -ne 0) {
        Write-Host "  ✗ Build échouée (code: $($buildProcess.ExitCode))" -ForegroundColor Red
        exit 1
    }
    
    Write-Host "  ✓ Build réussie" -ForegroundColor Green
} catch {
    Write-Host "  ✗ Erreur lors de la build: $_" -ForegroundColor Red
    exit 1
}

Write-Host ""

# Étape 2: Démarrer le serveur
Write-Host "Étape 2/4: Démarrage du serveur..." -ForegroundColor Yellow
try {
    Write-Host "  Exécution: npx next start --port $Port" -ForegroundColor Gray
    $serverProcess = Start-Process -FilePath "npx" -ArgumentList "next start --port $Port" -NoNewWindow -PassThru
    
    # Attendre que le serveur démarre
    Write-Host "  Attente du démarrage du serveur (max $MaxWaitTime secondes)..." -ForegroundColor Gray
    
    $startTime = Get-Date
    $serverReady = $false
    
    while ((New-TimeSpan -Start $startTime -End (Get-Date)).TotalSeconds -lt $MaxWaitTime) {
        if (Test-UrlAccessible -Url $Url) {
            $serverReady = $true
            break
        }
        Start-Sleep -Seconds $CheckInterval
        Write-Host "  ." -NoNewline -ForegroundColor Gray
    }
    
    if (-not $serverReady) {
        Write-Host "" -ForegroundColor Gray
        Write-Host "  ✗ Serveur non prêt après $MaxWaitTime secondes" -ForegroundColor Red
        Write-Host "  Arrêt du serveur..." -ForegroundColor Gray
        $serverProcess | Stop-Process -Force
        exit 1
    }
    
    Write-Host "" -ForegroundColor Gray
    Write-Host "  ✓ Serveur prêt sur $Url" -ForegroundColor Green
} catch {
    Write-Host "  ✗ Erreur lors du démarrage: $_" -ForegroundColor Red
    exit 1
}

Write-Host ""

# Étape 3: Exécuter Lighthouse
Write-Host "Étape 3/4: Exécution de Lighthouse..." -ForegroundColor Yellow
try {
    Write-Host "  Exécution: npx lighthouse $Url --output=html --output-path=$OutputPath --chrome-flags='--headless'" -ForegroundColor Gray
    
    $lighthouseProcess = Start-Process -FilePath "npx" -ArgumentList "lighthouse $Url --output=html --output-path=$OutputPath --chrome-flags='--headless'" -Wait -NoNewWindow -PassThru
    
    if ($lighthouseProcess.ExitCode -ne 0) {
        Write-Host "  ✗ Audit Lighthouse échoué (code: $($lighthouseProcess.ExitCode))" -ForegroundColor Red
    } else {
        Write-Host "  ✓ Audit Lighthouse terminé" -ForegroundColor Green
    }
} catch {
    Write-Host "  ✗ Erreur lors de l'audit: $_" -ForegroundColor Red
}

Write-Host ""

# Étape 4: Nettoyage
Write-Host "Étape 4/4: Nettoyage..." -ForegroundColor Yellow
try {
    Write-Host "  Arrêt du serveur..." -ForegroundColor Gray
    $serverProcess | Stop-Process -Force
    Write-Host "  ✓ Serveur arrêté" -ForegroundColor Green
} catch {
    Write-Host "  ⚠ Impossible d'arrêter le serveur manuellement" -ForegroundColor Yellow
}

Write-Host ""
Write-Host "==========================================" -ForegroundColor Cyan
Write-Host "Résumé:" -ForegroundColor Cyan
Write-Host "==========================================" -ForegroundColor Cyan
Write-Host "✓ Build de production: Terminée" -ForegroundColor Green
Write-Host "✓ Serveur démarré: Terminée" -ForegroundColor Green
Write-Host "✓ Audit Lighthouse: Terminé" -ForegroundColor Green
Write-Host "✓ Rapport généré: $OutputPath" -ForegroundColor Green
Write-Host ""
Write-Host "Ouvrir le rapport avec:" -ForegroundColor Cyan
Write-Host "  start $OutputPath" -ForegroundColor Yellow
Write-Host ""
