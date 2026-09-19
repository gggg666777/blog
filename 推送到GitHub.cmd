@echo off
setlocal
cd /d "%~dp0"
set "PATH=%~dp0.tools\git\cmd;%PATH%"
set "GIT_TERMINAL_PROMPT=0"

echo.
echo ============================================================
echo   推送博客到 GitHub
echo ============================================================
echo.
echo   需要先准备一个 GitHub token。
echo   还没有的话，看同目录的「如何获取token.txt」。
echo.
echo   把 token 粘贴到下面：在窗口里点鼠标右键就是粘贴。
echo.
echo ------------------------------------------------------------
set /p TOKEN= token: 

if "%TOKEN%"=="" goto NOINPUT

echo ------------------------------------------------------------
echo.
echo   正在推送，请稍候...
echo.

git -c credential.helper= remote set-url origin https://gggg666777:%TOKEN%@github.com/gggg666777/blog.git
git -c credential.helper= push -u origin main
if errorlevel 1 goto FAILED

echo.
echo ============================================================
echo   推送成功！
echo.
echo   代码已上传到：
echo   https://github.com/gggg666777/blog
echo.
echo   下一步：去 Cloudflare 连接这个仓库。
echo ============================================================
goto END

:NOINPUT
echo.
echo   没有输入 token，已取消。
goto END

:FAILED
echo.
echo ============================================================
echo   推送失败。
echo.
echo   请依次检查：
echo    1. token 是否复制完整，别漏字符
echo    2. token 是否勾选了 repo 权限
echo    3. token 是否已过期或被删除
echo    4. 网络是否正常，可稍后重试
echo.
echo   把上面的错误文字告诉我即可，不要截图 token。
echo ============================================================
goto END

:END
echo.
pause
