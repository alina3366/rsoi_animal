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
    
    function updateUserMenu() {
        if (!currentUser) return;
        
        if (userName) {
            userName.textContent = currentUser.full_name || currentUser.email;
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
            return;
        }
        
        if (favoritesLink) favoritesLink.classList.remove('hidden');
        
        if (currentUser.role_id === 2) { // Волонтер
            if (addAnimalLink) addAnimalLink.classList.remove('hidden');
            if (requestsLink) requestsLink.classList.remove('hidden');
        } else if (currentUser.role_id === 1) { // Обычный пользователь
            if (requestsLink) requestsLink.classList.remove('hidden');
            if (addAnimalLink) addAnimalLink.classList.add('hidden');
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
                
                localStorage.setItem('token', 'test-token-' + Date.now());
                localStorage.setItem('user', JSON.stringify(testUser));
                
                currentUser = testUser;
                await loadUserData();
                
                loginSection.classList.add('hidden');
                showNotification('Вход выполнен успешно!', 'success');
                loginForm.reset();
                
                // Обновляем интерфейс
                checkAuth();
                updateNavigation();
                
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
                
                localStorage.setItem('token', 'test-token-' + Date.now());
                localStorage.setItem('user', JSON.stringify(testUser));
                
                currentUser = testUser;
                await loadUserData();
                
                registerSection.classList.add('hidden');
                showNotification('Регистрация успешна!', 'success');
                registerUserForm.reset();
                
                // Обновляем интерфейс
                checkAuth();
                updateNavigation();
                
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
                
                localStorage.setItem('token', 'test-token-' + Date.now());
                localStorage.setItem('user', JSON.stringify(testUser));
                
                currentUser = testUser;
                await loadUserData();
                
                registerSection.classList.add('hidden');
                showNotification('Регистрация волонтера успешна!', 'success');
                registerVolunteerForm.reset();
                
                // Обновляем интерфейс
                checkAuth();
                updateNavigation();
                
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
            
            if (!currentUser || currentUser.role_id !== 2) {
                showNotification('Только волонтеры могут добавлять животных', 'error');
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
            
            // Загружаем тестовые данные
            const savedAnimals = JSON.parse(localStorage.getItem('test_animals') || '[]');
            
            if (savedAnimals.length === 0) {
                animals = getTestAnimals();
                localStorage.setItem('test_animals', JSON.stringify(animals));
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
    
    function getTestAnimals() {
        return [
            {
                animal_id: 1,
                name: 'Барсик',
                type: 'cat',
                breed: 'Британский',
                age_months: 24,
                gender: 'male',
                status: 'searching',
                location_city: 'Минск',
                description: 'Ласковый кот, ищет заботливую семью',
                created_at: '2024-01-15T10:00:00Z',
                photo_url: null,
                favorites_count: 5,
                applications_count: 2,
                created_by: 1001
            },
            {
                animal_id: 2,
                name: 'Шарик',
                type: 'dog',
                breed: 'Дворняжка',
                age_months: 36,
                gender: 'male',
                status: 'searching',
                location_city: 'Гомель',
                description: 'Дружелюбный пес, любит детей',
                created_at: '2024-02-10T14:30:00Z',
                photo_url: null,
                favorites_count: 8,
                applications_count: 3,
                created_by: 1002
            },
            {
                animal_id: 3,
                name: 'Мурка',
                type: 'cat',
                breed: 'Сиамская',
                age_months: 12,
                gender: 'female',
                status: 'searching',
                location_city: 'Минск',
                description: 'Игривая кошка, ищет активных хозяев',
                created_at: '2024-01-20T09:15:00Z',
                photo_url: null,
                favorites_count: 3,
                applications_count: 1,
                created_by: 1001
            },
            {
                animal_id: 4,
                name: 'Рекс',
                type: 'dog',
                breed: 'Немецкая овчарка',
                age_months: 18,
                gender: 'male',
                status: 'searching',
                location_city: 'Витебск',
                description: 'Умный и энергичный пес, нуждается в активных хозяевах',
                created_at: '2024-02-05T11:45:00Z',
                photo_url: null,
                favorites_count: 12,
                applications_count: 5,
                created_by: 1002
            },
            {
                animal_id: 5,
                name: 'Люси',
                type: 'dog',
                breed: 'Такса',
                age_months: 48,
                gender: 'female',
                status: 'searching',
                location_city: 'Гродно',
                description: 'Спокойная и дружелюбная собака, отлично ладит с другими животными',
                created_at: '2024-01-30T16:20:00Z',
                photo_url: null,
                favorites_count: 7,
                applications_count: 2,
                created_by: 1003
            }
        ];
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
        if (currentUser) {
            if (currentUser.role_id === 2) { // Волонтер
                // Волонтер видит только кнопку "Подробнее" и избранное
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
                    <button class="${favoriteBtnClass}" title="${currentUser ? 'Добавить в избранное' : 'Войдите для добавления в избранное'}" ${!currentUser ? 'disabled' : ''}>
                        <i class="${heartIcon}"></i>
                    </button>
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
                
                if (currentUser.role_id === 2) {
                    showNotification('Волонтеры не могут подавать заявки на пристройство', 'error');
                    return;
                }
                
                showApplicationForm(animalId);
            });
        }
        
        // Обработчик кнопки "Избранное"
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
        
        return card;
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
    
    async function showAnimalDetails(animal) {
        const animalId = animal.animal_id || animal.id;
        const isFavorite = currentUser ? 
            userFavorites.some(fav => fav.animal_id === animalId) : false;
        
        // Определяем, что показывать в зависимости от роли пользователя
        let actionButtons = '';
        if (currentUser) {
            if (currentUser.role_id === 2) { // Волонтер
                // Волонтер видит только кнопку избранного
                actionButtons = `
                    <button class="btn ${isFavorite ? 'btn-danger' : 'btn-outline'}" id="favorite-detail-btn" ${!currentUser ? 'disabled' : ''}>
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
                        <button class="btn ${isFavorite ? 'btn-danger' : 'btn-outline'}" id="favorite-detail-btn" ${!currentUser ? 'disabled' : ''}>
                            <i class="${isFavorite ? 'fas' : 'far'} fa-heart"></i> ${isFavorite ? 'В избранном' : 'В избранное'}
                        </button>
                    `;
                } else {
                    actionButtons = `
                        <p class="status-info">Это животное ${animal.status === 'reserved' ? 'уже забронировано' : 'уже пристроено'}</p>
                        <button class="btn ${isFavorite ? 'btn-danger' : 'btn-outline'}" id="favorite-detail-btn" ${!currentUser ? 'disabled' : ''}>
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
                
                if (currentUser.role_id === 2) {
                    showNotification('Волонтеры не могут подавать заявки на пристройство', 'error');
                    return;
                }
                
                showApplicationForm(animalId);
            });
        }
        
        // Обработчик кнопки "Избранное"
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
        
        showSection('animal-details');
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
            
            if (animalsCount) animalsCount.textContent = 5;
            if (adoptionsCount) adoptionsCount.textContent = 0;
            if (volunteersCount) volunteersCount.textContent = 3;
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
            
            .stat-item {
                display: flex;
                align-items: center;
                gap: 5px;
                font-size: 12px;
                background: #f0f0f0;
                padding: 3px 8px;
                border-radius: 12px;
            }
            
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
        `;
        document.head.appendChild(style);
    }
    
    console.log('Приложение загружено!');
});
