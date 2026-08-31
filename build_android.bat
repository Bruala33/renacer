@echo off
setlocal enabledelayedexpansion

echo ======================================================
echo     BEATSTAR RENACER - ANDROID APK BUILDER
echo ======================================================

set "JAVA_HOME=C:\Program Files\Java\jdk-21"
set "PATH=%JAVA_HOME%\bin;%PATH%"
set "ANDROID_HOME=%LOCALAPPDATA%\Android\Sdk"
set "GRADLE_BIN=C:\Users\popey\.gradle\wrapper\dists\gradle-8.14.3-all\10utluxaxniiv4wxiphsi49nj\gradle-8.14.3\bin\gradle.bat"

echo.
echo [1/4] Sincronizando assets base...
if exist ".venv\Scripts\python.exe" (
    call .venv\Scripts\python.exe sync_android_assets.py
)

echo.
echo [2/4] Sobrescribiendo index.html con el juego real (game.html)...
:: Asegurar que el juego real sea la pantalla de inicio
if exist "app\static\game.html" (
    copy /Y "app\static\game.html" "android\app\src\main\assets\www\index.html"
    copy /Y "app\static\game.html" "android\app\src\main\assets\www\game.html"
)
if exist "game.html" (
    copy /Y "game.html" "android\app\src\main\assets\www\index.html"
    copy /Y "game.html" "android\app\src\main\assets\www\game.html"
)

:: Purgar archivos pesados de la app
del /q "android\app\src\main\assets\www\*.apk" >nul 2>nul
del /q "android\app\src\main\assets\www\*.mp4" >nul 2>nul
if exist "android\app\src\main\assets\www\downloads" rmdir /s /q "android\app\src\main\assets\www\downloads"

echo.
echo [3/4] Compilando APK limpio con Gradle...
cd android
call "%GRADLE_BIN%" assembleDebug --no-daemon
if %ERRORLEVEL% neq 0 (
    echo [ERROR] Fallo en la compilacion de Gradle.
    cd ..
    pause
    exit /b %ERRORLEVEL%
)
cd ..

echo.
echo [4/4] Copiando APK final...
if not exist "app\static\downloads" mkdir "app\static\downloads"
copy /Y "android\app\build\outputs\apk\debug\app-debug.apk" "app\static\downloads\beatstar.apk" >nul
copy /Y "android\app\build\outputs\apk\debug\app-debug.apk" "beatstar.apk" >nul

echo.
echo ======================================================
echo  [EXITO] APK Compilado (~15 MB) con el juego directo!
echo  Ubicacion: beatstar.apk
echo ======================================================
pause