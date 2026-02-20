@echo off
cd /d "c:\repos\my-tools\logo-normalizer"

echo Installing dependencies...
call pnpm install
echo Installation done.
echo.

echo Building the project...
call pnpm run build
echo Build done.
echo.

echo Starting development server...
call pnpm run dev
