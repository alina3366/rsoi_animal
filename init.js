const mysql = require('mysql2/promise');
const fs = require('fs').promises;
const path = require('path');
require('dotenv').config();

class DatabaseInitializer {
    constructor() {
        this.config = {
            host: process.env.DB_HOST || 'localhost',
            user: process.env.DB_USER || 'root',
            password: process.env.DB_PASSWORD || '',
            database: process.env.DB_NAME || 'animal_adoption_db',
            multipleStatements: true
        };
    }

    async initialize() {
        console.log('🚀 Начало инициализации базы данных...\n');

        try {
            // 1. Подключение без выбора базы данных
            const connection = await mysql.createConnection({
                host: this.config.host,
                user: this.config.user,
                password: this.config.password
            });

            console.log('✅ Подключение к MySQL установлено');

            // 2. Чтение SQL файла
            const sqlFilePath = path.join(__dirname, 'init.sql');
            const sql = await fs.readFile(sqlFilePath, 'utf8');

            console.log('📄 SQL файл загружен');

            // 3. Выполнение SQL скрипта
            console.log('⚡ Выполнение SQL скрипта...');
            await connection.query(sql);
            
            console.log('\n✅ База данных успешно инициализирована!');
            console.log('='.repeat(50));

            // 4. Показать итоговую информацию
            const [tables] = await connection.query(`
                SELECT table_name, table_rows 
                FROM information_schema.tables 
                WHERE table_schema = ?
                ORDER BY table_name
            `, [this.config.database]);

            console.log('📊 Созданные таблицы:');
            tables.forEach(table => {
                console.log(`   ${table.table_name}: ${table.table_rows} записей`);
            });

            console.log('\n🔗 Данные для подключения:');
            console.log(`   Host: ${this.config.host}`);
            console.log(`   Database: ${this.config.database}`);
            console.log(`   User: ${this.config.user}`);

            await connection.end();
            console.log('\n🎉 Инициализация завершена успешно!');
            console.log('Теперь можно запускать сервер командой: npm run dev');

        } catch (error) {
            console.error('\n❌ Ошибка инициализации базы данных:');
            console.error(error.message);
            
            if (error.code === 'ER_ACCESS_DENIED_ERROR') {
                console.error('\n🔧 Решение проблемы:');
                console.error('1. Проверьте правильность пароля MySQL в файле .env');
                console.error('2. Убедитесь, что MySQL сервер запущен');
                console.error('3. Проверьте права доступа пользователя');
            }
            
            process.exit(1);
        }
    }
}

// Запуск инициализации
if (require.main === module) {
    const initializer = new DatabaseInitializer();
    initializer.initialize();
}

module.exports = DatabaseInitializer;