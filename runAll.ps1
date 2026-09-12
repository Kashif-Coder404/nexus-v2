Set-Location backend
npx concurrently -t "HH:mm:ss" -n "BE,FE,LBE" -c "blue.bold,cyan.bold,magenta.bold,yellow.bold" "npm run dev:server" "npm run frontend" "npm run local-be"
