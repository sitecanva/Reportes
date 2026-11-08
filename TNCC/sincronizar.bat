@echo off
setlocal enabledelayedexpansion
cd /d "%~dp0"

echo Buscando archivos HTML para renombrar a index.html...

REM Busca cualquier archivo .html que no sea index.html
for %%F in (*.html) do (
    if /i not "%%~nxF"=="index.html" (
        echo Archivo detectado: "%%~nxF"
        if exist "index.html" del /f /q "index.html"
        ren "%%F" "index.html"
        echo Renombrado exitosamente a index.html.
        goto :procesar_git
    )
)

:procesar_git
echo.
echo Verificando cambios en el repositorio...
git add .

REM Comprueba si hay cambios pendientes antes de hacer commit
git diff --cached --quiet
if errorlevel 1 (
    echo Creando confirmacion...
    git commit -m "Actualizacion automatica: %date% %time%"
    echo Subiendo cambios a GitHub...
    git push origin main --force
    echo.
    echo Repositorio sincronizado exitosamente.
) else (
    echo No hay cambios nuevos para subir.
)

echo.
timeout /t 3 >nul