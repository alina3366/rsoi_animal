document.addEventListener('DOMContentLoaded', function() {
    // ========== КОНФИГУРАЦИЯ ==========
    const API_URL = 'http://localhost:3001';
    
    // ========== ЭЛЕМЕНТЫ ИНТЕРФЕЙСА ==========
    // Навигация
    const homeLink = document.getElementById('home-link');
    const animalsLink = document.getElementById('animals-link');
    const addAnimalLink = document.getElementById('add-animal-link');
    const requestsLink = document.getElementById('requests-link');
    const favoritesLink = document.getElementById('favorites-link');
    const adminLink = document.getElementById('admin-link');
    
    // Кнопки авторизации
    const loginBtn = document.getElementById('login-btn');
    const registerBtn = document.getElementById('register-btn');
    const logoutBtn = document.getElementById('logout-btn');
    const userMenu = document.getElementById('user-menu');
    const userName = document.getElementById('user-name');
    
    // Секции
    const homeSection = document.getElementById('home-section');
    const animalsSection = document.getElementById('animals-section');
    const addAnimalSection = document.getElementById('add-animal-section');
    const loginSection = document.getElementById('login-section');
    const registerSection = document.getElementById('register-section');
    const animalDetailsSection = document.getElementById('animal-details-section');
    const registerTypeSection = document.getElementById('register-type-section');
    const adminSection = document.getElementById('admin-section');
    
    // Кнопки закрытия модалок
    const closeLoginBtn = document.getElementById('close-login');
    const closeRegisterBtn = document.getElementById('close-register');
    const closeRegisterTypeBtn = document.getElementById('close-register-type');
    
    // Формы
    const loginForm = document.getElementById('login-form');
    const registerForm = document.getElementById('register-form');
    const addAnimalForm = document.getElementById('add-animal-form');
    
    // Элементы для отображения
    const animalsList = document.getElementById('animals-list');
    const userMenuStats = document.getElementById('user-menu-stats');
    
    // ========== ПЕРЕМЕННЫЕ ==========
    let currentUser = null;
    let userFavorites = [];
    let userApplications = [];
    let animalsData = [];
    let allUsersData = []; // Для администратора
    
    // ========== ИНИЦИАЛИЗАЦИЯ ==========
    initApp();
    
    // ========== ОСНОВНЫЕ ФУНКЦИИ ==========
    
    async function initApp() {
        // Загружаем пользователя из localStorage
        const userData = localStorage.getItem('user');
        const token = localStorage.getItem('token');
        
        console.log('Инициализация приложения. Пользователь в localStorage:', userData ? 'Есть' : 'Нет');
        
        if (userData && token) {
            try {
                currentUser = JSON.parse(userData);
                console.log('Текущий пользователь:', currentUser);
                
                // Загружаем данные пользователя
                await loadUserData();
                
                // Загружаем всех пользователей (для администратора)
                await loadAllUsersData();
                
                // Сразу показываем профиль пользователя
                checkAuth();
            } catch (error) {
                console.error('Ошибка загрузки пользователя:', error);
            }
        }
        
        // Показать домашнюю страницу
        showSection('home');
        await updateStats();
        await loadAnimals();
        updateNavigation();
    }
    
    async function loadUserData() {
        if (!currentUser) return;
        
        try {
            // Загружаем избранное пользователя
            const savedFavorites = localStorage.getItem(`user_favorites_${currentUser.id}`);
            if (savedFavorites) {
                userFavorites = JSON.parse(savedFavorites);
            }
            
            // Загружаем заявки пользователя
            const savedApplications = localStorage.getItem(`user_applications_${currentUser.id}`);
            if (savedApplications) {
                userApplications = JSON.parse(savedApplications);
            }
            
            updateUserMenu();
            
        } catch (error) {
            console.error('Ошибка загрузки данных пользователя:', error);
        }
    }
    
    async function loadAllUsersData() {
        try {
            // Загружаем всех пользователей из localStorage
            const savedUsers = [];
            
            // Собираем всех пользователей из localStorage
            for (let i = 0; i < localStorage.length; i++) {
                const key = localStorage.key(i);
                if (key.startsWith('user_') && !key.includes('favorites') && !key.includes('applications')) {
                    try {
                        const user = JSON.parse(localStorage.getItem(key));
                        if (user && user.id) {
                            savedUsers.push(user);
                        }
                    } catch (e) {
                        console.warn('Ошибка парсинга пользователя из', key);
                    }
                }
            }
            
            // Также проверяем текущего пользователя
            const currentUserData = localStorage.getItem('user');
            if (currentUserData) {
                const current = JSON.parse(currentUserData);
                if (!savedUsers.some(u => u.id === current.id)) {
                    savedUsers.push(current);
                }
            }
            
            // Добавляем тестовых пользователей, если нет данных
            if (savedUsers.length === 0) {
                allUsersData = getTestUsers();
            } else {
                allUsersData = savedUsers;
            }
            
            console.log('Загружено пользователей:', allUsersData.length);
            
        } catch (error) {
            console.error('Ошибка загрузки всех пользователей:', error);
            allUsersData = getTestUsers();
        }
    }
    
    function getTestUsers() {
        return [
            {
                id: 1001,
                full_name: 'Иван Петров',
                email: 'user1@example.com',
                role_id: 1,
                phone: '+375291111111',
                city: 'Минск',
                created_at: '2024-01-10T10:00:00Z'
            },
            {
                id: 1002,
                full_name: 'Мария Сидорова',
                email: 'volunteer1@example.com',
                role_id: 2,
                phone: '+375292222222',
                city: 'Гомель',
                organization: 'Приют "Доброе сердце"',
                experience: '3 года',
                created_at: '2024-01-12T14:30:00Z'
            },
            {
                id: 1003,
                full_name: 'Администратор',
                email: 'admin@example.com',
                role_id: 3,
                phone: '+375293333333',
                city: 'Минск',
                created_at: '2024-01-01T09:00:00Z'
            }
        ];
    }
    
    function updateUserMenu() {
        if (!currentUser) return;
        
        if (userName) {
            userName.textContent = currentUser.full_name || currentUser.email;
            
            // Добавляем бейдж роли
            const roleBadge = document.createElement('span');
            roleBadge.className = 'role-badge';
            
            switch(currentUser.role_id) {
                case 1:
                    roleBadge.textContent = 'Пользователь';
                    roleBadge.style.backgroundColor = '#4CAF50';
                    break;
                case 2:
                    roleBadge.textContent = 'Волонтер';
                    roleBadge.style.backgroundColor = '#2196F3';
                    break;
                case 3:
                    roleBadge.textContent = 'Администратор';
                    roleBadge.style.backgroundColor = '#FF5722';
                    break;
            }
            
            // Удаляем старый бейдж, если есть
            const oldBadge = userName.querySelector('.role-badge');
            if (oldBadge) {
                oldBadge.remove();
            }
            userName.appendChild(roleBadge);
        }
        
        if (userMenuStats) {
            let statsHTML = '';
            
            if (currentUser.role_id === 1) { // Обычный пользователь
                const favCount = userFavorites.length;
                const appCount = userApplications.length;
                
                statsHTML = `
                    <div class="user-stats">
                        <span class="stat-item">
                            <i class="fas fa-heart"></i> ${favCount}
                        </span>
                        <span class="stat-item">
                            <i class="fas fa-file-alt"></i> ${appCount}
                        </span>
                    </div>
                `;
            } else if (currentUser.role_id === 2) { // Волонтер
                const userAnimals = animalsData.filter(animal => 
                    animal.created_by === currentUser.id
                );
                const animalsCount = userAnimals.length;
                
                let totalFavorites = 0;
                userAnimals.forEach(animal => {
                    totalFavorites += animal.favorites_count || 0;
                });
                
                let pendingApplications = 0;
                userAnimals.forEach(animal => {
                    pendingApplications += animal.applications_count || 0;
                });
                
                statsHTML = `
                    <div class="user-stats">
                        <span class="stat-item" title="Добавленных животных">
                            <i class="fas fa-paw"></i> ${animalsCount}
                        </span>
                        <span class="stat-item" title="Добавлений в избранное">
                            <i class="fas fa-star"></i> ${totalFavorites}
                        </span>
                        <span class="stat-item" title="Заявок на пристройство">
                            <i class="fas fa-home"></i> ${pendingApplications}
                        </span>
                    </div>
                `;
            } else if (currentUser.role_id === 3) { // Администратор
                const totalAnimals = animalsData.length;
                const adoptedAnimals = animalsData.filter(a => a.status === 'adopted').length;
                const totalUsers = allUsersData.length;
                const totalApplications = userApplications.length;
                
                statsHTML = `
                    <div class="user-stats admin-stats">
                        <span class="stat-item" title="Всего животных">
                            <i class="fas fa-paw"></i> ${totalAnimals}
                        </span>
                        <span class="stat-item" title="Пристроено">
                            <i class="fas fa-home"></i> ${adoptedAnimals}
                        </span>
                        <span class="stat-item" title="Пользователей">
                            <i class="fas fa-users"></i> ${totalUsers}
                        </span>
                        <span class="stat-item" title="Заявок">
                            <i class="fas fa-file-alt"></i> ${totalApplications}
                        </span>
                    </div>
                `;
            }
            
            userMenuStats.innerHTML = statsHTML;
        }
    }
    
    function checkAuth() {
        console.log('Проверка авторизации. Текущий пользователь:', currentUser);
        
        if (currentUser) {
            // Пользователь авторизован
            console.log('Пользователь авторизован, скрываем кнопки входа/регистрации');
            if (loginBtn) loginBtn.classList.add('hidden');
            if (registerBtn) registerBtn.classList.add('hidden');
            if (userMenu) userMenu.classList.remove('hidden');
            
            updateNavigation();
        } else {
            // Пользователь не авторизован
            console.log('Пользователь не авторизован, показываем кнопки входа/регистрации');
            if (loginBtn) loginBtn.classList.remove('hidden');
            if (registerBtn) registerBtn.classList.remove('hidden');
            if (userMenu) userMenu.classList.add('hidden');
        }
    }
    
    function updateNavigation() {
        if (!currentUser) {
            if (addAnimalLink) addAnimalLink.classList.add('hidden');
            if (requestsLink) requestsLink.classList.add('hidden');
            if (favoritesLink) favoritesLink.classList.add('hidden');
            if (adminLink) adminLink.classList.add('hidden');
            return;
        }
        
        if (favoritesLink) favoritesLink.classList.remove('hidden');
        
        if (currentUser.role_id === 3) { // Администратор
            // Администратор видит ВСЕ
            if (addAnimalLink) addAnimalLink.classList.remove('hidden');
            if (requestsLink) requestsLink.classList.remove('hidden');
            if (adminLink) adminLink.classList.remove('hidden');
            
        } else if (currentUser.role_id === 2) { // Волонтер
            if (addAnimalLink) addAnimalLink.classList.remove('hidden');
            if (requestsLink) requestsLink.classList.remove('hidden');
            if (adminLink) adminLink.classList.add('hidden');
            
        } else if (currentUser.role_id === 1) { // Обычный пользователь
            if (requestsLink) requestsLink.classList.remove('hidden');
            if (addAnimalLink) addAnimalLink.classList.add('hidden');
            if (adminLink) adminLink.classList.add('hidden');
        }
    }
    
    // ========== ОБРАБОТЧИКИ СОБЫТИЙ ==========
    
    if (homeLink) {
        homeLink.addEventListener('click', (e) => {
            e.preventDefault();
            showSection('home');
            updateStats();
        });
    }
    
    if (animalsLink) {
        animalsLink.addEventListener('click', (e) => {
            e.preventDefault();
            showSection('animals');
            loadAnimals();
        });
    }
    
    if (addAnimalLink) {
        addAnimalLink.addEventListener('click', (e) => {
            e.preventDefault();
            showSection('add-animal');
        });
    }
    
    if (favoritesLink) {
        favoritesLink.addEventListener('click', (e) => {
            e.preventDefault();
            showFavorites();
        });
    }
    
    if (requestsLink) {
        requestsLink.addEventListener('click', (e) => {
            e.preventDefault();
            showUserApplications();
        });
    }
    
    if (adminLink) {
        adminLink.addEventListener('click', (e) => {
            e.preventDefault();
            showAdminPanel();
        });
    }
    
    if (loginBtn) {
        loginBtn.addEventListener('click', () => {
            showLoginModal();
        });
    }
    
    if (registerBtn) {
        registerBtn.addEventListener('click', () => {
            showRegisterTypeModal();
        });
    }
    
    if (logoutBtn) {
        logoutBtn.addEventListener('click', logout);
    }
    
    if (closeLoginBtn) {
        closeLoginBtn.addEventListener('click', () => {
            loginSection.classList.add('hidden');
        });
    }
    
    if (closeRegisterBtn) {
        closeRegisterBtn.addEventListener('click', () => {
            registerSection.classList.add('hidden');
            // Очищаем формы
            const userForm = document.getElementById('register-user-form');
            const volunteerForm = document.getElementById('register-volunteer-form');
            if (userForm) userForm.reset();
            if (volunteerForm) volunteerForm.reset();
        });
    }
    
    if (closeRegisterTypeBtn) {
        closeRegisterTypeBtn.addEventListener('click', () => {
            registerTypeSection.classList.add('hidden');
        });
    }
    
    // Выбор типа регистрации
    const registerAsUser = document.getElementById('register-as-user');
    const registerAsVolunteer = document.getElementById('register-as-volunteer');
    
    if (registerAsUser) {
        registerAsUser.addEventListener('click', () => {
            registerTypeSection.classList.add('hidden');
            showUserRegistrationForm();
        });
    }
    
    if (registerAsVolunteer) {
        registerAsVolunteer.addEventListener('click', () => {
            registerTypeSection.classList.add('hidden');
            showVolunteerRegistrationForm();
        });
    }
    
    // Форма входа
    if (loginForm) {
        loginForm.addEventListener('submit', async (e) => {
            e.preventDefault();
            
            const email = document.getElementById('login-email').value;
            const password = document.getElementById('login-password').value;
            
            if (!email || !password) {
                showNotification('Введите email и пароль', 'error');
                return;
            }
            
            try {
                let role_id = 1;
                if (email.includes('volunteer') || email.includes('волонтер')) {
                    role_id = 2;
                } else if (email.includes('admin')) {
                    role_id = 3;
                }
                
                const testUser = {
                    id: Date.now(),
                    full_name: email.split('@')[0],
                    email: email,
                    role_id: role_id,
                    phone: '+375291234567',
                    city: 'Минск',
                    created_at: new Date().toISOString()
                };
                
                // Сохраняем пользователя отдельно
                localStorage.setItem(`user_${testUser.id}`, JSON.stringify(testUser));
                localStorage.setItem('token', 'test-token-' + Date.now());
                localStorage.setItem('user', JSON.stringify(testUser));
                
                currentUser = testUser;
                await loadUserData();
                await loadAllUsersData();
                
                loginSection.classList.add('hidden');
                showNotification('Вход выполнен успешно!', 'success');
                loginForm.reset();
                
                // Обновляем интерфейс
                checkAuth();
                updateNavigation();
                updateUserMenu();
                
            } catch (error) {
                console.error('Ошибка входа:', error);
                showNotification('Ошибка входа', 'error');
            }
        });
    }
    
    // Форма регистрации пользователя
    const registerUserForm = document.getElementById('register-user-form');
    if (registerUserForm) {
        registerUserForm.addEventListener('submit', async (e) => {
            e.preventDefault();
            
            const fullName = document.getElementById('user-fullname').value;
            const email = document.getElementById('user-email').value;
            const password = document.getElementById('user-password').value;
            const confirmPassword = document.getElementById('user-confirm-password').value;
            const phone = document.getElementById('user-phone').value;
            const city = document.getElementById('user-city').value;
            
            // Валидация
            if (!fullName || !email || !password) {
                showNotification('Заполните обязательные поля', 'error');
                return;
            }
            
            if (password !== confirmPassword) {
                showNotification('Пароли не совпадают', 'error');
                return;
            }
            
            try {
                const testUser = {
                    id: Date.now(),
                    full_name: fullName,
                    email: email,
                    role_id: 1,
                    phone: phone,
                    city: city,
                    created_at: new Date().toISOString()
                };
                
                // Сохраняем пользователя отдельно
                localStorage.setItem(`user_${testUser.id}`, JSON.stringify(testUser));
                localStorage.setItem('token', 'test-token-' + Date.now());
                localStorage.setItem('user', JSON.stringify(testUser));
                
                currentUser = testUser;
                await loadUserData();
                await loadAllUsersData();
                
                registerSection.classList.add('hidden');
                showNotification('Регистрация успешна!', 'success');
                registerUserForm.reset();
                
                // Обновляем интерфейс
                checkAuth();
                updateNavigation();
                updateUserMenu();
                
            } catch (error) {
                console.error('Ошибка регистрации:', error);
                showNotification('Ошибка регистрации', 'error');
            }
        });
    }
    
    // Форма регистрации волонтера
    const registerVolunteerForm = document.getElementById('register-volunteer-form');
    if (registerVolunteerForm) {
        registerVolunteerForm.addEventListener('submit', async (e) => {
            e.preventDefault();
            
            const fullName = document.getElementById('volunteer-fullname').value;
            const email = document.getElementById('volunteer-email').value;
            const password = document.getElementById('volunteer-password').value;
            const confirmPassword = document.getElementById('volunteer-confirm-password').value;
            const phone = document.getElementById('volunteer-phone').value;
            const city = document.getElementById('volunteer-city').value;
            const organization = document.getElementById('volunteer-org').value;
            const experience = document.getElementById('volunteer-exp').value;
            
            if (!fullName || !email || !password) {
                showNotification('Заполните обязательные поля', 'error');
                return;
            }
            
            if (password !== confirmPassword) {
                showNotification('Пароли не совпадают', 'error');
                return;
            }
            
            try {
                const testUser = {
                    id: Date.now(),
                    full_name: fullName,
                    email: email,
                    role_id: 2,
                    phone: phone,
                    city: city,
                    organization: organization,
                    experience: experience,
                    created_at: new Date().toISOString()
                };
                
                // Сохраняем пользователя отдельно
                localStorage.setItem(`user_${testUser.id}`, JSON.stringify(testUser));
                localStorage.setItem('token', 'test-token-' + Date.now());
                localStorage.setItem('user', JSON.stringify(testUser));
                
                currentUser = testUser;
                await loadUserData();
                await loadAllUsersData();
                
                registerSection.classList.add('hidden');
                showNotification('Регистрация волонтера успешна!', 'success');
                registerVolunteerForm.reset();
                
                // Обновляем интерфейс
                checkAuth();
                updateNavigation();
                updateUserMenu();
                
            } catch (error) {
                console.error('Ошибка регистрации волонтера:', error);
                showNotification('Ошибка регистрации', 'error');
            }
        });
    }
    
    // Форма добавления животного
    if (addAnimalForm) {
        addAnimalForm.addEventListener('submit', async (e) => {
            e.preventDefault();
            
            // Разрешаем администраторам и волонтерам добавлять животных
            if (!currentUser || (currentUser.role_id !== 2 && currentUser.role_id !== 3)) {
                showNotification('Только волонтеры и администраторы могут добавлять животных', 'error');
                return;
            }
            
            const animalData = {
                name: document.getElementById('animal-name').value,
                type: document.getElementById('animal-type').value,
                breed: document.getElementById('animal-breed').value,
                age_months: parseInt(document.getElementById('animal-age').value) || null,
                gender: document.getElementById('animal-gender').value,
                status: 'searching',
                location_city: document.getElementById('animal-location').value,
                description: document.getElementById('animal-description').value,
                created_by: currentUser.id
            };
            
            if (!animalData.name || !animalData.type || !animalData.location_city) {
                showNotification('Заполните обязательные поля (имя, вид, город)', 'error');
                return;
            }
            
            try {
                const testAnimal = {
                    animal_id: Date.now(),
                    ...animalData,
                    created_at: new Date().toISOString(),
                    photo_url: null,
                    favorites_count: 0,
                    applications_count: 0
                };
                
                const savedAnimals = JSON.parse(localStorage.getItem('test_animals') || '[]');
                savedAnimals.push(testAnimal);
                localStorage.setItem('test_animals', JSON.stringify(savedAnimals));
                
                showNotification('Животное успешно добавлено!', 'success');
                addAnimalForm.reset();
                showSection('animals');
                await loadAnimals();
                
                await updateStats();
                updateUserMenu();
                
            } catch (error) {
                console.error('Ошибка добавления животного:', error);
                showNotification('Ошибка добавления животного', 'error');
            }
        });
    }
    
    // Фильтры животных
    const applyFiltersBtn = document.getElementById('apply-filters');
    const resetFiltersBtn = document.getElementById('reset-filters');
    
    if (applyFiltersBtn) {
        applyFiltersBtn.addEventListener('click', loadAnimals);
    }
    
    if (resetFiltersBtn) {
        resetFiltersBtn.addEventListener('click', () => {
            document.getElementById('type-filter').value = '';
            document.getElementById('gender-filter').value = '';
            document.getElementById('city-filter').value = '';
            document.getElementById('status-filter').value = '';
            loadAnimals();
        });
    }
    
    // ========== ФУНКЦИИ ДЛЯ ЖИВОТНЫХ ==========
    
    async function loadAnimals() {
        if (!animalsList) return;
        
        try {
            animalsList.innerHTML = '<div class="loading">Загрузка животных...</div>';
            
            const typeFilter = document.getElementById('type-filter')?.value || '';
            const genderFilter = document.getElementById('gender-filter')?.value || '';
            const cityFilter = document.getElementById('city-filter')?.value || '';
            const statusFilter = document.getElementById('status-filter')?.value || '';
            
            let animals = [];
            
            // Загружаем данные из localStorage
            const savedAnimals = JSON.parse(localStorage.getItem('test_animals') || '[]');
            
            if (savedAnimals.length === 0) {
                // Если нет животных, показываем пустой список
                animals = [];
            } else {
                animals = savedAnimals;
            }
            
            // Применяем фильтры
            animals = animals.filter(animal => {
                if (typeFilter && animal.type !== typeFilter) return false;
                if (genderFilter && animal.gender !== genderFilter) return false;
                if (cityFilter && !animal.location_city?.toLowerCase().includes(cityFilter.toLowerCase())) return false;
                if (statusFilter && animal.status !== statusFilter) return false;
                return true;
            });
            
            // Сохраняем данные животных
            animalsData = animals;
            
            if (animals.length > 0) {
                displayAnimals(animals);
            } else {
                animalsList.innerHTML = '<div class="no-data">Животные не найдены по выбранным фильтрам</div>';
            }
            
        } catch (error) {
            console.error('Ошибка загрузки животных:', error);
            animalsList.innerHTML = `
                <div class="error">
                    <h3>Ошибка загрузки</h3>
                    <p>${error.message}</p>
                    <button onclick="location.reload()" class="btn btn-primary">Обновить страницу</button>
                </div>
            `;
        }
    }
    
    
    function displayAnimals(animals) {
        if (!animalsList) return;
        
        animalsList.innerHTML = '';
        
        animals.forEach(animal => {
            const card = createAnimalCard(animal);
            animalsList.appendChild(card);
        });
    }
    
    function createAnimalCard(animal) {
        const card = document.createElement('div');
        card.className = 'animal-card';
        const animalId = animal.animal_id || animal.id;
        card.dataset.id = animalId;
        
        // Проверяем, в избранном ли животное
        const isFavorite = currentUser ? 
            userFavorites.some(fav => fav.animal_id === animalId) : false;
        const heartIcon = isFavorite ? 'fas fa-heart' : 'far fa-heart';
        
        // Если пользователь не авторизован, делаем кнопку неактивной
        const favoriteBtnClass = currentUser ? 
            (isFavorite ? 'btn btn-outline favorite-btn active' : 'btn btn-outline favorite-btn') :
            'btn btn-outline favorite-btn disabled';
        
        let statusBadge = '';
        if (animal.status) {
            let statusClass = 'status-';
            let statusText = '';
            
            switch(animal.status) {
                case 'searching':
                    statusClass += 'searching';
                    statusText = 'Ищет дом';
                    break;
                case 'reserved':
                    statusClass += 'reserved';
                    statusText = 'Забронирован';
                    break;
                case 'adopted':
                    statusClass += 'adopted';
                    statusText = 'Пристроен';
                    break;
                default:
                    statusClass += 'unknown';
                    statusText = animal.status;
            }
            
            statusBadge = `<span class="status-badge ${statusClass}">${statusText}</span>`;
        }
        
        let imageHTML = '';
        if (animal.photo_url) {
            imageHTML = `<img src="${animal.photo_url}" alt="${animal.name}" class="animal-photo">`;
        } else {
            const icon = animal.type === 'cat' ? 'fa-cat' : animal.type === 'dog' ? 'fa-dog' : 'fa-paw';
            imageHTML = `<div class="animal-icon"><i class="fas ${icon}"></i></div>`;
        }
        
        // Определяем, что показывать в зависимости от роли пользователя
        let actionButton = '';
        let adminActions = '';
        
        if (currentUser) {
            if (currentUser.role_id === 3) { // Администратор
                // Администратор видит кнопки редактирования и удаления
                adminActions = `
                    <button class="btn btn-warning btn-sm edit-animal" data-id="${animalId}" title="Редактировать">
                        <i class="fas fa-edit"></i>
                    </button>
                    <button class="btn btn-danger btn-sm delete-animal" data-id="${animalId}" title="Удалить">
                        <i class="fas fa-trash"></i>
                    </button>
                `;
                
                actionButton = `
                    <button class="btn btn-primary view-details">
                        <i class="fas fa-info-circle"></i> Подробнее
                    </button>
                `;
                
            } else if (currentUser.role_id === 2) { // Волонтер
                // Волонтер видит кнопку "Подробнее" и избранное
                actionButton = `
                    <button class="btn btn-primary view-details">
                        <i class="fas fa-info-circle"></i> Подробнее
                    </button>
                `;
            } else { // Обычный пользователь
                // Только если животное ищет дом
                if (animal.status === 'searching') {
                    actionButton = `
                        <button class="btn btn-primary adopt-btn" data-id="${animalId}">
                            <i class="fas fa-home"></i> Подать заявку
                        </button>
                    `;
                } else {
                    actionButton = `
                        <button class="btn btn-primary view-details">
                            <i class="fas fa-info-circle"></i> Подробнее
                        </button>
                    `;
                }
            }
        } else {
            // Неавторизованный пользователь
            actionButton = `
                <button class="btn btn-primary view-details">
                    <i class="fas fa-info-circle"></i> Подробнее
                </button>
            `;
        }
        
        card.innerHTML = `
            ${statusBadge}
            <div class="animal-image">
                ${imageHTML}
            </div>
            <div class="animal-info">
                <h3>${animal.name || 'Без имени'}</h3>
                <div class="animal-type">${animal.type === 'cat' ? 'Кошка' : animal.type === 'dog' ? 'Собака' : 'Другое'}${animal.breed ? `, ${animal.breed}` : ''}</div>
                <div class="animal-meta">
                    <span><i class="fas ${animal.gender === 'female' ? 'fa-venus' : 'fa-mars'}"></i> ${animal.gender === 'female' ? 'Женский' : 'Мужской'}</span>
                    <span><i class="fas fa-map-marker-alt"></i> ${animal.location_city || 'Не указан'}</span>
                    <span><i class="fas fa-birthday-cake"></i> ${animal.age_months || '?'} мес.</span>
                </div>
                <p class="animal-description">${animal.description || 'Нет описания'}</p>
                <div class="animal-stats">
                    <span class="stat"><i class="fas fa-heart"></i> ${animal.favorites_count || 0}</span>
                    <span class="stat"><i class="fas fa-home"></i> ${animal.applications_count || 0}</span>
                </div>
                <div class="animal-actions">
                    ${actionButton}
                    <div class="action-buttons">
                        ${adminActions}
                        <button class="${favoriteBtnClass}" title="${currentUser ? 'Добавить в избранное' : 'Войдите для добавления в избранное'}" ${!currentUser ? 'disabled' : ''}>
                            <i class="${heartIcon}"></i>
                        </button>
                    </div>
                </div>
            </div>
        `;
        
        // Обработчик для кнопки "Подробнее"
        const viewDetailsBtn = card.querySelector('.view-details');
        if (viewDetailsBtn) {
            viewDetailsBtn.addEventListener('click', () => {
                showAnimalDetails(animal);
            });
        }
        
        // Обработчик для кнопки "Подать заявку" (только для обычных пользователей)
        const adoptBtn = card.querySelector('.adopt-btn');
        if (adoptBtn) {
            adoptBtn.addEventListener('click', function() {
                const animalId = parseInt(this.dataset.id);
                console.log('Подача заявки на животное ID:', animalId);
                
                if (!currentUser) {
                    showNotification('Для подачи заявки необходимо войти в систему', 'error');
                    showLoginModal();
                    return;
                }
                
                if (currentUser.role_id === 2 || currentUser.role_id === 3) {
                    showNotification('Волонтеры и администраторы не могут подавать заявки на пристройство', 'error');
                    return;
                }
                
                showApplicationForm(animalId);
            });
        }
        
        // Обработчик кнопки "Избранное" - ТЕПЕРЬ РАБОТАЕТ ДЛЯ ВСЕХ АВТОРИЗОВАННЫХ ПОЛЬЗОВАТЕЛЕЙ
        const favoriteBtn = card.querySelector('.favorite-btn');
        if (favoriteBtn && currentUser) {
            favoriteBtn.addEventListener('click', function() {
                handleFavoriteClick(this, animalId);
            });
        } else if (favoriteBtn && !currentUser) {
            favoriteBtn.addEventListener('click', function() {
                showNotification('Для добавления в избранное необходимо войти в систему', 'error');
                showLoginModal();
            });
        }
        
        // Обработчик кнопки "Редактировать" (для администратора)
        const editBtn = card.querySelector('.edit-animal');
        if (editBtn && currentUser && currentUser.role_id === 3) {
            editBtn.addEventListener('click', function() {
                const animalId = parseInt(this.dataset.id);
                showEditAnimalForm(animalId);
            });
        }
        
        // Обработчик кнопки "Удалить" (для администратора)
        const deleteBtn = card.querySelector('.delete-animal');
        if (deleteBtn && currentUser && currentUser.role_id === 3) {
            deleteBtn.addEventListener('click', function() {
                const animalId = parseInt(this.dataset.id);
                deleteAnimal(animalId);
            });
        }
        
        return card;
    }
    
    async function showAnimalDetails(animal) {
        const animalId = animal.animal_id || animal.id;
        const isFavorite = currentUser ? 
            userFavorites.some(fav => fav.animal_id === animalId) : false;
        
        // Определяем, что показывать в зависимости от роли пользователя
        let actionButtons = '';
        let adminActions = '';
        
        if (currentUser) {
            if (currentUser.role_id === 3) { // Администратор
                adminActions = `
                    <div class="admin-actions">
                        <button class="btn btn-warning" id="edit-animal-details">
                            <i class="fas fa-edit"></i> Редактировать
                        </button>
                        <button class="btn btn-danger" id="delete-animal-details">
                            <i class="fas fa-trash"></i> Удалить
                        </button>
                    </div>
                `;
                
                actionButtons = `
                    <button class="btn ${isFavorite ? 'btn-danger' : 'btn-outline'}" id="favorite-detail-btn">
                        <i class="${isFavorite ? 'fas' : 'far'} fa-heart"></i> ${isFavorite ? 'В избранном' : 'В избранное'}
                    </button>
                `;
                
            } else if (currentUser.role_id === 2) { // Волонтер
                // Волонтер ТЕПЕРЬ МОЖЕТ добавлять в избранное
                actionButtons = `
                    <button class="btn ${isFavorite ? 'btn-danger' : 'btn-outline'}" id="favorite-detail-btn">
                        <i class="${isFavorite ? 'fas' : 'far'} fa-heart"></i> ${isFavorite ? 'В избранном' : 'В избранное'}
                    </button>
                `;
            } else { // Обычный пользователь
                // Только если животное ищет дом
                if (animal.status === 'searching') {
                    actionButtons = `
                        <button class="btn btn-primary adopt-btn" id="adopt-btn">
                            <i class="fas fa-home"></i> Подать заявку на пристройство
                        </button>
                        <button class="btn ${isFavorite ? 'btn-danger' : 'btn-outline'}" id="favorite-detail-btn">
                            <i class="${isFavorite ? 'fas' : 'far'} fa-heart"></i> ${isFavorite ? 'В избранном' : 'В избранное'}
                        </button>
                    `;
                } else {
                    actionButtons = `
                        <p class="status-info">Это животное ${animal.status === 'reserved' ? 'уже забронировано' : 'уже пристроено'}</p>
                        <button class="btn ${isFavorite ? 'btn-danger' : 'btn-outline'}" id="favorite-detail-btn">
                            <i class="${isFavorite ? 'fas' : 'far'} fa-heart"></i> ${isFavorite ? 'В избранном' : 'В избранное'}
                        </button>
                    `;
                }
            }
        } else {
            // Неавторизованный пользователь
            actionButtons = `
                <button class="btn ${isFavorite ? 'btn-danger' : 'btn-outline'}" id="favorite-detail-btn" disabled>
                    <i class="${isFavorite ? 'fas' : 'far'} fa-heart"></i> ${isFavorite ? 'В избранном' : 'В избранное'}
                </button>
            `;
        }
        
        animalDetailsSection.innerHTML = `
            <div class="animal-details">
                <button class="btn btn-outline back-btn" id="back-to-animals">
                    <i class="fas fa-arrow-left"></i> Назад к списку
                </button>
                
                <div class="details-header">
                    <h2>${animal.name || 'Без имени'}</h2>
                    <span class="status-badge status-${animal.status}">${animal.status === 'searching' ? 'Ищет дом' : animal.status === 'reserved' ? 'Забронирован' : 'Пристроен'}</span>
                </div>
                
                ${adminActions}
                
                <div class="details-content">
                    <div class="details-image">
                        ${animal.photo_url ? `<img src="${animal.photo_url}" alt="${animal.name}" class="animal-detail-photo">` : 
                          `<i class="fas ${animal.type === 'cat' ? 'fa-cat' : animal.type === 'dog' ? 'fa-dog' : 'fa-paw'} fa-10x"></i>`}
                    </div>
                    
                    <div class="details-info">
                        <div class="info-grid">
                            <div class="info-item">
                                <strong><i class="fas fa-paw"></i> Вид:</strong>
                                <span>${animal.type === 'cat' ? 'Кошка' : animal.type === 'dog' ? 'Собака' : 'Другое'}</span>
                            </div>
                            <div class="info-item">
                                <strong><i class="fas fa-dna"></i> Порода:</strong>
                                <span>${animal.breed || 'Не указана'}</span>
                            </div>
                            <div class="info-item">
                                <strong><i class="fas fa-birthday-cake"></i> Возраст:</strong>
                                <span>${animal.age_months ? animal.age_months + ' месяцев' : 'Не указан'}</span>
                            </div>
                            <div class="info-item">
                                <strong><i class="fas fa-venus-mars"></i> Пол:</strong>
                                <span>${animal.gender === 'female' ? 'Женский' : 'Мужской'}</span>
                            </div>
                            <div class="info-item">
                                <strong><i class="fas fa-map-marker-alt"></i> Город:</strong>
                                <span>${animal.location_city || 'Не указан'}</span>
                            </div>
                            <div class="info-item">
                                <strong><i class="fas fa-user"></i> Добавил:</strong>
                                <span>${getUserNameById(animal.created_by)}</span>
                            </div>
                            <div class="info-item">
                                <strong><i class="fas fa-calendar-alt"></i> Добавлен:</strong>
                                <span>${new Date(animal.created_at).toLocaleDateString('ru-RU')}</span>
                            </div>
                        </div>
                        
                        <div class="description-box">
                            <h3><i class="fas fa-align-left"></i> Описание</h3>
                            <p>${animal.description || 'Нет описания'}</p>
                        </div>
                        
                        <div class="animal-stats-detail">
                            <div class="stat-item">
                                <i class="fas fa-heart"></i>
                                <span>${animal.favorites_count || 0} в избранном</span>
                            </div>
                            <div class="stat-item">
                                <i class="fas fa-home"></i>
                                <span>${animal.applications_count || 0} заявок</span>
                            </div>
                        </div>
                        
                        <div class="actions-box">
                            ${actionButtons}
                        </div>
                    </div>
                </div>
            </div>
        `;
        
        document.getElementById('back-to-animals').addEventListener('click', () => {
            showSection('animals');
        });
        
        // Обработчик кнопки "Подать заявку" (только для обычных пользователей)
        const adoptBtn = document.getElementById('adopt-btn');
        if (adoptBtn) {
            adoptBtn.addEventListener('click', () => {
                if (!currentUser) {
                    showNotification('Для подачи заявки необходимо войти в систему', 'error');
                    showLoginModal();
                    return;
                }
                
                if (currentUser.role_id === 2 || currentUser.role_id === 3) {
                    showNotification('Волонтеры и администраторы не могут подавать заявки на пристройство', 'error');
                    return;
                }
                
                showApplicationForm(animalId);
            });
        }
        
        // Обработчик кнопки "Избранное" - ТЕПЕРЬ РАБОТАЕТ ДЛЯ ВСЕХ АВТОРИЗОВАННЫХ ПОЛЬЗОВАТЕЛЕЙ
        const favoriteDetailBtn = document.getElementById('favorite-detail-btn');
        if (favoriteDetailBtn && currentUser) {
            favoriteDetailBtn.addEventListener('click', () => {
                handleFavoriteClick({ querySelector: () => favoriteDetailBtn.querySelector('i') }, animalId);
                
                const newIsFavorite = !userFavorites.some(fav => fav.animal_id === animalId);
                const icon = favoriteDetailBtn.querySelector('i');
                icon.className = newIsFavorite ? 'fas fa-heart' : 'far fa-heart';
                favoriteDetailBtn.textContent = newIsFavorite ? 'В избранном' : 'В избранное';
                favoriteDetailBtn.className = `btn ${newIsFavorite ? 'btn-danger' : 'btn-outline'}`;
            });
        } else if (favoriteDetailBtn && !currentUser) {
            favoriteDetailBtn.addEventListener('click', () => {
                showNotification('Для добавления в избранное необходимо войти в систему', 'error');
                showLoginModal();
            });
        }
        
        // Обработчик кнопки "Редактировать" (для администратора)
        const editAnimalBtn = document.getElementById('edit-animal-details');
        if (editAnimalBtn && currentUser && currentUser.role_id === 3) {
            editAnimalBtn.addEventListener('click', () => {
                showEditAnimalForm(animalId);
            });
        }
        
        // Обработчик кнопки "Удалить" (для администратора)
        const deleteAnimalBtn = document.getElementById('delete-animal-details');
        if (deleteAnimalBtn && currentUser && currentUser.role_id === 3) {
            deleteAnimalBtn.addEventListener('click', () => {
                deleteAnimal(animalId);
            });
        }
        
        showSection('animal-details');
    }
    
    function getUserNameById(userId) {
        const user = allUsersData.find(u => u.id === userId);
        return user ? user.full_name || user.email : `Пользователь #${userId}`;
    }
    
    // ========== АДМИНИСТРАТИВНЫЕ ФУНКЦИИ ==========
    
    async function showAdminPanel() {
        if (!currentUser || currentUser.role_id !== 3) {
            showNotification('Только администратор может просматривать эту страницу', 'error');
            return;
        }
        
        // Загружаем актуальные данные
        await loadAllUsersData();
        await loadAnimals();
        
        // Статистика
        const totalAnimals = animalsData.length;
        const searchingAnimals = animalsData.filter(a => a.status === 'searching').length;
        const adoptedAnimals = animalsData.filter(a => a.status === 'adopted').length;
        const totalUsers = allUsersData.length;
        const regularUsers = allUsersData.filter(u => u.role_id === 1).length;
        const volunteers = allUsersData.filter(u => u.role_id === 2).length;
        const admins = allUsersData.filter(u => u.role_id === 3).length;
        
        // Формируем панель администратора
        adminSection.innerHTML = `
            <div class="admin-panel">
                <h2><i class="fas fa-cogs"></i> Панель администратора</h2>
                
                <div class="admin-stats-grid">
                    <div class="stat-card">
                        <div class="stat-icon" style="background: #4CAF50;">
                            <i class="fas fa-users"></i>
                        </div>
                        <div class="stat-info">
                            <h3>${totalUsers}</h3>
                            <p>Всего пользователей</p>
                        </div>
                    </div>
                    
                    <div class="stat-card">
                        <div class="stat-icon" style="background: #2196F3;">
                            <i class="fas fa-paw"></i>
                        </div>
                        <div class="stat-info">
                            <h3>${totalAnimals}</h3>
                            <p>Всего животных</p>
                        </div>
                    </div>
                    
                    <div class="stat-card">
                        <div class="stat-icon" style="background: #FF9800;">
                            <i class="fas fa-home"></i>
                        </div>
                        <div class="stat-info">
                            <h3>${adoptedAnimals}</h3>
                            <p>Пристроено животных</p>
                        </div>
                    </div>
                    
                    <div class="stat-card">
                        <div class="stat-icon" style="background: #9C27B0;">
                            <i class="fas fa-search"></i>
                        </div>
                        <div class="stat-info">
                            <h3>${searchingAnimals}</h3>
                            <p>Ищут дом</p>
                        </div>
                    </div>
                </div>
                
                <div class="admin-tabs">
                    <div class="tab-buttons">
                        <button class="tab-btn active" data-tab="users">Пользователи</button>
                        <button class="tab-btn" data-tab="animals">Животные</button>
                        <button class="tab-btn" data-tab="system">Система</button>
                    </div>
                    
                    <div class="tab-content">
                        <div id="users-tab" class="tab-pane active">
                            <h3><i class="fas fa-users"></i> Управление пользователями</h3>
                            <div class="users-list" id="admin-users-list">
                                ${renderUsersList()}
                            </div>
                        </div>
                        
                        <div id="animals-tab" class="tab-pane">
                            <h3><i class="fas fa-paw"></i> Управление животными</h3>
                            <div class="animals-controls">
                                <button class="btn btn-primary" id="add-animal-admin">
                                    <i class="fas fa-plus"></i> Добавить животное
                                </button>
                                <button class="btn btn-warning" id="clear-animals">
                                    <i class="fas fa-trash"></i> Очистить данные
                                </button>
                            </div>
                            <div class="animals-stats">
                                <div class="stats-summary">
                                    <span>Обычных пользователей: <strong>${regularUsers}</strong></span>
                                    <span>Волонтеров: <strong>${volunteers}</strong></span>
                                    <span>Администраторов: <strong>${admins}</strong></span>
                                </div>
                            </div>
                        </div>
                        
                        <div id="system-tab" class="tab-pane">
                            <h3><i class="fas fa-cog"></i> Системные настройки</h3>
                            <div class="system-actions">
                                <button class="btn btn-danger" id="clear-all-data">
                                    <i class="fas fa-broom"></i> Очистить ВСЕ данные
                                </button>
                                <button class="btn btn-info" id="export-data">
                                    <i class="fas fa-download"></i> Экспорт данных
                                </button>
                                <button class="btn btn-success" id="generate-test-data">
                                    <i class="fas fa-database"></i> Сгенерировать тестовые данные
                                </button>
                            </div>
                            <div class="system-info">
                                <h4>Информация о системе:</h4>
                                <p><strong>Всего записей в localStorage:</strong> ${localStorage.length}</p>
                                <p><strong>Животные:</strong> ${animalsData.length}</p>
                                <p><strong>Зарегистрированные пользователи:</strong> ${allUsersData.length}</p>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        `;
        
        // Добавляем обработчики для табов
        document.querySelectorAll('.tab-btn').forEach(btn => {
            btn.addEventListener('click', function() {
                const tabId = this.dataset.tab;
                
                // Убираем активный класс у всех кнопок и панелей
                document.querySelectorAll('.tab-btn').forEach(b => b.classList.remove('active'));
                document.querySelectorAll('.tab-pane').forEach(p => p.classList.remove('active'));
                
                // Добавляем активный класс текущей кнопке и панели
                this.classList.add('active');
                document.getElementById(`${tabId}-tab`).classList.add('active');
            });
        });
        
        // Обработчики для кнопок администратора
        document.getElementById('add-animal-admin')?.addEventListener('click', () => {
            showSection('add-animal');
        });
        
        document.getElementById('clear-animals')?.addEventListener('click', () => {
            clearTestAnimals();
        });
        
        document.getElementById('clear-all-data')?.addEventListener('click', () => {
            clearAllData();
        });
        
        document.getElementById('export-data')?.addEventListener('click', () => {
            exportData();
        });
        
        document.getElementById('generate-test-data')?.addEventListener('click', () => {
            generateTestData();
        });
        
        showSection('admin');
    }
    
    function renderUsersList() {
        if (allUsersData.length === 0) {
            return '<p class="no-data">Нет данных о пользователях</p>';
        }
        
        let html = `
            <div class="users-table">
                <table>
                    <thead>
                        <tr>
                            <th>ID</th>
                            <th>Имя</th>
                            <th>Email</th>
                            <th>Роль</th>
                            <th>Город</th>
                            <th>Дата регистрации</th>
                        </tr>
                    </thead>
                    <tbody>
        `;
        
        allUsersData.forEach(user => {
            let roleText = '';
            let roleClass = '';
            
            switch(user.role_id) {
                case 1:
                    roleText = 'Пользователь';
                    roleClass = 'badge-user';
                    break;
                case 2:
                    roleText = 'Волонтер';
                    roleClass = 'badge-volunteer';
                    break;
                case 3:
                    roleText = 'Администратор';
                    roleClass = 'badge-admin';
                    break;
            }
            
            const isCurrentUser = currentUser && user.id === currentUser.id;
            
            html += `
                <tr ${isCurrentUser ? 'class="current-user"' : ''}>
                    <td>${user.id}</td>
                    <td>${user.full_name || 'Не указано'}</td>
                    <td>${user.email}</td>
                    <td><span class="role-badge ${roleClass}">${roleText}</span></td>
                    <td>${user.city || 'Не указан'}</td>
                    <td>${new Date(user.created_at).toLocaleDateString('ru-RU')}</td>
                </tr>
            `;
        });
        
        html += `
                    </tbody>
                </table>
            </div>
        `;
        
        return html;
    }
    
    async function deleteAnimal(animalId) {
        if (!currentUser || currentUser.role_id !== 3) {
            showNotification('Только администратор может удалять животных', 'error');
            return;
        }
        
        if (!confirm('Вы уверены, что хотите удалить это животное? Это действие нельзя отменить.')) {
            return;
        }
        
        try {
            // Загружаем текущих животных
            const savedAnimals = JSON.parse(localStorage.getItem('test_animals') || '[]');
            
            // Удаляем животное
            const updatedAnimals = savedAnimals.filter(animal => 
                animal.animal_id !== animalId && animal.id !== animalId
            );
            
            // Сохраняем обновленный список
            localStorage.setItem('test_animals', JSON.stringify(updatedAnimals));
            
            // Обновляем данные
            animalsData = updatedAnimals;
            
            showNotification('Животное успешно удалено', 'success');
            
            // Возвращаемся к списку животных
            showSection('animals');
            await loadAnimals();
            await updateStats();
            updateUserMenu();
            
        } catch (error) {
            console.error('Ошибка удаления животного:', error);
            showNotification('Ошибка удаления животного', 'error');
        }
    }
    
    function showEditAnimalForm(animalId) {
        if (!currentUser || currentUser.role_id !== 3) {
            showNotification('Только администратор может редактировать животных', 'error');
            return;
        }
        
        const animal = animalsData.find(a => a.animal_id === animalId);
        if (!animal) {
            showNotification('Животное не найдено', 'error');
            return;
        }
        
        const formHTML = `
            <div class="modal" id="edit-animal-modal">
                <div class="modal-content">
                    <h2>Редактирование животного: ${animal.name}</h2>
                    <form id="edit-animal-form">
                        <div class="form-group">
                            <label for="edit-animal-name">Имя *</label>
                            <input type="text" id="edit-animal-name" value="${animal.name || ''}" required>
                        </div>
                        <div class="form-group">
                            <label for="edit-animal-type">Вид *</label>
                            <select id="edit-animal-type" required>
                                <option value="cat" ${animal.type === 'cat' ? 'selected' : ''}>Кошка</option>
                                <option value="dog" ${animal.type === 'dog' ? 'selected' : ''}>Собака</option>
                                <option value="other" ${!['cat', 'dog'].includes(animal.type) ? 'selected' : ''}>Другое</option>
                            </select>
                        </div>
                        <div class="form-group">
                            <label for="edit-animal-breed">Порода</label>
                            <input type="text" id="edit-animal-breed" value="${animal.breed || ''}">
                        </div>
                        <div class="form-group">
                            <label for="edit-animal-age">Возраст (месяцев)</label>
                            <input type="number" id="edit-animal-age" value="${animal.age_months || ''}" min="0">
                        </div>
                        <div class="form-group">
                            <label for="edit-animal-gender">Пол</label>
                            <select id="edit-animal-gender">
                                <option value="male" ${animal.gender === 'male' ? 'selected' : ''}>Мужской</option>
                                <option value="female" ${animal.gender === 'female' ? 'selected' : ''}>Женский</option>
                            </select>
                        </div>
                        <div class="form-group">
                            <label for="edit-animal-status">Статус *</label>
                            <select id="edit-animal-status" required>
                                <option value="searching" ${animal.status === 'searching' ? 'selected' : ''}>Ищет дом</option>
                                <option value="reserved" ${animal.status === 'reserved' ? 'selected' : ''}>Забронирован</option>
                                <option value="adopted" ${animal.status === 'adopted' ? 'selected' : ''}>Пристроен</option>
                            </select>
                        </div>
                        <div class="form-group">
                            <label for="edit-animal-location">Город *</label>
                            <input type="text" id="edit-animal-location" value="${animal.location_city || ''}" required>
                        </div>
                        <div class="form-group">
                            <label for="edit-animal-description">Описание</label>
                            <textarea id="edit-animal-description" rows="3">${animal.description || ''}</textarea>
                        </div>
                        <div class="form-actions">
                            <button type="submit" class="btn btn-primary">Сохранить изменения</button>
                            <button type="button" class="btn btn-outline" id="cancel-edit">Отмена</button>
                        </div>
                    </form>
                </div>
            </div>
        `;
        
        const modalContainer = document.createElement('div');
        modalContainer.innerHTML = formHTML;
        document.body.appendChild(modalContainer);
        
        modalContainer.classList.remove('hidden');
        
        document.getElementById('edit-animal-form').addEventListener('submit', async (e) => {
            e.preventDefault();
            
            const updatedAnimal = {
                ...animal,
                name: document.getElementById('edit-animal-name').value,
                type: document.getElementById('edit-animal-type').value,
                breed: document.getElementById('edit-animal-breed').value,
                age_months: parseInt(document.getElementById('edit-animal-age').value) || null,
                gender: document.getElementById('edit-animal-gender').value,
                status: document.getElementById('edit-animal-status').value,
                location_city: document.getElementById('edit-animal-location').value,
                description: document.getElementById('edit-animal-description').value,
                updated_at: new Date().toISOString()
            };
            
            try {
                const savedAnimals = JSON.parse(localStorage.getItem('test_animals') || '[]');
                const animalIndex = savedAnimals.findIndex(a => a.animal_id === animalId);
                
                if (animalIndex !== -1) {
                    savedAnimals[animalIndex] = updatedAnimal;
                    localStorage.setItem('test_animals', JSON.stringify(savedAnimals));
                    
                    // Обновляем данные
                    animalsData[animalIndex] = updatedAnimal;
                    
                    document.body.removeChild(modalContainer);
                    showNotification('Информация о животном обновлена', 'success');
                    
                    // Обновляем отображение
                    if (animalDetailsSection.classList.contains('active')) {
                        showAnimalDetails(updatedAnimal);
                    } else {
                        loadAnimals();
                    }
                    
                    updateStats();
                    updateUserMenu();
                }
                
            } catch (error) {
                console.error('Ошибка обновления животного:', error);
                showNotification('Ошибка обновления животного', 'error');
            }
        });
        
        document.getElementById('cancel-edit').addEventListener('click', () => {
            document.body.removeChild(modalContainer);
        });
    }
    
    async function clearTestAnimals() {
        if (!currentUser || currentUser.role_id !== 3) {
            showNotification('Только администратор может очищать данные', 'error');
            return;
        }
        
        if (!confirm('Вы уверены, что хотите удалить ВСЕХ животных? Это действие нельзя отменить.')) {
            return;
        }
        
        try {
            localStorage.removeItem('test_animals');
            
            // Очищаем избранное у всех пользователей
            for (let i = 0; i < localStorage.length; i++) {
                const key = localStorage.key(i);
                if (key.includes('user_favorites_')) {
                    localStorage.removeItem(key);
                }
            }
            
            animalsData = [];
            userFavorites = [];
            
            showNotification('Информация удалена', 'success');
            
            // Обновляем интерфейс
            await loadAnimals();
            await updateStats();
            updateUserMenu();
            
        } catch (error) {
            console.error('Ошибка очистки данных:', error);
            showNotification('Ошибка очистки данных', 'error');
        }
    }
    
    async function clearAllData() {
        if (!currentUser || currentUser.role_id !== 3) {
            showNotification('Только администратор может очищать данные', 'error');
            return;
        }
        
        if (!confirm('ВНИМАНИЕ! Это удалит ВСЕ данные приложения: пользователей, животных, заявки. Продолжить?')) {
            return;
        }
        
        try {
            // Очищаем localStorage, кроме текущей сессии
            const currentToken = localStorage.getItem('token');
            const currentUserData = localStorage.getItem('user');
            
            localStorage.clear();
            
            // Восстанавливаем текущую сессию
            if (currentToken) localStorage.setItem('token', currentToken);
            if (currentUserData) {
                localStorage.setItem('user', currentUserData);
                currentUser = JSON.parse(currentUserData);
            }
            
            // Сбрасываем переменные
            animalsData = [];
            userFavorites = [];
            userApplications = [];
            allUsersData = [currentUser];
            
            showNotification('Все данные очищены', 'success');
            
            // Обновляем интерфейс
            await loadAnimals();
            await updateStats();
            updateUserMenu();
            
            if (adminSection.classList.contains('active')) {
                showAdminPanel();
            }
            
        } catch (error) {
            console.error('Ошибка очистки данных:', error);
            showNotification('Ошибка очистки данных', 'error');
        }
    }
    
    function exportData() {
        if (!currentUser || currentUser.role_id !== 3) {
            showNotification('Только администратор может экспортировать данные', 'error');
            return;
        }
        
        try {
            const dataToExport = {
                exported_at: new Date().toISOString(),
                animals: animalsData,
                users: allUsersData,
                current_user: currentUser,
                statistics: {
                    total_animals: animalsData.length,
                    total_users: allUsersData.length,
                    adopted_animals: animalsData.filter(a => a.status === 'adopted').length
                }
            };
            
            const dataStr = JSON.stringify(dataToExport, null, 2);
            const dataUri = 'data:application/json;charset=utf-8,'+ encodeURIComponent(dataStr);
            
            const exportFileDefaultName = `animal_adoption_export_${new Date().toISOString().split('T')[0]}.json`;
            
            const linkElement = document.createElement('a');
            linkElement.setAttribute('href', dataUri);
            linkElement.setAttribute('download', exportFileDefaultName);
            linkElement.click();
            
            showNotification('Данные экспортированы', 'success');
            
        } catch (error) {
            console.error('Ошибка экспорта данных:', error);
            showNotification('Ошибка экспорта данных', 'error');
        }
    }
    
    function generateTestData() {
        if (!currentUser || currentUser.role_id !== 3) {
            showNotification('Только администратор может генерировать данные', 'error');
            return;
        }
        
        try {
            // Генерируем пользователей
            const testUsers = [
                {
                    id: Date.now() + 1,
                    full_name: 'Тестовый Пользователь 1',
                    email: 'testuser1@example.com',
                    role_id: 1,
                    phone: '+375291111111',
                    city: 'Минск',
                    created_at: new Date().toISOString()
                },
                {
                    id: Date.now() + 2,
                    full_name: 'Тестовый Волонтер 1',
                    email: 'testvolunteer1@example.com',
                    role_id: 2,
                    phone: '+375292222222',
                    city: 'Гродно',
                    organization: 'Тестовый приют',
                    experience: '1 год',
                    created_at: new Date().toISOString()
                }
            ];
            
            // Генерируем животных
            const testAnimals = [
                {
                    animal_id: Date.now() + 100,
                    name: 'Тестовый Кот',
                    type: 'cat',
                    breed: 'Тестовая порода',
                    age_months: 6,
                    gender: 'male',
                    status: 'searching',
                    location_city: 'Минск',
                    description: 'Тестовый кот для проверки системы',
                    created_at: new Date().toISOString(),
                    photo_url: null,
                    favorites_count: 0,
                    applications_count: 0,
                    created_by: testUsers[1].id
                },
                {
                    animal_id: Date.now() + 101,
                    name: 'Тестовая Собака',
                    type: 'dog',
                    breed: 'Тестовая собачья порода',
                    age_months: 12,
                    gender: 'female',
                    status: 'searching',
                    location_city: 'Витебск',
                    description: 'Тестовая собака для проверки системы',
                    created_at: new Date().toISOString(),
                    photo_url: null,
                    favorites_count: 0,
                    applications_count: 0,
                    created_by: testUsers[1].id
                }
            ];
            
            // Сохраняем пользователей
            testUsers.forEach(user => {
                localStorage.setItem(`user_${user.id}`, JSON.stringify(user));
                allUsersData.push(user);
            });
            
            // Сохраняем тестовых животных
            const savedAnimals = JSON.parse(localStorage.getItem('test_animals') || '[]');
            testAnimals.forEach(animal => {
                savedAnimals.push(animal);
                animalsData.push(animal);
            });
            localStorage.setItem('test_animals', JSON.stringify(savedAnimals));
            
            showNotification('Тестовые данные созданы', 'success');
            
            // Обновляем интерфейс
            loadAnimals();
            updateStats();
            updateUserMenu();
            
            if (adminSection.classList.contains('active')) {
                showAdminPanel();
            }
            
        } catch (error) {
            console.error('Ошибка создания данных:', error);
            showNotification('Ошибка создания данных', 'error');
        }
    }
    
    async function handleFavoriteClick(button, animalId) {
        if (!currentUser) {
            showNotification('Для добавления в избранное необходимо войти в систему', 'error');
            showLoginModal();
            return;
        }
        
        const isFavorite = userFavorites.some(fav => fav.animal_id === animalId);
        const icon = button.querySelector('i');
        
        try {
            if (isFavorite) {
                // Удаляем из избранного
                userFavorites = userFavorites.filter(fav => fav.animal_id !== animalId);
                icon.classList.remove('fas');
                icon.classList.add('far');
                button.classList.remove('active');
                showNotification('Убрано из избранного', 'info');
                
                const animalIndex = animalsData.findIndex(a => a.animal_id === animalId);
                if (animalIndex !== -1) {
                    animalsData[animalIndex].favorites_count = Math.max(0, (animalsData[animalIndex].favorites_count || 0) - 1);
                }
                
            } else {
                // Добавляем в избранное
                userFavorites.push({ animal_id: animalId, user_id: currentUser.id });
                icon.classList.remove('far');
                icon.classList.add('fas');
                button.classList.add('active');
                showNotification('Добавлено в избранное!', 'success');
                
                const animalIndex = animalsData.findIndex(a => a.animal_id === animalId);
                if (animalIndex !== -1) {
                    animalsData[animalIndex].favorites_count = (animalsData[animalIndex].favorites_count || 0) + 1;
                }
            }
            
            localStorage.setItem(`user_favorites_${currentUser.id}`, JSON.stringify(userFavorites));
            localStorage.setItem('test_animals', JSON.stringify(animalsData));
            
            updateUserMenu();
            loadAnimals();
            
        } catch (error) {
            console.error('Ошибка обновления избранного:', error);
            showNotification('Ошибка обновления избранного', 'error');
        }
    }
    
    function showApplicationForm(animalId) {
        const animal = animalsData.find(a => a.animal_id === animalId);
        if (!animal) {
            showNotification('Животное не найдено', 'error');
            return;
        }
        
        console.log('Создание формы заявки для животного:', animal);
        
        const formHTML = `
            <div class="modal" id="application-modal">
                <div class="modal-content">
                    <h2>Заявка на пристройство: ${animal.name}</h2>
                    <form id="application-form">
                        <div class="form-group">
                            <label for="applicant-name">Ваше имя *</label>
                            <input type="text" id="applicant-name" value="${currentUser.full_name || ''}" required>
                        </div>
                        <div class="form-group">
                            <label for="applicant-phone">Телефон *</label>
                            <input type="tel" id="applicant-phone" value="${currentUser.phone || '+375'}" required>
                        </div>
                        <div class="form-group">
                            <label for="applicant-email">Email *</label>
                            <input type="email" id="applicant-email" value="${currentUser.email || ''}" required>
                        </div>
                        <div class="form-group">
                            <label for="applicant-city">Город *</label>
                            <input type="text" id="applicant-city" value="${currentUser.city || ''}" required>
                        </div>
                        <div class="form-group">
                            <label for="application-message">Расскажите о себе и условиях содержания *</label>
                            <textarea id="application-message" rows="4" placeholder="Опишите ваш опыт с животными, условия проживания..." required></textarea>
                        </div>
                        <div class="form-actions">
                            <button type="submit" class="btn btn-primary">Отправить заявку</button>
                            <button type="button" class="btn btn-outline" id="cancel-application">Отмена</button>
                        </div>
                    </form>
                </div>
            </div>
        `;
        
        const modalContainer = document.createElement('div');
        modalContainer.innerHTML = formHTML;
        document.body.appendChild(modalContainer);
        
        // Показываем модальное окно
        modalContainer.classList.remove('hidden');
        
        document.getElementById('application-form').addEventListener('submit', async (e) => {
            e.preventDefault();
            
            console.log('Отправка заявки для животного ID:', animalId);
            
            const applicationData = {
                animal_id: animalId,
                applicant_name: document.getElementById('applicant-name').value,
                applicant_phone: document.getElementById('applicant-phone').value,
                applicant_email: document.getElementById('applicant-email').value,
                applicant_city: document.getElementById('applicant-city').value,
                message: document.getElementById('application-message').value
            };
            
            try {
                const testApplication = {
                    application_id: Date.now(),
                    ...applicationData,
                    user_id: currentUser.id,
                    animal_name: animal.name,
                    status: 'pending',
                    created_at: new Date().toISOString()
                };
                
                console.log('Создана заявка:', testApplication);
                
                // Сохраняем заявку
                userApplications.push(testApplication);
                localStorage.setItem(`user_applications_${currentUser.id}`, JSON.stringify(userApplications));
                
                // Увеличиваем счетчик заявок у животного
                const animalIndex = animalsData.findIndex(a => a.animal_id === animalId);
                if (animalIndex !== -1) {
                    animalsData[animalIndex].applications_count = (animalsData[animalIndex].applications_count || 0) + 1;
                    localStorage.setItem('test_animals', JSON.stringify(animalsData));
                    console.log('Обновлен счетчик заявок у животного:', animalsData[animalIndex]);
                }
                
                // Удаляем модальное окно
                document.body.removeChild(modalContainer);
                
                showNotification('Заявка успешно отправлена!', 'success');
                updateUserMenu();
                
                // Перезагружаем животных для обновления счетчиков
                loadAnimals();
                
            } catch (error) {
                console.error('Ошибка отправки заявки:', error);
                showNotification('Ошибка отправки заявки', 'error');
            }
        });
        
        document.getElementById('cancel-application').addEventListener('click', () => {
            document.body.removeChild(modalContainer);
        });
    }
    
    // ========== ДРУГИЕ ФУНКЦИИ ==========
    
    async function updateStats() {
        try {
            await loadAnimals();
            
            const searchingAnimals = animalsData.filter(animal => animal.status === 'searching').length;
            const adoptedAnimals = animalsData.filter(animal => animal.status === 'adopted').length;
            
            const animalsCount = document.getElementById('animals-count');
            const adoptionsCount = document.getElementById('adoptions-count');
            const volunteersCount = document.getElementById('volunteers-count');
            
            if (animalsCount) animalsCount.textContent = searchingAnimals;
            if (adoptionsCount) adoptionsCount.textContent = adoptedAnimals;
            
            const uniqueVolunteers = [...new Set(animalsData.map(animal => animal.created_by))].length;
            if (volunteersCount) volunteersCount.textContent = uniqueVolunteers;
            
        } catch (error) {
            console.error('Ошибка обновления статистики:', error);
            
            const animalsCount = document.getElementById('animals-count');
            const adoptionsCount = document.getElementById('adoptions-count');
            const volunteersCount = document.getElementById('volunteers-count');
            
            if (animalsCount) animalsCount.textContent = 0;
            if (adoptionsCount) adoptionsCount.textContent = 0;
            if (volunteersCount) volunteersCount.textContent = 0;
        }
    }
    
    function showSection(sectionName) {
        document.querySelectorAll('.section').forEach(section => {
            section.classList.remove('active');
            section.classList.add('hidden');
        });
        
        document.querySelectorAll('.modal').forEach(modal => {
            if (!modal.classList.contains('persistent')) {
                modal.classList.add('hidden');
            }
        });
        
        const section = document.getElementById(`${sectionName}-section`);
        if (section) {
            section.classList.remove('hidden');
            section.classList.add('active');
        }
        
        document.querySelectorAll('.nav-link').forEach(link => {
            link.classList.remove('active');
        });
        const activeLink = document.getElementById(`${sectionName}-link`);
        if (activeLink) activeLink.classList.add('active');
    }
    
    function showLoginModal() {
        if (loginSection) {
            loginSection.classList.remove('hidden');
            document.getElementById('login-email')?.focus();
        }
    }
    
    function showRegisterTypeModal() {
        if (registerTypeSection) {
            registerTypeSection.classList.remove('hidden');
        }
    }
    
    function showUserRegistrationForm() {
        if (registerSection) {
            registerSection.classList.remove('hidden');
            
            // Показываем форму пользователя, скрываем форму волонтера
            const userForm = document.getElementById('register-user-form');
            const volunteerForm = document.getElementById('register-volunteer-form');
            
            if (userForm) userForm.classList.remove('hidden');
            if (volunteerForm) volunteerForm.classList.add('hidden');
            
            document.getElementById('user-fullname')?.focus();
        }
    }
    
    function showVolunteerRegistrationForm() {
        if (registerSection) {
            registerSection.classList.remove('hidden');
            
            // Показываем форму волонтера, скрываем форму пользователя
            const userForm = document.getElementById('register-user-form');
            const volunteerForm = document.getElementById('register-volunteer-form');
            
            if (userForm) userForm.classList.add('hidden');
            if (volunteerForm) volunteerForm.classList.remove('hidden');
            
            document.getElementById('volunteer-fullname')?.focus();
        }
    }
    
    async function showFavorites() {
        if (!currentUser) {
            showNotification('Для просмотра избранного необходимо войти в систему', 'error');
            showLoginModal();
            return;
        }
        
        if (userFavorites.length === 0) {
            animalsList.innerHTML = '<div class="no-data">У вас пока нет избранных животных</div>';
            showSection('animals');
            return;
        }
        
        try {
            animalsList.innerHTML = '<div class="loading">Загрузка избранных животных...</div>';
            
            const favoriteAnimals = animalsData.filter(animal => 
                userFavorites.some(fav => fav.animal_id === animal.animal_id)
            );
            
            if (favoriteAnimals.length > 0) {
                displayAnimals(favoriteAnimals);
                showSection('animals');
                document.getElementById('animals-link').classList.add('active');
            } else {
                animalsList.innerHTML = '<div class="no-data">У вас пока нет избранных животных</div>';
            }
        } catch (error) {
            console.error('Ошибка загрузки избранных:', error);
            animalsList.innerHTML = '<div class="error">Ошибка загрузки избранных животных</div>';
        }
    }
    
    async function showUserApplications() {
        if (!currentUser) {
            showNotification('Для просмотра заявок необходимо войти в систему', 'error');
            showLoginModal();
            return;
        }
        
        if (userApplications.length === 0) {
            animalsList.innerHTML = '<div class="no-data"> У вас пока нет заявок на пристройство</div>';
            showSection('animals');
            return;
        }
        
        // Отображаем заявки пользователя
        animalsList.innerHTML = '<div class="loading">Загрузка ваших заявок...</div>';
        
        if (userApplications.length > 0) {
            // Создаем специальные карточки для заявок
            animalsList.innerHTML = '';
            
            userApplications.forEach(application => {
                const animal = animalsData.find(a => a.animal_id === application.animal_id);
                const card = document.createElement('div');
                card.className = 'animal-card application-card';
                
                let animalInfo = '';
                if (animal) {
                    animalInfo = `
                        <div class="animal-image">
                            <div class="animal-icon"><i class="fas ${animal.type === 'cat' ? 'fa-cat' : 'fa-dog'}"></i></div>
                        </div>
                        <div class="animal-info">
                            <h3>${animal.name}</h3>
                            <div class="animal-type">${animal.type === 'cat' ? 'Кошка' : 'Собака'}${animal.breed ? `, ${animal.breed}` : ''}</div>
                            <div class="application-status status-${application.status}">
                                <strong>Статус:</strong> ${application.status === 'pending' ? 'На рассмотрении' : 
                                                           application.status === 'approved' ? 'Одобрена' : 'Отклонена'}
                            </div>
                            <div class="application-info">
                                <p><strong>Дата подачи:</strong> ${new Date(application.created_at).toLocaleDateString('ru-RU')}</p>
                                <p><strong>Ваше сообщение:</strong> ${application.message || 'Без сообщения'}</p>
                            </div>
                        </div>
                    `;
                } else {
                    animalInfo = `
                        <div class="animal-info">
                            <h3>Заявка #${application.application_id}</h3>
                            <div class="application-status status-${application.status}">
                                <strong>Статус:</strong> ${application.status === 'pending' ? 'На рассмотрении' : 
                                                           application.status === 'approved' ? 'Одобрена' : 'Отклонена'}
                            </div>
                            <div class="application-info">
                                <p><strong>Дата подачи:</strong> ${new Date(application.created_at).toLocaleDateString('ru-RU')}</p>
                                <p><strong>Ваше сообщение:</strong> ${application.message || 'Без сообщения'}</p>
                            </div>
                        </div>
                    `;
                }
                
                card.innerHTML = animalInfo;
                animalsList.appendChild(card);
            });
            
            showSection('animals');
        } else {
            animalsList.innerHTML = '<div class="no-data"> У вас пока нет заявок на пристройство</div>';
        }
    }
    
    function logout() {
        localStorage.removeItem('token');
        localStorage.removeItem('user');
        
        currentUser = null;
        userFavorites = [];
        userApplications = [];
        
        // Обновляем интерфейс
        checkAuth();
        updateNavigation();
        showSection('home');
        showNotification('Вы вышли из системы', 'success');
    }
    
    function showNotification(message, type = 'info') {
        document.querySelectorAll('.notification').forEach(n => n.remove());
        
        const notification = document.createElement('div');
        notification.className = `notification ${type}`;
        notification.innerHTML = `
            <span>${message}</span>
            <button class="close-notification">&times;</button>
        `;
        
        document.body.appendChild(notification);
        
        setTimeout(() => {
            notification.classList.add('fade-out');
            setTimeout(() => {
                if (notification.parentNode) {
                    notification.parentNode.removeChild(notification);
                }
            }, 300);
        }, 5000);
        
        notification.querySelector('.close-notification').addEventListener('click', () => {
            notification.classList.add('fade-out');
            setTimeout(() => {
                if (notification.parentNode) {
                    notification.parentNode.removeChild(notification);
                }
            }, 300);
        });
    }
    
    // ========== ДОБАВЛЕНИЕ СТИЛЕЙ ==========
    addStyles();
    
    function addStyles() {
        const style = document.createElement('style');
        style.textContent = `
            .user-stats {
                display: flex;
                gap: 10px;
                margin-top: 5px;
            }
            
            .user-stats.admin-stats {
                flex-wrap: wrap;
            }
            
            .stat-item {
                display: flex;
                align-items: center;
                gap: 5px;
                font-size: 12px;
                background: #f0f0f0;
                padding: 3px 8px;
                border-radius: 12px;
            }
            
            .role-badge {
                display: inline-block;
                padding: 2px 8px;
                border-radius: 12px;
                font-size: 10px;
                color: white;
                margin-left: 8px;
                font-weight: bold;
            }
            
            .badge-user { background: #4CAF50; }
            .badge-volunteer { background: #2196F3; }
            .badge-admin { background: #FF5722; }
            
            .status-badge {
                position: absolute;
                top: 10px;
                right: 10px;
                padding: 5px 10px;
                border-radius: 15px;
                font-size: 12px;
                font-weight: bold;
                z-index: 2;
                color: white;
            }
            
            .status-searching {
                background: #4CAF50;
            }
            
            .status-reserved {
                background: #FF9800;
            }
            
            .status-adopted {
                background: #9E9E9E;
            }
            
            .animal-stats {
                display: flex;
                gap: 15px;
                margin-top: 10px;
            }
            
            .animal-stats .stat {
                display: flex;
                align-items: center;
                gap: 5px;
                font-size: 14px;
                color: #666;
            }
            
            .animal-actions {
                display: flex;
                justify-content: space-between;
                align-items: center;
                margin-top: 15px;
            }
            
            .action-buttons {
                display: flex;
                gap: 5px;
            }
            
            .admin-actions {
                display: flex;
                gap: 10px;
                margin: 15px 0;
            }
            
            .animal-detail-photo {
                width: 100%;
                max-height: 400px;
                object-fit: cover;
                border-radius: 10px;
            }
            
            .animal-stats-detail {
                display: flex;
                gap: 20px;
                margin: 20px 0;
            }
            
            .animal-stats-detail .stat-item {
                display: flex;
                align-items: center;
                gap: 10px;
                font-size: 16px;
            }
            
            .status-info {
                padding: 10px;
                background: #f8f9fa;
                border-radius: 5px;
                color: #666;
                text-align: center;
            }
            
            .notification {
                position: fixed;
                top: 20px;
                right: 20px;
                padding: 15px 20px;
                border-radius: 8px;
                color: white;
                font-weight: 500;
                z-index: 10000;
                display: flex;
                align-items: center;
                justify-content: space-between;
                min-width: 300px;
                max-width: 500px;
                box-shadow: 0 4px 12px rgba(0,0,0,0.15);
                animation: slideIn 0.3s ease;
            }
            
            .notification.success {
                background: #4CAF50;
                border-left: 5px solid #2E7D32;
            }
            
            .notification.error {
                background: #F44336;
                border-left: 5px solid #C62828;
            }
            
            .notification.info {
                background: #2196F3;
                border-left: 5px solid #1565C0;
            }
            
            .notification.warning {
                background: #FF9800;
                border-left: 5px solid #EF6C00;
            }
            
            .close-notification {
                background: none;
                border: none;
                color: white;
                font-size: 24px;
                cursor: pointer;
                padding: 0;
                margin-left: 15px;
                line-height: 1;
            }
            
            @keyframes slideIn {
                from {
                    transform: translateX(100%);
                    opacity: 0;
                }
                to {
                    transform: translateX(0);
                    opacity: 1;
                }
            }
            
            .fade-out {
                animation: fadeOut 0.3s ease forwards;
            }
            
            @keyframes fadeOut {
                from {
                    transform: translateX(0);
                    opacity: 1;
                }
                to {
                    transform: translateX(100%);
                    opacity: 0;
                }
            }
            
            .loading {
                text-align: center;
                padding: 40px;
                font-size: 18px;
                color: #666;
            }
            
            .no-data {
                text-align: center;
                padding: 40px;
                font-size: 18px;
                color: #666;
                background: #f8f9fa;
                border-radius: 8px;
            }
            
            .error {
                text-align: center;
                padding: 30px;
                background: #fff5f5;
                border: 1px solid #fed7d7;
                border-radius: 8px;
                color: #c53030;
            }
            
            .animal-photo {
                width: 100%;
                height: 200px;
                object-fit: cover;
                border-radius: 8px 8px 0 0;
            }
            
            .animal-icon {
                width: 100%;
                height: 200px;
                display: flex;
                align-items: center;
                justify-content: center;
                background: #f0f0f0;
                border-radius: 8px 8px 0 0;
            }
            
            .animal-icon i {
                font-size: 80px;
                color: #666;
            }
            
            .animal-actions .favorite-btn.disabled {
                opacity: 0.5;
                cursor: not-allowed;
            }
            
            .register-type-options {
                display: grid;
                grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
                gap: 20px;
                margin: 30px 0;
            }
            
            .register-type-card {
                background: #f8f9fa;
                padding: 20px;
                border-radius: 10px;
                text-align: center;
                border: 2px solid transparent;
                transition: all 0.3s ease;
            }
            
            .register-type-card:hover {
                border-color: #4CAF50;
                transform: translateY(-5px);
            }
            
            .register-type-card h3 {
                color: #333;
                margin-bottom: 10px;
            }
            
            .register-type-card p {
                color: #666;
                margin-bottom: 20px;
                font-size: 14px;
            }
            
            /* Стили для карточек заявок */
            .application-card {
                border: 2px solid #e0e0e0;
            }
            
            .application-status {
                padding: 5px 10px;
                border-radius: 5px;
                margin: 10px 0;
                font-weight: bold;
            }
            
            .status-pending {
                background: #fff3cd;
                color: #856404;
                border: 1px solid #ffeaa7;
            }
            
            .status-approved {
                background: #d4edda;
                color: #155724;
                border: 1px solid #c3e6cb;
            }
            
            .status-rejected {
                background: #f8d7da;
                color: #721c24;
                border: 1px solid #f5c6cb;
            }
            
            .application-info {
                margin-top: 10px;
                font-size: 14px;
                color: #666;
            }
            
            .application-info p {
                margin: 5px 0;
            }
            
            /* Стили для панели администратора */
            .admin-panel {
                padding: 20px;
            }
            
            .admin-stats-grid {
                display: grid;
                grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
                gap: 20px;
                margin: 20px 0;
            }
            
            .stat-card {
                background: white;
                border-radius: 10px;
                padding: 20px;
                box-shadow: 0 2px 10px rgba(0,0,0,0.1);
                display: flex;
                align-items: center;
                gap: 15px;
            }
            
            .stat-icon {
                width: 60px;
                height: 60px;
                border-radius: 50%;
                display: flex;
                align-items: center;
                justify-content: center;
                color: white;
                font-size: 24px;
            }
            
            .stat-info h3 {
                margin: 0;
                font-size: 28px;
                color: #333;
            }
            
            .stat-info p {
                margin: 5px 0 0;
                color: #666;
                font-size: 14px;
            }
            
            .admin-tabs {
                margin-top: 30px;
            }
            
            .tab-buttons {
                display: flex;
                gap: 10px;
                margin-bottom: 20px;
                border-bottom: 2px solid #eee;
                padding-bottom: 10px;
            }
            
            .tab-btn {
                padding: 10px 20px;
                background: none;
                border: none;
                border-bottom: 3px solid transparent;
                cursor: pointer;
                font-size: 16px;
                color: #666;
                transition: all 0.3s;
            }
            
            .tab-btn:hover {
                color: #333;
            }
            
            .tab-btn.active {
                color: #4CAF50;
                border-bottom-color: #4CAF50;
                font-weight: bold;
            }
            
            .tab-pane {
                display: none;
                padding: 20px;
                background: white;
                border-radius: 10px;
                box-shadow: 0 2px 10px rgba(0,0,0,0.1);
            }
            
            .tab-pane.active {
                display: block;
            }
            
            .users-table {
                overflow-x: auto;
            }
            
            .users-table table {
                width: 100%;
                border-collapse: collapse;
            }
            
            .users-table th,
            .users-table td {
                padding: 12px;
                text-align: left;
                border-bottom: 1px solid #eee;
            }
            
            .users-table th {
                background: #f8f9fa;
                font-weight: bold;
                color: #333;
            }
            
            .users-table tr:hover {
                background: #f9f9f9;
            }
            
            .users-table tr.current-user {
                background: #e8f5e9;
            }
            
            .animals-controls {
                display: flex;
                gap: 10px;
                margin-bottom: 20px;
            }
            
            .system-actions {
                display: flex;
                gap: 10px;
                margin-bottom: 20px;
                flex-wrap: wrap;
            }
            
            .system-info {
                background: #f8f9fa;
                padding: 15px;
                border-radius: 8px;
                margin-top: 20px;
            }
            
            .system-info h4 {
                margin-top: 0;
                color: #333;
            }
            
            .stats-summary {
                display: flex;
                gap: 20px;
                flex-wrap: wrap;
            }
            
            .stats-summary span {
                background: #f0f0f0;
                padding: 8px 15px;
                border-radius: 20px;
                font-size: 14px;
            }
            
            .stats-summary strong {
                color: #4CAF50;
            }
        `;
        document.head.appendChild(style);
    }
    
    console.log('Приложение загружено!');
});
