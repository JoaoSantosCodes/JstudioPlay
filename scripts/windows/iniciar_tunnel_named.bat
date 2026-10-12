@echo off
setlocal EnableExtensions EnableDelayedExpansion
cd /d "%~dp0\..\.."
title JstudioPlay Pro - Cloudflare Named Tunnel (jstudioplay)
color 0A

echo ==============================================================================
echo          CLOUDFLARE NAMED TUNNEL - JSTUDIOPLAY (URL FIXA)
echo ==============================================================================
echo.
echo  [+] Tunnel ID: 5ccb0c06-e26c-448f-b35c-5101bbb4dfa4
echo  [+] URL Fixa:  https://api.jstudioplay.com
echo  [+] Config:    CREDENCIAIS\cloudflare-tunnel\config.yml
echo.

if not exist "cloudflared.exe" (
    echo [ERRO] cloudflared.exe nao encontrado.
    pause
    exit /b 1
)

.\cloudflared.exe tunnel --config CREDENCIAIS\cloudflare-tunnel\config.yml run jstudioplay

pause
