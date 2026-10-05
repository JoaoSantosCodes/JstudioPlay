# ==============================================================================
# M3U PLAY PRO — Inicializacao Invisivel em Segundo Plano
# ==============================================================================
$ScriptDir = Split-Path -Parent $MyInvocation.MyCommand.Path
Set-Location $ScriptDir

# 1. Garantir que eventuais instancias anteriores travadas na porta 3000 sejam encerradas
$PortProc = Get-NetTCPConnection -LocalPort 3000 -ErrorAction SilentlyContinue
if ($PortProc) {
    Stop-Process -Id $PortProc.OwningProcess -Force -ErrorAction SilentlyContinue
    Start-Sleep -Milliseconds 800
}

# 2. Executar o servidor Node.js de forma continua
& node server/index.js
