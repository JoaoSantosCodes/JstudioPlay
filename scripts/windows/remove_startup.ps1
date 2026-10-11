# PowerShell script to remove M3U PLAY auto-start on Windows
$StartupFolder = [System.Environment]::GetFolderPath([System.Environment+SpecialFolder]::Startup)
$ShortcutPath = Join-Path $StartupFolder "M3U_PLAY_Pro.lnk"

Write-Host "Removendo inicialização automática..." -ForegroundColor Yellow

if (Test-Path $ShortcutPath) {
    Remove-Item -Path $ShortcutPath -Force
    Write-Host ""
    Write-Host "[OK] Inicialização automática desativada com sucesso!" -ForegroundColor Green
    Write-Host "O M3U PLAY Pro não iniciará mais automaticamente com o Windows." -ForegroundColor White
} else {
    Write-Host ""
    Write-Host "[INFO] O atalho de inicialização já não estava presente." -ForegroundColor Cyan
}
