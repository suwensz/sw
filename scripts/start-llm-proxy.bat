@echo off
chcp 65001 >nul
title 素衡OS · AI 转发代理
echo ============================================================
echo    素衡OS AI 转发代理启动器   http://127.0.0.1:8898
echo    解决 DeepSeek/豆包/扣子 浏览器跨域(CORS)限制
echo ============================================================
echo.
where node >nul 2>nul
if errorlevel 1 (
  echo [错误] 未检测到 Node.js，请先安装：https://nodejs.org
  echo.
  pause
  exit /b 1
)
echo 正在启动代理（保持本窗口开启即代理运行中）...
echo 关闭本窗口即可停止代理。
echo.
node "%~dp0llm-proxy.cjs"
echo.
echo [提示] 若上方提示 8898 端口被占用，说明代理已在运行，无需重复启动。
pause
