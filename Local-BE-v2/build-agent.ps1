# ==============================================================================
# Nexus Agent - Single-File Standalone Release Build Script
# ==============================================================================
Write-Host ""
Write-Host "[Nexus Build] Starting Standalone Release Packaging..." -ForegroundColor Cyan

$CurrentDir = Split-Path -Parent $MyInvocation.MyCommand.Path
Set-Location $CurrentDir

# 1. Stop any currently running instances so dist/nexus.exe is not locked
Write-Host "`n[*] Stopping running Nexus instances..." -ForegroundColor Yellow
Get-Process -Name "nexus", "Nexus.Agent" -ErrorAction SilentlyContinue | Stop-Process -Force -ErrorAction SilentlyContinue

# Clean previous dist artifacts to avoid nested build outputs
if (Test-Path "$CurrentDir\dist") {
    Remove-Item -Recurse -Force "$CurrentDir\dist" -ErrorAction SilentlyContinue
}

# 2. Build SetupPage (Vite / React)
Write-Host "`n[*] [1/2] Compiling Local Setup UI (SetupPage)..." -ForegroundColor Yellow
Set-Location "$CurrentDir\SetupPage"
npm run build
if ($LASTEXITCODE -ne 0) {
    Write-Host "[!] SetupPage build failed!" -ForegroundColor Red
    Set-Location $CurrentDir
    exit 1
}
Set-Location $CurrentDir

# 3. Compile C# .NET 8 Standalone Single-File Binary
Write-Host "`n[*] [2/2] Compiling nexus.exe (.NET 8 Win-x64 SingleFile + WinExe)..." -ForegroundColor Yellow
dotnet publish -c Release -r win-x64 --self-contained `
  -p:PublishSingleFile=true `
  -p:IncludeNativeLibrariesForSelfExtract=true `
  -p:EnableCompressionInSingleFile=true `
  -p:OutputType=Exe `
  -o ./dist

if ($LASTEXITCODE -ne 0) {
    Write-Host "[!] .NET compilation failed!" -ForegroundColor Red
    exit 1
}

# 4. Report Success
$OutputExe = "$CurrentDir\dist\nexus.exe"
if (Test-Path $OutputExe) {
    $SizeMB = [Math]::Round((Get-Item $OutputExe).Length / 1MB, 2)

    # If already installed on this PC, update the installed binary too!
    $InstalledDir = "$env:LOCALAPPDATA\Programs\Nexus"
    if (Test-Path $InstalledDir) {
        Copy-Item -Path $OutputExe -Destination "$InstalledDir\nexus.exe" -Force
        Write-Host "[*] Updated installed binary at $InstalledDir\nexus.exe" -ForegroundColor Cyan
    }

    Write-Host "`n============================================================" -ForegroundColor Green
    Write-Host "[SUCCESS] NEXUS STANDALONE BUILD COMPLETE!" -ForegroundColor Green
    Write-Host "Location: $OutputExe" -ForegroundColor White
    Write-Host "File Size: $SizeMB MB (Fully Self-Contained, No .NET Runtime Required)" -ForegroundColor White
    Write-Host "============================================================`n" -ForegroundColor Green
} else {
    Write-Host "[!] Output binary not found at $OutputExe" -ForegroundColor Red
}
