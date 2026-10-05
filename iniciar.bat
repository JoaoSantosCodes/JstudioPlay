@echo off
setlocal EnableExtensions
cd /d "%~dp0"
title M3U PLAY Pro - Servidor IPTV e Automacao
color 0B

:: Se passado argumento --silent (usado pela inicializacao automatica do Windows)
if "%~1"=="--silent" goto :run_silent
if "%~1"=="--test" exit /b 0
if "%~1"=="--dev" goto :mode_dev
if "%~1"=="dev" goto :mode_dev
if "%~1"=="--start" goto :mode_start

echo ==============================================================================
echo                      M3U PLAY PRO - SERVIDOR E STREAMING
echo ==============================================================================
echo.

:: 1. Verificacao do Node.js
echo  [+] Verificando ambiente Node.js...
where node >nul 2>nul
if %errorlevel% neq 0 (
    color 0C
    echo.
    echo  [ERRO] Node.js nao foi encontrado no seu sistema!
    echo  Por favor, instale o Node.js LTS versao 18 ou superior em: https://nodejs.org/
    echo.
    pause
    exit /b 1
)

for /f "tokens=*" %%v in ('node -v 2^>nul') do set "NODE_VER=%%v"
echo  [OK] Node.js detectado: %NODE_VER%

:: 2. Carregar configuracoes do .env
set "APP_PORT=3000"
set "APP_USER=admin"
set "APP_PASS=admin123"
set "APP_KEY=m3u_sec_d2241659862dc2a4886bc1c2cb65e710930b28e5472591ea"

if exist ".env" (
    for /f "usebackq tokens=1,2 delims==" %%a in (".env") do (
        if /i "%%a"=="PORT" set "APP_PORT=%%b"
        if /i "%%a"=="ADMIN_USERNAME" set "APP_USER=%%b"
        if /i "%%a"=="ADMIN_PASSWORD" set "APP_PASS=%%b"
        if /i "%%a"=="API_SECRET_KEY" set "APP_KEY=%%b"
    )
)

:: 3. Verificar dependencias (node_modules)
if not exist "node_modules" (
    echo.
    echo  [!] Pasta node_modules nao encontrada. Instalando dependencias...
    echo.
    call npm install
    if %errorlevel% neq 0 (
        color 0C
        echo.
        echo  [ERRO] Falha ao instalar dependencias do npm.
        echo.
        pause
        exit /b 1
    )
    echo  [OK] Dependencias instaladas com sucesso!
)

:: 4. Checagem de porta em uso
set "PORT_PID="
for /f "tokens=5" %%p in ('netstat -ano 2^>nul ^| findstr /R /C:":%APP_PORT% .*LISTENING"') do (
    set "PORT_PID=%%p"
)

if defined PORT_PID (
    echo.
    echo  [!] AVISO: A porta %APP_PORT% ja esta em uso pelo processo PID %PORT_PID%.
    echo  [+] Encerrando processo conflitante...
    taskkill /F /PID %PORT_PID% >nul 2>nul
    timeout /t 1 /nobreak >nul
    echo  [OK] Porta %APP_PORT% liberada com sucesso!
)

echo.
echo ==============================================================================
echo   INFORMACOES DE ACESSO:
echo   - Painel Web:     http://localhost:%APP_PORT%/
echo   - Dashboard:      http://localhost:%APP_PORT%/#/dashboard
echo   - Usuario Padrao: %APP_USER%
echo   - Senha Padrao:   %APP_PASS%
echo   - Chave API n8n:  %APP_KEY%
echo ==============================================================================
echo.
echo   [1] Iniciar Servidor (Padrao - abre navegador e inicia)
echo   [2] Iniciar em Modo Dev (Watch / Auto-reload)
echo   [3] Atualizar / Reinstalar Dependencias (npm install)
echo   [4] Ativar Inicializacao Automatica com o Windows
echo   [5] Desativar Inicializacao Automatica do Windows
echo   [6] Liberar Porta %APP_PORT% (Fechar processos Node)
echo   [7] Iniciar Cloudflare Tunnel (Acesso Externo Seguro)
echo   [0] Sair
echo.

choice /c 12345670 /t 3 /d 1 /m " Selecione uma opcao [Iniciando padrao em 3s]: "
set "OPT=%errorlevel%"

if "%OPT%"=="8" exit /b 0

if "%OPT%"=="7" (
    echo.
    echo  [+] Abrindo Cloudflare Tunnel em nova janela...
    start "" "%~dp0iniciar_tunnel.bat"
    timeout /t 2 /nobreak >nul
    cls
    goto :mode_start
)

if "%OPT%"=="6" (
    echo.
    echo  [+] Encerrando processos node.exe...
    taskkill /F /IM node.exe >nul 2>nul
    echo  [OK] Processos encerrados e porta liberada.
    timeout /t 2 /nobreak >nul
    cls
    goto :mode_start
)

if "%OPT%"=="5" (
    echo.
    powershell.exe -NoProfile -ExecutionPolicy Bypass -File "%~dp0remove_startup.ps1"
    echo.
    pause
    cls
    goto :mode_start
)

if "%OPT%"=="4" (
    echo.
    powershell.exe -NoProfile -ExecutionPolicy Bypass -File "%~dp0setup_startup.ps1"
    echo.
    pause
    cls
    goto :mode_start
)

if "%OPT%"=="3" (
    echo.
    echo  [+] Atualizando dependencias npm...
    call npm install
    echo.
    echo  [OK] Concluido!
    timeout /t 2 /nobreak >nul
    cls
    goto :mode_start
)

if "%OPT%"=="2" (
    goto :mode_dev
)

:mode_start
echo.
echo  [+] Iniciando o servidor M3U PLAY Pro...
echo  [+] Abrindo o navegador em 2 segundos...
echo.

start "" cmd /c "timeout /t 2 /nobreak >nul && start http://localhost:%APP_PORT%/#/dashboard"

node server/index.js
goto :check_error

:mode_dev
echo.
echo  [+] Iniciando em Modo Desenvolvimento (com auto-reload)...
echo  [+] Abrindo o navegador em 2 segundos...
echo.

start "" cmd /c "timeout /t 2 /nobreak >nul && start http://localhost:%APP_PORT%/#/dashboard"

call npm run dev
goto :check_error

:run_silent
:: Modo silencioso para inicializacao automatica com o Windows
set "APP_PORT=3000"
if exist ".env" (
    for /f "usebackq tokens=1,2 delims==" %%a in (".env") do (
        if /i "%%a"=="PORT" set "APP_PORT=%%b"
    )
)

:: Se a porta estiver em uso, libera silenciosamente
for /f "tokens=5" %%p in ('netstat -ano 2^>nul ^| findstr /R /C:":%APP_PORT% .*LISTENING"') do (
    taskkill /F /PID %%p >nul 2>nul
)

:: Garante dependencias se for primeira vez
if not exist "node_modules" (
    call npm install >nul 2>nul
)

node server/index.js
exit /b 0

:check_error
if %errorlevel% neq 0 (
    color 0C
    echo.
    echo  [ERRO] O servidor encerrou com codigo %errorlevel%.
    echo.
    pause
)
