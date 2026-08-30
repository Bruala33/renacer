@echo off
setlocal enabledelayedexpansion

echo ======================================================
echo    BEATSTAR RENACER - ANDROID APK BUILDER
echo ======================================================

set "JAVA_HOME=C:\Program Files\Java\jdk-21"
set "PATH=%JAVA_HOME%\bin;%PATH%"
set "ANDROID_HOME=%LOCALAPPDATA%\Android\Sdk"
set "GRADLE_BIN=C:\Users\popey\.gradle\wrapper\dists\gradle-8.14.3-all\10utluxaxniiv4wxiphsi49nj\gradle-8.14.3\bin\gradle.bat"

echo [1/3] Sincronizando assets de app/static hacia android/app/src/main/assets/www...
call .venv\Scripts\python.exe sync_android_assets.py
if %ERRORLEVEL% neq 0 (
    echo [ERROR] Fallo al sincronizar los assets web.
    exit /b %ERRORLEVEL%
)

echo.
echo [2/3] Compilando APK con Gradle y Android SDK...
cd android
call "%GRADLE_BIN%" assembleDebug --no-daemon
if %ERRORLEVEL% neq 0 (
    echo [ERROR] Fallo en la compilacion de Gradle.
    cd ..
    exit /b %ERRORLEVEL%
)
cd ..

echo.
echo [3/3] Exportando APK a app/static/downloads/beatstar.apk...
if not exist "app\static\downloads" mkdir "app\static\downloads"
copy /Y "android\app\build\outputs\apk\debug\app-debug.apk" "app\static\downloads\beatstar.apk" >nul

echo.
echo ======================================================
echo  [EXITO] APK Compilado Correctamente!
echo  Ubicacion local: app\static\downloads\beatstar.apk
echo ======================================================
