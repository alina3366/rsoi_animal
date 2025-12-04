@echo off
cd /d "C:\Users\User\animal-adoption-app\backend"
echo Установка зависимостей...
call npm install
echo.
echo Инициализация базы данных...
call npm run db:init
echo.
echo Запуск сервера...
echo Сервер запущен на http://localhost:3000
echo Нажмите Ctrl+C для остановки
echo.
node src/app.js
pause