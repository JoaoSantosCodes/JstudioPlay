@echo off
setlocal enabledelayedexpansion
title JstudioPlay - Compilar Android App Bundle (.AAB) para Google Play Store
cd /d "%~dp0"

echo ==============================================================================
echo       JSTUDIOPLAY PRO - COMPILADOR RELEASE GOOGLE PLAY STORE (.AAB)
echo ==============================================================================
echo.

if "%ANDROID_HOME%"=="" (
    if exist "%LOCALAPPDATA%\Android\Sdk" (
        set "ANDROID_HOME=%LOCALAPPDATA%\Android\Sdk"
    )
)

echo [1/3] Sincronizando assets web com o projeto nativo Capacitor...
call npx cap sync android
if %errorlevel% neq 0 (
    echo.
    echo [ERRO] Falha ao sincronizar web assets com o Capacitor.
    pause
    exit /b %errorlevel%
)
echo [OK] Sincronizacao concluida.
echo.

echo [2/3] Compilando e assinando Android App Bundle (.aab) com Gradle Release...
cd android
call gradlew.bat bundleRelease
if %errorlevel% neq 0 (
    echo.
    echo [ERRO] Falha na compilacao do bundle pelo Gradle.
    cd ..
    pause
    exit /b %errorlevel%
)
cd ..
echo [OK] Compilacao e assinatura concluidas com sucesso!
echo.

echo [3/3] Exportando pacote para publicacao na Google Play...
if not exist "dist-playstore" mkdir "dist-playstore"
set "BUNDLE_SRC=android\app\build\outputs\bundle\release\app-release.aab"
set "BUNDLE_DEST=dist-playstore\JstudioPlay-release.aab"

if exist "%BUNDLE_SRC%" (
    copy /y "%BUNDLE_SRC%" "%BUNDLE_DEST%" >nul
    echo.
    echo ==============================================================================
    echo  SUCESSO TOTAL! PACOTE PRONTO PARA PUBLICACAO NA GOOGLE PLAY STORE:
    echo  Arquivo gerado: %~dp0%BUNDLE_DEST%
    echo ==============================================================================
    echo.
    echo  Proximos passos no Google Play Console:
    echo  1. Acesse: https://play.google.com/console
    echo  2. Selecione seu aplicativo (ou crie um novo: "JstudioPlay")
    echo  3. Va em Producao / Teste Fechado -^> Criar nova versao
    echo  4. Faca o upload do arquivo: %BUNDLE_DEST%
    echo  5. Adicione a URL da Politica de Privacidade: /privacy.html
    echo.
    echo Pressione qualquer tecla para abrir a pasta do pacote...
    pause >nul
    start "" explorer "%~dp0dist-playstore"
) else (
    echo [AVISO] O bundle foi compilado mas nao foi encontrado em %BUNDLE_SRC%.
    pause
)

exit /b 0
