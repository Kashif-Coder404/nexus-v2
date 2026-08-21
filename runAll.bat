cd /d "%~dp0"
@REM set SERVER="cd backend && npx tsx watch server.ts"
set SERVER="cd backend && npm run dev:server"
npx concurrently -n "frontend,server" -c "cyan.bold,green.bold" "cd frontend && npm run dev -- --host" %SERVER%
