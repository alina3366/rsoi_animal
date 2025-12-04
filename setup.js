const mysql = require('mysql2/promise');
require('dotenv').config();

async function setupDatabase() {
    console.log('🔄 Настройка базы данных...');
    
    // Конфигурация подключения
    const config = {
        host: process.env.DB_HOST || 'localhost',
        user: process.env.DB_USER || 'root',
        password: process.env.DB_PASSWORD || 'sqlroot060804_'
    };
    
    try {
        // 1. Подключиться к MySQL
        const connection = await mysql.createConnection(config);
        console.log('✅ Подключение к MySQL установлено');
        
        // 2. Создать базу данных
        await connection.query('CREATE DATABASE IF NOT EXISTS animal_adoption_db');
        console.log('✅ База данных animal_adoption_db создана/проверена');
        
        // 3. Использовать базу данных
        await connection.query('USE animal_adoption_db');
        
        // 4. Создать таблицу animals
        await connection.query(`
            CREATE TABLE IF NOT EXISTS animals (
                animal_id INT PRIMARY KEY AUTO_INCREMENT,
                name VARCHAR(100) NOT NULL,
                type VARCHAR(20),
                breed VARCHAR(100),
                age_months INT,
                gender VARCHAR(10),
                description TEXT,
                status VARCHAR(20) DEFAULT 'searching',
                location_city VARCHAR(100),
                main_photo_url VARCHAR(500),
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            )
        `);
        console.log('✅ Таблица animals создана/проверена');
        
        // 5. Добавить тестовые данные
        const [rows] = await connection.query('SELECT COUNT(*) as count FROM animals');
        if (rows[0].count === 0) {
            await connection.query(`
                INSERT INTO animals (name, type, breed, age_months, gender, description, location_city) VALUES
                ('Барсик', 'cat', 'Британский', 24, 'male', 'Ласковый кот, любит спать на коленях', 'Минск'),
                ('Шарик', 'dog', 'Дворняжка', 36, 'male', 'Дружелюбный пес, обожает детей', 'Гомель'),
                ('Мурка', 'cat', 'Сиамская', 12, 'female', 'Игривая кошка, очень активная', 'Минск')
            `);
            console.log('✅ Добавлены 3 тестовых животных');
        }
        
        console.log(`📊 В таблице animals: ${rows[0].count} животных`);
        
        await connection.end();
        console.log('✅ Настройка базы данных завершена!');
        
    } catch (error) {
        console.error('❌ Ошибка при настройке БД:', error.message);
        console.log('💡 Проверьте:');
        console.log('   1. Запущен ли MySQL сервер');
        console.log('   2. Правильный ли пароль в .env файле');
        console.log('   3. Есть ли права у пользователя root');
    }
}

setupDatabase();