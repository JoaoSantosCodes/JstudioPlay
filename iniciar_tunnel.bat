@echo off
setlocal EnableExtensions
cd /d "%~dp0"
title JstudioPlay Pro - Cloudflare Tunnel
color 0B

echo ==============================================================================
echo                CLOUDFLARE TUNNEL - ACESSO EXTERNO SEGURO
echo ==============================================================================
echo.

if not exist "cloudflared.exe" (
    echo  [!] cloudflared.exe nao encontrado. Baixando executavel oficial...
    powershell -NoProfile -Command "Invoke-WebRequest -Uri 'https://github.com/cloudflare/cloudflared/releases/latest/download/cloudflared-windows-amd64.exe' -OutFile 'cloudflared.exe'"
    if %errorlevel% neq 0 (
        echo  [ERRO] Falha ao baixar cloudflared.exe.
        pause
        exit /b 1
    )
    echo  [OK] Download concluido com sucesso!
)

echo  [+] Iniciando tunel HTTPS para http://localhost:3000 ...
echo  [+] Aguarde a URL .trycloudflare.com ser gerada abaixo:
echo.

cloudflared.exe tunnel --url http://localhost:3000

pause
