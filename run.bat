@echo off
echo Installing root dependencies...
call npm install

echo Installing client-dashboard dependencies...
cd client-dashboard
call npm install
cd ..

echo Starting both applications...
:: Opens a new window for the backend
start "Backend Server" cmd /k "npm start"
:: Opens a new window for the frontend
start "Client Dashboard" cmd /k "cd client-dashboard && npm run dev"