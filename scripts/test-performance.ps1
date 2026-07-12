<#
.SYNOPSIS
    Script de test de performance pour ST-309
.DESCRIPTION
    Exécute une série de tests de performance automatiques:
    - Vérification de la taille du bundle
    - Analyse des dépendances
    - Tests de chargement

    Fait partie de ST-309: Optimiser les Performances Frontend
#>

param(
    [int]$WarningThreshold = 5,  # MB - seuil d'avertissement
    [int]$ErrorThreshold = 8,    # MB - seuil d'erreur
    [string]$OutputDir = "./performance-results",
    [switch]$GenerateReport = $true
)

Write-Host "==========================================" -ForegroundColor Cyan
Write-Host "ST-309: Tests de Performance" -ForegroundColor Cyan
Write-Host "==========================================" -ForegroundColor Cyan
Write-Host ""

# Créer le répertoire de sortie
if (-not (Test-Path $OutputDir)) {
    New-Item -ItemType Directory -Path $OutputDir | Out-Null
    Write-Host "✓ Répertoire créé: $OutputDir" -ForegroundColor Green
}

$results = @{}
$startTime = Get-Date

# Test 1: Taille du bundle
Write-Host "Test 1/5: Vérification de la taille du bundle..." -ForegroundColor Yellow
try {
    $bundleDir = ".next/static/chunks"
    if (Test-Path $bundleDir) {
        $chunkFiles = Get-ChildItem -Path $bundleDir -File | Where-Object { $_.Name -match '\.js$' }
        $totalSize = ($chunkFiles | Measure-Object -Property Length -Sum).Sum / 1MB
        
        $results.BundleSize = @{
            Value = [math]::Round($totalSize, 2)
            Unit = "MB"
            Status = if ($totalSize -lt $WarningThreshold) { "PASS" } elseif ($totalSize -lt $ErrorThreshold) { "WARN" } else { "FAIL" }
        }
        
        Write-Host "  Taille totale: $($results.BundleSize.Value) $($results.BundleSize.Unit) [$($results.BundleSize.Status)]" -ForegroundColor $(if ($results.BundleSize.Status -eq "PASS") { "Green" } elseif ($results.BundleSize.Status -eq "WARN") { "Yellow" } else { "Red" })
    } else {
        Write-Host "  ⚠ Répertoire .next non trouvé. Exécuter 'npm run build' d'abord." -ForegroundColor Yellow
        $results.BundleSize = @{ Value = "N/A"; Unit = "MB"; Status = "SKIP" }
    }
} catch {
    Write-Host "  ✗ Erreur: $_" -ForegroundColor Red
    $results.BundleSize = @{ Value = "ERROR"; Unit = "MB"; Status = "FAIL" }
}

Write-Host ""

# Test 2: Nombre de chunks
Write-Host "Test 2/5: Analyse du nombre de chunks..." -ForegroundColor Yellow
try {
    $bundleDir = ".next/static/chunks"
    if (Test-Path $bundleDir) {
        $chunkFiles = Get-ChildItem -Path $bundleDir -File | Where-Object { $_.Name -match '\.js$' }
        $chunkCount = $chunkFiles.Count
        
        $results.ChunkCount = @{
            Value = $chunkCount
            Unit = "chunks"
            Status = "PASS"
        }
        
        Write-Host "  Nombre de chunks: $chunkCount [$($results.ChunkCount.Status)]" -ForegroundColor Green
    } else {
        $results.ChunkCount = @{ Value = "N/A"; Unit = "chunks"; Status = "SKIP" }
    }
} catch {
    Write-Host "  ✗ Erreur: $_" -ForegroundColor Red
    $results.ChunkCount = @{ Value = "ERROR"; Unit = "chunks"; Status = "FAIL" }
}

Write-Host ""

# Test 3: Vérification des optimisations
Write-Host "Test 3/5: Vérification des optimisations implémentées..." -ForegroundColor Yellow
try {
    $checks = @()
    
    # Vérifier QueryClientProvider
    $queryClient = Test-Path "src/providers/QueryClientProvider.tsx"
    $checks += @{ Name = "React Query Provider"; Status = if ($queryClient) { "PASS" } else { "FAIL" } }
    
    # Vérifier LoadingSpinner
    $loadingSpinner = Test-Path "src/components/common/LoadingSpinner.tsx"
    $checks += @{ Name = "LoadingSpinner"; Status = if ($loadingSpinner) { "PASS" } else { "FAIL" } }
    
    # Vérifier queries.ts
    $queries = Test-Path "src/lib/api/queries.ts"
    $checks += @{ Name = "React Query Hooks"; Status = if ($queries) { "PASS" } else { "FAIL" } }
    
    # Vérifier Image dans MarkdownRenderer
    $markdownRenderer = Get-Content "src/components/Markdown/MarkdownRenderer.tsx" -Raw
    $hasImage = $markdownRenderer -match "from 'next/image'"
    $checks += @{ Name = "Next.js Image"; Status = if ($hasImage) { "PASS" } else { "FAIL" } }
    
    # Vérifier Lazy Loading
    $chatMessage = Get-Content "src/components/Chat/ChatMessage.tsx" -Raw
    $hasLazy = $chatMessage -match "dynamic.*MarkdownRenderer" -or $chatMessage -match "lazy.*MarkdownRenderer"
    $checks += @{ Name = "Lazy Loading"; Status = if ($hasLazy) { "PASS" } else { "FAIL" } }
    
    $results.Optimizations = $checks
    
    foreach ($check in $checks) {
        Write-Host "  $($check.Name): [$($check.Status)]" -ForegroundColor $(if ($check.Status -eq "PASS") { "Green" } else { "Red" })
    }
} catch {
    Write-Host "  ✗ Erreur: $_" -ForegroundColor Red
    $results.Optimizations = @()
}

Write-Host ""

# Test 4: Vérification de la configuration
Write-Host "Test 4/5: Vérification de la configuration..." -ForegroundColor Yellow
try {
    $configChecks = @()
    
    # Vérifier next.config.js
    $nextConfig = Get-Content "next.config.js" -Raw
    $hasBundleAnalyzer = $nextConfig -match "bundle-analyzer"
    $hasImages = $nextConfig -match "images:"
    $hasRemotePatterns = $nextConfig -match "remotePatterns"
    
    $configChecks += @{ Name = "Bundle Analyzer"; Status = if ($hasBundleAnalyzer) { "PASS" } else { "FAIL" } }
    $configChecks += @{ Name = "Images Config"; Status = if ($hasImages) { "PASS" } else { "FAIL" } }
    $configChecks += @{ Name = "Remote Patterns"; Status = if ($hasRemotePatterns) { "PASS" } else { "FAIL" } }
    
    $results.Configuration = $configChecks
    
    foreach ($check in $configChecks) {
        Write-Host "  $($check.Name): [$($check.Status)]" -ForegroundColor $(if ($check.Status -eq "PASS") { "Green" } else { "Red" })
    }
} catch {
    Write-Host "  ✗ Erreur: $_" -ForegroundColor Red
    $results.Configuration = @()
}

Write-Host ""

# Test 5: Génération du rapport
Write-Host "Test 5/5: Génération du rapport..." -ForegroundColor Yellow
try {
    if ($GenerateReport) {
        $endTime = Get-Date
        $duration = ($endTime - $startTime).TotalSeconds
        
        $report = @{
            Timestamp = Get-Date -Format "yyyy-MM-dd HH:mm:ss"
            Duration = [math]::Round($duration, 2)
            Results = $results
            Summary = @{
                Total = @($results.Keys).Count
                Passed = (@($results.Keys) | Where-Object { $results[$_].Status -eq "PASS" }).Count
                Failed = (@($results.Keys) | Where-Object { $results[$_] -is [array] -and ($results[$_] | Where-Object { $_.Status -eq "FAIL" }).Count -gt 0 }).Count + 
                         (@($results.Keys) | Where-Object { $results[$_].Status -eq "FAIL" }).Count
                Warnings = (@($results.Keys) | Where-Object { $results[$_].Status -eq "WARN" }).Count
            }
        }
        
        $timestamp = Get-Date -Format "yyyyMMdd-HHmmss"
        $reportPath = Join-Path $OutputDir "performance-report-$timestamp.json"
        $report | ConvertTo-Json -Depth 5 | Out-File -FilePath $reportPath
        
        Write-Host "  ✓ Rapport généré: $reportPath" -ForegroundColor Green
    }
} catch {
    Write-Host "  ✗ Erreur: $_" -ForegroundColor Red
}

Write-Host ""
Write-Host "==========================================" -ForegroundColor Cyan
Write-Host "Résumé:" -ForegroundColor Cyan
Write-Host "==========================================" -ForegroundColor Cyan

$passed = 0
$failed = 0
$warnings = 0

# Compter les résultats
if ($results.BundleSize.Status -eq "PASS") { $passed++ } elseif ($results.BundleSize.Status -eq "WARN") { $warnings++ } else { $failed++ }
if ($results.ChunkCount.Status -eq "PASS") { $passed++ } elseif ($results.ChunkCount.Status -eq "WARN") { $warnings++ } else { $failed++ }

if ($results.Optimizations) {
    foreach ($opt in $results.Optimizations) {
        if ($opt.Status -eq "PASS") { $passed++ } else { $failed++ }
    }
}

if ($results.Configuration) {
    foreach ($config in $results.Configuration) {
        if ($config.Status -eq "PASS") { $passed++ } else { $failed++ }
    }
}

Write-Host "✓ Passés: $passed" -ForegroundColor Green
Write-Host "⚠ Avertissements: $warnings" -ForegroundColor Yellow
Write-Host "✗ Échecs: $failed" -ForegroundColor Red

if ($failed -gt 0) {
    Write-Host "" -ForegroundColor Gray
    Write-Host "Action recommandée: Vérifier les échecs ci-dessus" -ForegroundColor Yellow
}

if ($GenerateReport) {
    Write-Host "" -ForegroundColor Gray
    Write-Host "Rapport complet: $OutputDir" -ForegroundColor Cyan
}

$endTime = Get-Date
$duration = ($endTime - $startTime).TotalSeconds
Write-Host "" -ForegroundColor Gray
Write-Host "Durée totale: $([math]::Round($duration, 2)) secondes" -ForegroundColor Gray
