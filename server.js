// Простой файл запуска для разработки
require('dotenv').config();

// Проверка переменных окружения
const requiredEnvVars = ['DB_HOST', 'DB_USER', 'DB_PASSWORD', 'DB_NAME', 'JWT_SECRET'];
const missingEnvVars = requiredEnvVars.filter(varName => !process.env[varName]);

if (missingEnvVars.length > 0) {
    console.error('❌ Отсутствуют обязательные переменные окружения:');
    missingEnvVars.forEach(varName => {
        console.error(`   - ${varName}`);
    });
    console.error('\n📝 Создайте файл .env на основе .env.example');
    process.exit(1);
}

// Проверка Node.js версии
const nodeVersion = process.versions.node.split('.')[0];
if (parseInt(nodeVersion) < 14) {
    console.error('❌ Требуется Node.js версии 14 или выше');
    console.error(`   Текущая версия: ${process.version}`);
    process.exit(1);
}

// Запуск приложения
const AnimalAdoptionApp = require('./src/app');
const app = new AnimalAdoptionApp();

app.start();