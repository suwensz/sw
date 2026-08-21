@echo off
set "NODE_OPTIONS="
set "ELECTRON_RUN_AS_NODE="
set "ELECTRON_ENABLE_LOGGING=1"
echo NODE_OPTIONS cleared: [%NODE_OPTIONS%]
echo ELECTRON_RUN_AS_NODE cleared: [%ELECTRON_RUN_AS_NODE%]
start "" "C:\Program Files\SuhengOS\debugapp.exe"
echo start ErrorLevel: %ERRORLEVEL%
