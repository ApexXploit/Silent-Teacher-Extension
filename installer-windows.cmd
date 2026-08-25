@echo off
setlocal

set "DEST=%LOCALAPPDATA%\SilentTeacherExtension"

echo Installation de Silent Teacher Extension...
if not exist "%DEST%" mkdir "%DEST%"

copy /Y "%~dp0manifest.json" "%DEST%\manifest.json" >nul
copy /Y "%~dp0background.js" "%DEST%\background.js" >nul
copy /Y "%~dp0content.js" "%DEST%\content.js" >nul
copy /Y "%~dp0content.css" "%DEST%\content.css" >nul
copy /Y "%~dp0english-test.html" "%DEST%\english-test.html" >nul
copy /Y "%~dp0english-test.css" "%DEST%\english-test.css" >nul
copy /Y "%~dp0english-test.js" "%DEST%\english-test.js" >nul

if not exist "%DEST%\manifest.json" goto :error
if not exist "%DEST%\english-test.html" goto :error

echo.
echo Extension copiee dans :
echo %DEST%
echo.
echo Dans Chrome, cliquez sur Charger l'extension non empaquetee
echo puis selectionnez ce dossier.

start "" explorer.exe "%DEST%"
start "" chrome.exe "chrome://extensions"
pause
exit /b 0

:error
echo.
echo ERREUR : la copie de l'extension a echoue.
echo Verifiez que tous les fichiers sont presents a cote de cet installateur.
pause
exit /b 1
