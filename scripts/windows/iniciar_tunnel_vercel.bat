@echo off
setlocal EnableExtensions EnableDelayedExpansion
cd /d "%~dp0\..\.."
title JstudioPlay Pro - Tunnel + Vercel Sync
color 0B

echo ==============================================================================
echo          CLOUDFLARE TUNNEL + SYNC AUTOMATICO COM VERCEL
echo ==============================================================================
echo.

:: Baixa cloudflared se nao existir
if not exist "cloudflared.exe" (
    echo  [!] Baixando cloudflared.exe...
    powershell -NoProfile -Command "Invoke-WebRequest -Uri 'https://github.com/cloudflare/cloudflared/releases/latest/download/cloudflared-windows-amd64.exe' -OutFile 'cloudflared.exe'"
    if !errorlevel! neq 0 ( echo  [ERRO] Falha no download. & pause & exit /b 1 )
    echo  [OK] cloudflared baixado!
)

:: Le a porta do .env
set "APP_PORT=3030"
if exist "CREDENCIAIS\.env" (
    for /f "usebackq tokens=1,2 delims==" %%a in ("CREDENCIAIS\.env") do (
        if /i "%%a"=="PORT" set "APP_PORT=%%b"
    )
)

echo  [+] Iniciando tunnel para http://localhost:!APP_PORT!
echo  [+] A URL gerada sera sincronizada automaticamente com a Vercel.
echo  [+] Pressione Ctrl+C para encerrar.
echo.

:: Inicia o tunnel e captura a URL gerada em background
set "TUNNEL_URL_FILE=%TEMP%\jstudioplay_tunnel_url.txt"
del /f /q "!TUNNEL_URL_FILE!" 2>nul

:: Roda o tunnel e extrai a URL .trycloudflare.com
powershell -NoProfile -Command ^
  "$proc = Start-Process -FilePath '.\cloudflared.exe' -ArgumentList 'tunnel','--url','http://localhost:!APP_PORT!','--logfile','%TEMP%\cloudflared.log','--loglevel','info' -PassThru -WindowStyle Hidden; " ^
  "Write-Host ' [+] PID do tunnel: ' $proc.Id; " ^
  "Write-Host ' [+] Aguardando URL...'; " ^
  "$url = ''; $attempts = 0; " ^
  "while (-not $url -and $attempts -lt 30) { " ^
  "  Start-Sleep -Seconds 2; $attempts++; " ^
  "  if (Test-Path '%TEMP%\cloudflared.log') { " ^
  "    $log = Get-Content '%TEMP%\cloudflared.log' -Raw; " ^
  "    if ($log -match 'https://[a-z0-9\-]+\.trycloudflare\.com') { " ^
  "      $url = $Matches[0]; " ^
  "    } " ^
  "  } " ^
  "} " ^
  "if ($url) { " ^
  "  $url | Set-Content '!TUNNEL_URL_FILE!'; " ^
  "  Write-Host ''; " ^
  "  Write-Host ' ========================================'; " ^
  "  Write-Host ' URL PUBLICA DO BACKEND:'; " ^
  "  Write-Host ' ' $url; " ^
  "  Write-Host ' ========================================'; " ^
  "  Write-Host ''; " ^
  "  Write-Host ' [+] Atualizando BACKEND_URL na Vercel...'; " ^
  "  $vEnv = vercel env rm BACKEND_URL production --yes 2>$null; " ^
  "  echo $url | vercel env add BACKEND_URL production 2>&1 | Write-Host; " ^
  "  Write-Host ' [OK] Vercel atualizada! Aguardando redeploy...'; " ^
  "  vercel --prod --yes 2>&1 | Select-String 'https://' | Write-Host; " ^
  "  Write-Host ''; " ^
  "  Write-Host ' [OK] Deploy concluido! Acesse: https://jstudio-play.vercel.app'; " ^
  "} else { " ^
  "  Write-Host ' [AVISO] URL nao detectada automaticamente.'; " ^
  "  Write-Host ' Verifique o log em %TEMP%\cloudflared.log'; " ^
  "} " ^
  "Wait-Process -Id $proc.Id"

echo.
echo  [+] Tunnel encerrado.
pause
