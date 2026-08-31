@echo off
setlocal enabledelayedexpansion

echo ======================================================
echo    BEATSTAR RENACER - ANDROID APK BUILDER
echo ======================================================

set "JAVA_HOME=C:\Program Files\Java\jdk-21"
set "PATH=%JAVA_HOME%\bin;%PATH%"
set "ANDROID_HOME=%LOCALAPPDATA%\Android\Sdk"
set "GRADLE_BIN=C:\Users\popey\.gradle\wrapper\dists\gradle-8.14.3-all\10utluxaxniiv4wxiphsi49nj\gradle-8.14.3\bin\gradle.bat"

echo [1/3] Sincronizando assets web hacia android/app/src/main/assets/www...
if not exist "android\app\src\main\assets\www" mkdir "android\app\src\main\assets\www"

:: Copiar archivos base a la carpeta assets de Android
copy /Y "game.html" "android\app\src\main\assets\www\index.html" >nul
copy /Y "game.html" "android\app\src\main\assets\www\game.html" >nul
if exist "manifest.json" copy /Y "manifest.json" "android\app\src\main\assets\www\" >nul
if exist "sw.js" copy /Y "sw.js" "android\app\src\main\assets\www\" >nul
if exist "static" xcopy /E /I /Y "static" "android\app\src\main\assets\www\static" >nul
if exist "app\static" xcopy /E /I /Y "app\static" "android\app\src\main\assets\www\static" >nul

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
echo [3/3] Exportando APK compilado...
if not exist "app\static\downloads" mkdir "app\static\downloads"
copy /Y "android\app\build\outputs\apk\debug\app-debug.apk" "app\static\downloads\beatstar.apk" >nul

echo.
echo ======================================================
echo  [EXITO] APK Compilado Correctamente!
echo  Ubicacion: app\static\downloads\beatstar.apk
echo ======================================================
pause