@echo off
chcp 65001 >nul
cd /d "%~dp0"
where node.exe >nul 2>nul
if errorlevel 1 (
  echo 请安装 Node.js 22 或更新版本，再启动工作台。
  pause
  exit /b 1
)
node.exe launch.mjs
if errorlevel 1 pause
