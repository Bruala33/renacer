@echo off
setlocal enabledelayedexpansion

echo ======================================================
echo    BEATSTAR - ANDROID BUILDER (OPTIMIZADO)
echo ======================================================

set "JAVA_HOME=C:\Program Files\Java\jdk-21"
set "PATH=%JAVA_HOME%\bin;%PATH%"
set "ANDROID_HOME=%LOCALAPPDATA%\Android\Sdk"
set "GRADLE_BIN=C:\Users\popey\.gradle\wrapper\dists\gradle-8.14.3-all\10utluxaxniiv4wxiphsi49nj\gradle-8.14.3\bin\gradle.bat"

echo [1/4] Limpiando carpetas temporales y assets antiguos...
if exist "android\app\src\main\assets\www" rmdir /s /q "android\app\src\main\assets\www"
mkdir "android\app\src\main\assets\www"

echo [2/4] Copiando archivos web ligeros...
copy /Y "game.html" "android\app\src\main\assets\www\index.html" >nul
copy /Y "game.html" "android\app\src\main\assets\www\game.html" >nul
if exist "manifest.json" copy /Y "manifest.json" "android\app\src\main\assets\www\" >nul
if exist "sw.js" copy /Y "sw.js" "android\app\src\main\assets\www\" >nul

:: Copiar static excluyendo descargas y APKs
if exist "static" (
    xcopy /E /I /Y "static" "android\app\src\main\assets\www\static" /EXCLUDE:exclude_list.txt >nul 2>nul || xcopy /E /I /Y "static" "android\app\src\main\assets\www\static" >nul
)
if exist "app\static" (
    xcopy /E /I /Y "app\static" "android\app\src\main\assets\www\static" >nul
)

:: Eliminar cualquier APK o descarga que se haya colado en assets
if exist "android\app\src\main\assets\www\static\downloads" rmdir /s /q "android\app\src\main\assets\www\static\downloads"
del /s /q "android\app\src\main\assets\www\*.apk" >nul 2>nul

echo.
echo [3/4] Compilando APK limpio con Gradle...
cd android
call "%GRADLE_BIN%" clean
call "%GRADLE_BIN%" assembleDebug --no-daemon
if %ERRORLEVEL% neq 0 (
    echo [ERROR] Fallo en la compilacion de Gradle.
    cd ..
    exit /b %ERRORLEVEL%
)
cd ..

echo.
echo [4/4] Guardando APK final...
if not exist "app\static\downloads" mkdir "app\static\downloads"
copy /Y "android\app\build\outputs\apk\debug\app-debug.apk" "app\static\downloads\beatstar.apk" >nul

echo.
echo ======================================================
echo  [EXITO] APK Compilado (~15 MB)
echo  Ubicacion: app\static\downloads\beatstar.apk
echo ======================================================
pause