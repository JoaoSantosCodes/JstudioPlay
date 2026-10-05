# PowerShell script to configure M3U PLAY auto-start on Windows
$ScriptDir = Split-Path -Parent $MyInvocation.MyCommand.Path
$TargetPs1 = Join-Path $ScriptDir "run_background.ps1"
$StartupFolder = [System.Environment]::GetFolderPath([System.Environment+SpecialFolder]::Startup)
$ShortcutPath = Join-Path $StartupFolder "M3U_PLAY_Pro.lnk"

Write-Host "==============================================================================" -ForegroundColor Cyan
Write-Host "            CONFIGURANDO INICIALIZACAO AUTOMATICA COM O WINDOWS               " -ForegroundColor Cyan
Write-Host "==============================================================================" -ForegroundColor Cyan
Write-Host ""
Write-Host "Criando atalho na pasta Inicializar do Windows..." -ForegroundColor Gray
Write-Host "Destino: $ShortcutPath" -ForegroundColor DarkGray

try {
    $WshShell = New-Object -ComObject WScript.Shell
    $Shortcut = $WshShell.CreateShortcut($ShortcutPath)
    $Shortcut.TargetPath = "powershell.exe"
    $Shortcut.Arguments = "-WindowStyle Hidden -NoProfile -ExecutionPolicy Bypass -File `"$TargetPs1`""
    $Shortcut.WorkingDirectory = "$ScriptDir"
    $Shortcut.Description = "M3U PLAY Pro - Servidor IPTV e Central de Streaming"
    $Shortcut.Save()

    Write-Host ""
    Write-Host "[OK] Inicializacao automatica configurada com sucesso!" -ForegroundColor Green
    Write-Host "- O servidor subira automaticamente e silenciosamente ao ligar o computador." -ForegroundColor Yellow
    Write-Host "- Painel disponivel em: http://localhost:3000" -ForegroundColor White
    Write-Host "- Para gerenciar ou desativar, abra o Gerenciador de Tarefas -> Inicializar." -ForegroundColor Gray
    Write-Host ""
} catch {
    Write-Host ""
    Write-Host "[ERRO] Falha ao configurar inicializacao automatica: $($_.Exception.Message)" -ForegroundColor Red
}
