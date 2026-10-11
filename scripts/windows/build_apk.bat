@echo off
setlocal enabledelayedexpansion
title JstudioPlay - Compilar APK Android
cd /d "%~dp0"

echo ========================================================
echo       JstudioPlay - Compilador de APK Android
echo       (Suporte Nativo: Celular, Tablet, Android TV / TV Box)
echo ========================================================
echo.

if "%ANDROID_HOME%"=="" (
    if exist "%LOCALAPPDATA%\Android\Sdk" (
        set "ANDROID_HOME=%LOCALAPPDATA%\Android\Sdk"
    )
)

echo [1/3] Sincronizando assets web com o projeto Android...
call npx cap sync android
if %errorlevel% neq 0 (
    echo [ERRO] Falha ao sincronizar com o Capacitor.
    pause
    exit /b %errorlevel%
)
echo [OK] Sincronizacao concluida.
echo.

echo [2/3] Compilando APK Nativo com Gradle...
cd android
call gradlew.bat assembleDebug
if %errorlevel% neq 0 (
    echo [ERRO] Falha durante a compilacao do Gradle.
    cd ..
    pause
    exit /b %errorlevel%
)
cd ..
echo [OK] Compilacao concluida com sucesso.
echo.

echo [3/3] Copiando APK para pasta de distribuicao...
if not exist "dist-apk" mkdir "dist-apk"
if exist "android\app\build\outputs\apk\debug\app-debug.apk" (
    copy /y "android\app\build\outputs\apk\debug\app-debug.apk" "dist-apk\JstudioPlay.apk" >nul
    echo.
    echo ========================================================
    echo  SUCESSO! O APK foi gerado em:
    echo  %~dp0dist-apk\JstudioPlay.apk
    echo ========================================================
    echo.
    echo Pressione qualquer tecla para abrir a pasta do APK...
    pause >nul
    start "" explorer "%~dp0dist-apk"
) else (
    echo [AVISO] APK compilado mas nao encontrado no caminho padrao.
    pause
)

exit /b 0
