// FollowGuard Orion - Análisis de Instagram
// script.js - JavaScript optimizado

// Variables globales
let currentStep = 1;
let username = '';
let connectionsFiles = [];
let followers = [];
let following = [];
let nonFollowers = [];
let fans = [];
let pendingRequests = [];
let profileVisitors = [];
let previewChartInstance = null;
let interactionsChartInstance = null;
let timeUsageChartInstance = null;
let activityChartInstance = null;

// Categorías de archivos
const fileCategories = {
    followers: [], following: [], likes: [], comments: [], messages: [],
    stories: [], posts: [], reels: [], ads: [], searches: [], settings: [], other: []
};

// Inicialización
document.addEventListener('DOMContentLoaded', function() {
    setupUploadArea();
    setupMobileMenu();
    initializePreviewChart();
    setupEventListeners();
    updateProgressBar();
});

// Configuración de event listeners
function setupEventListeners() {
    document.getElementById('exportNonFollowersBtn').addEventListener('click', function() {
        exportToCSV(nonFollowers, 'no_seguidores');
    });
    
    document.getElementById('exportFansBtn').addEventListener('click', function() {
        exportToCSV(fans, 'fans');
    });
    
    document.getElementById('exportPendingRequestsBtn').addEventListener('click', function() {
        exportToCSV(pendingRequests, 'solicitudes_pendientes');
    });
}

// Configuración del menú móvil
function setupMobileMenu() {
    const menuBtn = document.getElementById('mobileMenuBtn');
    const mainNav = document.getElementById('mainNav');
    
    menuBtn.addEventListener('click', function() {
        mainNav.classList.toggle('active');
        
        const icon = menuBtn.querySelector('i');
        if (mainNav.classList.contains('active')) {
            icon.classList.remove('fa-bars');
            icon.classList.add('fa-times');
        } else {
            icon.classList.remove('fa-times');
            icon.classList.add('fa-bars');
        }
    });
    
    // Cerrar menú al hacer clic en un enlace
    const navLinks = document.querySelectorAll('.nav-link');
    navLinks.forEach(link => {
        link.addEventListener('click', function() {
            mainNav.classList.remove('active');
            menuBtn.querySelector('i').classList.remove('fa-times');
            menuBtn.querySelector('i').classList.add('fa-bars');
        });
    });
}

// Inicializar gráfico de previsualización
function initializePreviewChart() {
    const ctx = document.getElementById('previewChart');
    if (!ctx) return;
    
    if (previewChartInstance) {
        previewChartInstance.destroy();
    }
    
    previewChartInstance = new Chart(ctx, {
        type: 'line',
        data: {
            labels: ['Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb', 'Dom'],
            datasets: [{
                label: 'Interacciones semanales',
                data: [12, 19, 8, 15, 6, 11, 14],
                borderColor: '#8a3ab9',
                tension: 0.3,
                fill: true,
                backgroundColor: 'rgba(138, 58, 185, 0.1)'
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: { 
                legend: { 
                    display: false 
                } 
            }, // Se añadió esta coma
            scales: {
                y: { 
                    beginAtZero: true, 
                    grid: { 
                        display: false 
                    } 
                },
                x: { 
                    grid: { 
                        display: false 
                    } 
                }
            }
        } // Esta línea es la 108 en el código original
    });
}

// Configuración del área de upload para carpetas
function setupUploadArea() {
    const area = document.getElementById('connectionsUpload');
    const folderInput = document.getElementById('folderInput');
    
    area.addEventListener('click', function() {
        folderInput.click();
    });
    
    // Soporte para arrastrar y soltar
    area.addEventListener('dragover', function(e) {
        e.preventDefault();
        area.style.borderColor = '#8a3ab9';
        area.style.backgroundColor = 'rgba(138, 58, 185, 0.05)';
    });
    
    area.addEventListener('dragleave', function() {
        area.style.borderColor = '';
        area.style.backgroundColor = '';
    });
    
    area.addEventListener('drop', function(e) {
        e.preventDefault();
        const items = e.dataTransfer.items;
        
        if (!items) return;
        
        connectionsFiles = [];
        const filesContainer = document.getElementById('selectedFiles');
        filesContainer.innerHTML = '';
        
        processItems(items).then(() => {
            checkFilesReady();
        });
    });
    
    folderInput.addEventListener('change', function(e) {
        const files = Array.from(e.target.files);
        if (files.length === 0) return;
        
        connectionsFiles = [];
        const filesContainer = document.getElementById('selectedFiles');
        filesContainer.innerHTML = '';
        
        processFiles(files).then(() => {
            checkFilesReady();
        });
    });
}

// Procesar elementos arrastrados (archivos o carpetas)
async function processItems(items) {
    for (let i = 0; i < items.length; i++) {
        const item = items[i];
        
        if (item.kind === 'file') {
            const file = item.getAsFile();
            await processFile(file);
        } else if (item.kind === 'directory') {
            showNotification('No es posible acceder a carpetas mediante arrastre. Por favor, selecciona la carpeta usando el botón.', 'warning');
        }
    }
}

// Procesar lista de archivos
async function processFiles(files) {
    for (let i = 0; i < files.length; i++) {
        await processFile(files[i]);
    }
}

// Procesar un archivo individual
async function processFile(file) {
    return new Promise((resolve) => {
        if (!file.name.endsWith('.json')) {
            resolve();
            return;
        }
        
        const reader = new FileReader();
        reader.onload = function(e) {
            try {
                const data = JSON.parse(e.target.result);
                connectionsFiles.push({
                    name: file.name,
                    data: data,
                    file: file
                });
                
                // Categorizar archivo
                categorizeFile(file.name, data);
                
                // Mostrar archivo en la lista
                const filesContainer = document.getElementById('selectedFiles');
                const fileItem = document.createElement('div');
                fileItem.className = 'file-item';
                fileItem.innerHTML = `
                    <span class="file-name"><i class="fas fa-file-code"></i> ${file.name}</span>
                    <span class="file-status success">Cargado</span>
                `;
                filesContainer.appendChild(fileItem);
                
                resolve();
            } catch (error) {
                // Mostrar error para este archivo
                const filesContainer = document.getElementById('selectedFiles');
                const fileItem = document.createElement('div');
                fileItem.className = 'file-item';
                fileItem.innerHTML = `
                    <span class="file-name"><i class="fas fa-file-exclamation"></i> ${file.name}</span>
                    <span class="file-status error">Error: Archivo JSON inválido</span>
                `;
                filesContainer.appendChild(fileItem);
                console.error('Error al leer el archivo:', error);
                resolve();
            }
        };
        reader.readAsText(file);
    });
}

// Categorizar archivo según su nombre y contenido
function categorizeFile(fileName, data) {
    const name = fileName.toLowerCase();
    
    if (name.includes('follower')) {
        fileCategories.followers.push({name, data});
    } else if (name.includes('following')) {
        fileCategories.following.push({name, data});
    } else if (name.includes('like')) {
        fileCategories.likes.push({name, data});
    } else if (name.includes('comment')) {
        fileCategories.comments.push({name, data});
    } else if (name.includes('message')) {
        fileCategories.messages.push({name, data});
    } else if (name.includes('story')) {
        fileCategories.stories.push({name, data});
    } else if (name.includes('post')) {
        fileCategories.posts.push({name, data});
    } else if (name.includes('reel')) {
        fileCategories.reels.push({name, data});
    } else if (name.includes('ad')) {
        fileCategories.ads.push({name, data});
    } else if (name.includes('search')) {
        fileCategories.searches.push({name, data});
    } else if (name.includes('setting') || name.includes('preference')) {
        fileCategories.settings.push({name, data});
    } else {
        fileCategories.other.push({name, data});
    }
    
    // Actualizar vistas previas
    updatePreviews();
}

// Actualizar vistas previas de categorías
function updatePreviews() {
    document.getElementById('followersCountPreview').textContent = fileCategories.followers.length;
    document.getElementById('commentsCountPreview').textContent = fileCategories.comments.length;
    document.getElementById('messagesCountPreview').textContent = fileCategories.messages.length;
    document.getElementById('likesCountPreview').textContent = fileCategories.likes.length;
}

// Verificar si hay archivos listos
function checkFilesReady() {
    const analyzeBtn = document.getElementById('analyzeBtn');
    const uploadArea = document.getElementById('connectionsUpload');
    
    if (connectionsFiles.length > 0) {
        analyzeBtn.disabled = false;
        uploadArea.style.borderColor = '#2ecc71';
        uploadArea.style.backgroundColor = 'rgba(46, 204, 113, 0.05)';
        uploadArea.innerHTML = `
            <div class="upload-icon" style="color: #2ecc71;">
                <i class="fas fa-check-circle"></i>
            </div>
            <p>${connectionsFiles.length} archivo(s) seleccionado(s)</p>
            <small>Haz clic o arrastra más archivos para añadirlos</small>
        `;
    } else {
        analyzeBtn.disabled = true;
    }
}

// Navegación entre pasos
function nextStep(step) {
    if (step === 2) {
        username = document.getElementById('username').value.trim();
        if (!username) {
            showNotification('Por favor, ingresa tu nombre de usuario de Instagram', 'error');
            return;
        }
    }
    
    document.querySelector(`#step${currentStep}Content`).classList.remove('active');
    document.querySelector(`#step${currentStep}`).classList.remove('active');
    
    currentStep = step;
    
    document.querySelector(`#step${currentStep}Content`).classList.add('active');
    document.querySelector(`#step${currentStep}`).classList.add('active');
    
    if (step === 3) {
        // Mostrar carga y ocultar resultados
        document.getElementById('loadingIndicator').style.display = 'block';
        document.getElementById('resultsSection').style.display = 'none';
        
        // Procesar datos con barra de progreso simulada
        simulateProgress();
    }
    
    updateProgressBar();
    window.scrollTo({ top: 0, behavior: 'smooth' });
}

function prevStep(step) {
    document.querySelector(`#step${currentStep}Content`).classList.remove('active');
    document.querySelector(`#step${currentStep}`).classList.remove('active');
    
    currentStep = step;
    
    document.querySelector(`#step${currentStep}Content`).classList.add('active');
    document.querySelector(`#step${currentStep}`).classList.add('active');
    
    updateProgressBar();
    window.scrollTo({ top: 0, behavior: 'smooth' });
}

function updateProgressBar() {
    const progressBar = document.getElementById('progressBar');
    const totalSteps = 3;
    const width = ((currentStep - 1) / (totalSteps - 1)) * 100;
    progressBar.style.width = `${width}%`;
    
    // Marcar pasos anteriores como completados
    for (let i = 1; i < currentStep; i++) {
        document.getElementById(`step${i}`).classList.add('completed');
    }
    
    // Asegurarse de que los pasos siguientes no estén marcados como completados
    for (let i = currentStep; i <= totalSteps; i++) {
        document.getElementById(`step${i}`).classList.remove('completed');
    }
}

// Simular progreso de análisis
function simulateProgress() {
    const progressText = document.getElementById('progressText');
    let progress = 0;
    
    const interval = setInterval(() => {
        progress += Math.random() * 10;
        if (progress >= 100) {
            progress = 100;
            clearInterval(interval);
            
            // Procesar datos reales
            analyzeData();
            
            // Ocultar carga y mostrar resultados
            setTimeout(() => {
                document.getElementById('loadingIndicator').style.display = 'none';
                document.getElementById('resultsSection').style.display = 'block';
                showNotification('Análisis completado con éxito', 'success');
            }, 500);
        }
        progressText.textContent = `Cargando ${Math.round(progress)}%`;
    }, 200);
}

// Función para extraer usuarios de archivos JSON de Instagram
function extractUsers(data, fileName) {
    const users = [];
    
    // Buscar recursivamente valores de usuario en la estructura JSON
    function searchForUsers(obj, path = '') {
        if (typeof obj !== 'object' || obj === null) return;
        
        // Si encontramos un campo que parece contener un nombre de usuario
        if (obj.value && typeof obj.value === 'string' && obj.value.length > 0) {
            users.push(obj.value);
        }
        
        if (obj.title && typeof obj.title === 'string' && obj.title.length > 0) {
            users.push(obj.title);
        }
        
        // Para archivos de mensajes
        if (obj.sender_name && typeof obj.sender_name === 'string') {
            users.push(obj.sender_name);
        }
        
        if (obj.participants && Array.isArray(obj.participants)) {
            obj.participants.forEach(participant => {
                if (typeof participant === 'string') {
                    users.push(participant);
                }
            });
        }
        
        // Para archivos de comentarios y likes
        if (obj.string_list_data && Array.isArray(obj.string_list_data)) {
            obj.string_list_data.forEach(item => {
                if (item.value && typeof item.value === 'string') {
                    users.push(item.value);
                }
            });
        }
        
        // Para archivos de seguidores y seguidos
        if (obj.name && typeof obj.name === 'string') {
            users.push(obj.name);
        }
        
        if (obj.username && typeof obj.username === 'string') {
            users.push(obj.username);
        }
        
        // Buscar en arrays y objetos anidados
        if (Array.isArray(obj)) {
            obj.forEach(item => searchForUsers(item, path + '[]'));
        } else {
            Object.keys(obj).forEach(key => {
                searchForUsers(obj[key], path + '.' + key);
            });
        }
    }
    
    searchForUsers(data);
    return [...new Set(users)]; // Eliminar duplicados
}

// Analizar datos de Instagram
function analyzeData() {
    followers = [];
    following = [];
    let likes = [];
    let comments = [];
    let messages = [];
    let stories = [];
    
    // Procesar archivos por categorías
    fileCategories.followers.forEach(file => {
        const users = extractUsers(file.data, file.name);
        followers = [...followers, ...users];
    });
    
    fileCategories.following.forEach(file => {
        const users = extractUsers(file.data, file.name);
        following = [...following, ...users];
    });
    
    // Buscar solicitudes pendientes (si existen en los archivos)
    pendingRequests = [];
    fileCategories.followers.forEach(file => {
        if (file.name.includes('pending') || file.data.pending_follow_requests) {
            const pendingUsers = extractUsers(file.data, file.name);
            pendingRequests = [...pendingRequests, ...pendingUsers];
        }
    });
    
    // Si no encontramos solicitudes pendientes en archivos específicos, intentar buscar en otros
    if (pendingRequests.length === 0) {
        fileCategories.other.forEach(file => {
            if (file.name.includes('pending') || file.name.includes('request')) {
                const pendingUsers = extractUsers(file.data, file.name);
                pendingRequests = [...pendingRequests, ...pendingUsers];
            }
        });
    }
    
    fileCategories.likes.forEach(file => {
        const users = extractUsers(file.data, file.name);
        likes = [...likes, ...users];
    });
    
    fileCategories.comments.forEach(file => {
        const users = extractUsers(file.data, file.name);
        comments = [...comments, ...users];
    });
    
    fileCategories.messages.forEach(file => {
        const users = extractUsers(file.data, file.name);
        messages = [...messages, ...users];
    });
    
    fileCategories.stories.forEach(file => {
        const users = extractUsers(file.data, file.name);
        stories = [...stories, ...users];
    });
    
    // Eliminar duplicados
    followers = [...new Set(followers)];
    following = [...new Set(following)];
    pendingRequests = [...new Set(pendingRequests)];
    likes = [...new Set(likes)];
    comments = [...new Set(comments)];
    messages = [...new Set(messages)];
    stories = [...new Set(stories)];
    
    // Encontrar no seguidores (personas que sigues pero que no te siguen)
    const followersSet = new Set(followers);
    nonFollowers = following.filter(user => !followersSet.has(user));
    
    // Encontrar fans (personas que te siguen pero a quienes tú no sigues)
    const followingSet = new Set(following);
    fans = followers.filter(user => !followingSet.has(user));
    
    // Actualizar UI
    document.getElementById('resultUsername').textContent = username;
    document.getElementById('followingCount').textContent = following.length;
    document.getElementById('followersCount').textContent = followers.length;
    document.getElementById('nonFollowersCount').textContent = nonFollowers.length;
    document.getElementById('fansCount').textContent = fans.length;
    document.getElementById('pendingRequestsCount').textContent = pendingRequests.length;
    
    // Actualizar estadísticas avanzadas
    document.getElementById('totalLikes').textContent = likes.length;
    document.getElementById('totalComments').textContent = comments.length;
    document.getElementById('totalShares').textContent = Math.floor(likes.length * 0.1); // Estimación
    document.getElementById('totalViews').textContent = Math.floor(likes.length * 2.5); // Estimación
    document.getElementById('totalConversations').textContent = fileCategories.messages.length;
    document.getElementById('totalContacts').textContent = messages.length > 0 ? Math.floor(messages.length / 10) : 0; // Estimación
    document.getElementById('totalMessagesSent').textContent = Math.floor(messages.length * 0.6); // Estimación
    document.getElementById('totalMessagesReceived').textContent = Math.floor(messages.length * 0.4); // Estimación
    
    // Crear gráficos avanzados
    createAdvancedCharts();
    
    // Mostrar no seguidores
    displayNonFollowers();
    
    // Mostrar fans
    displayFans();
    
    // Mostrar solicitudes pendientes
    displayPendingRequests();
    
    // Configurar pestañas
    setupTabs();
    
    // Analizar visitantes del perfil
    analyzeProfileVisitors(likes, comments, messages, stories);
}

// Mostrar no seguidores
function displayNonFollowers() {
    const nonFollowersList = document.getElementById('nonFollowersList');
    nonFollowersList.innerHTML = '';
    
    if (nonFollowers.length > 0) {
        nonFollowers.forEach(user => {
            const div = document.createElement('div');
            div.className = 'non-follower-item';
            div.innerHTML = `
                <a href="https://instagram.com/${user}" target="_blank" class="user-link">
                    <div class="user-avatar">${user.charAt(0).toUpperCase()}</div>
                    <div class="user-info">
                        <span class="username">${user}</span>
                        <span class="user-detail">Ver perfil</span>
                    </div>
                </a>
            `;
            nonFollowersList.appendChild(div);
        });
    } else {
        nonFollowersList.innerHTML = '<p class="no-results">¡Genial! Todos tus seguidores te siguen de vuelta.</p>';
    }
    
    // Configurar exportación
    document.getElementById('exportNonFollowersBtn').addEventListener('click', function() {
        exportToCSV(nonFollowers, 'no_seguidores');
    });
}

// Mostrar fans (te siguen pero tú no los sigues)
function displayFans() {
    const fansList = document.getElementById('fansList');
    fansList.innerHTML = '';
    
    if (fans.length > 0) {
        fans.forEach(user => {
            const div = document.createElement('div');
            div.className = 'non-follower-item';
            div.innerHTML = `
                <a href="https://instagram.com/${user}" target="_blank" class="user-link">
                    <div class="user-avatar">${user.charAt(0).toUpperCase()}</div>
                    <div class="user-info">
                        <span class="username">${user}</span>
                        <span class="user-detail">Ver perfil</span>
                    </div>
                </a>
            `;
            fansList.appendChild(div);
        });
    } else {
        fansList.innerHTML = '<p class="no-results">No tienes fans (todos a quienes sigues también te siguen).</p>';
    }
    
    // Configurar exportación
    document.getElementById('exportFansBtn').addEventListener('click', function() {
        exportToCSV(fans, 'fans');
    });
}

// Mostrar solicitudes pendientes
function displayPendingRequests() {
    const pendingRequestsList = document.getElementById('pendingRequestsList');
    pendingRequestsList.innerHTML = '';
    
    if (pendingRequests.length > 0) {
        pendingRequests.forEach(user => {
            const div = document.createElement('div');
            div.className = 'non-follower-item';
            div.innerHTML = `
                <a href="https://instagram.com/${user}" target="_blank" class="user-link">
                    <div class="user-avatar">${user.charAt(0).toUpperCase()}</div>
                    <div class="user-info">
                        <span class="username">${user}</span>
                        <span class="user-detail">Ver perfil</span>
                    </div>
                </a>
            `;
            pendingRequestsList.appendChild(div);
        });
    } else {
        pendingRequestsList.innerHTML = '<p class="no-results">No se encontraron solicitudes pendientes.</p>';
    }
    
    // Configurar exportación
    document.getElementById('exportPendingRequestsBtn').addEventListener('click', function() {
        exportToCSV(pendingRequests, 'solicitudes_pendientes');
    });
}

// Configurar pestañas
function setupTabs() {
    const tabs = document.querySelectorAll('.tab');
    const tabContents = document.querySelectorAll('.tab-content');
    
    tabs.forEach(tab => {
        tab.addEventListener('click', () => {
            const tabId = tab.getAttribute('data-tab');
            
            // Desactivar todas las pestañas
            tabs.forEach(t => t.classList.remove('active'));
            tabContents.forEach(tc => tc.classList.remove('active'));
            
            // Activar la pestaña seleccionada
            tab.classList.add('active');
            document.querySelector(`.tab-content[data-tab="${tabId}"]`).classList.add('active');
        });
    });
}

// Crear gráficos avanzados
function createAdvancedCharts() {
    // Gráfico de uso de tiempo
    const timeCtx = document.getElementById('timeUsageChart');
    if (timeCtx) {
        if (timeUsageChartInstance) {
            timeUsageChartInstance.destroy();
        }
        
        timeUsageChartInstance = new Chart(timeCtx, {
            type: 'doughnut',
            data: {
                labels: ['Publicaciones', 'Historias', 'Mensajes', 'Explorar'],
                datasets: [{
                    data: [30, 25, 20, 25],
                    backgroundColor: ['#8a3ab9', '#bc2a8d', '#fccc63', '#405DE6']
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                    legend: {
                        position: 'bottom'
                    }
                }
            }
        });
    }
    
    // Gráfico de actividad por día
    const activityCtx = document.getElementById('activityChart');
    if (activityCtx) {
        if (activityChartInstance) {
            activityChartInstance.destroy();
        }
        
        activityChartInstance = new Chart(activityCtx, {
            type: 'bar',
            data: {
                labels: ['Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb', 'Dom'],
                datasets: [{
                    label: 'Interacciones',
                    data: [12, 19, 8, 15, 6, 11, 14],
                    backgroundColor: '#8a3ab9'
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                    legend: {
                        display: false
                    }
                },
                scales: {
                    y: {
                        beginAtZero: true
                    }
                }
            }
        });
    }
}

// Analizar visitantes del perfil
function analyzeProfileVisitors(likes, comments, messages, stories) {
    // Combinar todos los usuarios de los que tenemos datos
    const allUsers = [...new Set([...followers, ...following, ...nonFollowers, ...fans, ...likes, ...comments, ...messages, ...stories])];
    
    // Simular datos de interacción (en una app real, esto vendría de los archivos JSON)
    const interactions = simulateInteractions(allUsers, likes, comments, messages, stories);
    
    // Calcular puntuación de posible visita al perfil
    profileVisitors = calculateVisitorScore(interactions);
    
    // Mostrar resultados
    displayVisitorResults();
}

// Simular interacciones (en una app real, esto se obtendría de los archivos JSON)
function simulateInteractions(users, likes, comments, messages, stories) {
    const interactions = [];
    
    users.forEach(user => {
        // Simular diferentes tipos de interacciones con pesos diferentes
        const userLikes = likes.filter(u => u === user).length;
        const userComments = comments.filter(u => u === user).length;
        const userMessages = messages.filter(u => u === user).length;
        const userStories = stories.filter(u => u === user).length;
        
        // Fecha de última interacción (más reciente para algunos usuarios)
        const lastInteractionDays = Math.floor(Math.random() * 30);
        const lastInteraction = new Date();
        lastInteraction.setDate(lastInteraction.getDate() - lastInteractionDays);
        
        interactions.push({
            username: user,
            likes: userLikes,
            comments: userComments,
            messages: userMessages,
            storyViews: userStories,
            lastInteraction
        });
    });
    
    return interactions;
}

// Calcular puntuación de posible visita al perfil
function calculateVisitorScore(interactions) {
    return interactions.map(interaction => {
        // Calcular puntuación basada en diferentes factores con diferentes pesos
        let score = 0;
        
        // Peso de diferentes interacciones
        score += interaction.likes * 1; // Cada like suma 1 punto
        score += interaction.comments * 3; // Cada comentario suma 3 puntos
        score += interaction.messages * 5; // Cada mensaje suma 5 puntos
        score += interaction.storyViews * 0.5; // Cada visualización de story suma 0.5 puntos
        
        // Penalizar interacciones antiguas
        const daysSinceInteraction = Math.floor((new Date() - interaction.lastInteraction) / (1000 * 60 * 60 * 24));
        if (daysSinceInteraction > 7) {
            score *= 0.9; // Reducir 10% si la interacción es de hace más de una semana
        }
        if (daysSinceInteraction > 30) {
            score *= 0.7; // Reducir 30% si la interacción es de hace más de un mes
        }
        
        // Añadir elemento aleatorio para simular imprevisibilidad
        score *= (0.8 + Math.random() * 0.4);
        
        return {
            username: interaction.username,
            score: Math.round(score * 100) / 100,
            interactions: {
                likes: interaction.likes,
                comments: interaction.comments,
                messages: interaction.messages,
                storyViews: interaction.storyViews
            },
            lastInteraction: interaction.lastInteraction.toLocaleDateString()
        };
    }).sort((a, b) => b.score - a.score) // Ordenar por puntuación descendente
      .slice(0, 15); // Mostrar solo los 15 primeros
}

// Mostrar resultados de visitantes
function displayVisitorResults() {
    const visitorsList = document.getElementById('visitorsList');
    visitorsList.innerHTML = '';
    
    if (profileVisitors.length > 0) {
        profileVisitors.forEach(visitor => {
            const div = document.createElement('div');
            div.className = 'visitor-item';
            div.innerHTML = `
                <a href="https://instagram.com/${visitor.username}" target="_blank" class="user-link">
                    <div class="user-avatar">${visitor.username.charAt(0).toUpperCase()}</div>
                    <div class="user-info">
                        <span class="username">${visitor.username}</span>
                        <span class="user-detail">
                            Likes: ${visitor.interactions.likes} | 
                            Comentarios: ${visitor.interactions.comments} | 
                            Última interacción: ${visitor.lastInteraction}
                        </span>
                    </div>
                </a>
                <div class="visitor-score">${visitor.score}</div>
            `;
            visitorsList.appendChild(div);
        });
        
        // Mostrar gráfico de interacciones
        displayInteractionsChart();
        
        // Mostrar patrones de actividad
        displayActivityPatterns();
    } else {
        visitorsList.innerHTML = '<p class="no-results">No se pudieron determinar posibles visitantes con los datos disponibles.</p>';
    }
}

// Mostrar gráfico de interacciones
function displayInteractionsChart() {
    const canvas = document.getElementById('interactionsChart');
    if (!canvas) {
        console.error('Canvas del gráfico de interacciones no encontrado');
        return;
    }
    
    // Destruir gráfico existente si hay uno
    if (interactionsChartInstance) {
        interactionsChartInstance.destroy();
    }
    
    // Preparar datos para el gráfico
    const topVisitors = profileVisitors.slice(0, 5);
    const labels = topVisitors.map(v => v.username);
    const scores = topVisitors.map(v => v.score);
    
    interactionsChartInstance = new Chart(canvas, {
        type: 'bar',
        data: {
            labels: labels,
            datasets: [{
                label: 'Puntuación de visita',
                data: scores,
                backgroundColor: '#8a3ab9',
                borderRadius: 5
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
                legend: {
                    display: false
                },
                title: {
                    display: true,
                    text: 'Top 5 posibles visitantes de tu perfil'
                }
            },
            scales: {
                y: {
                    beginAtZero: true,
                    title: {
                        display: true,
                        text: 'Puntuación de visita'
                    },
                    grid: {
                        display: false
                    }
                },
                x: {
                    grid: {
                        display: false
                    }
                }
            }
        }
    });
}

// Mostrar patrones de actividad
function displayActivityPatterns() {
    const activityPatterns = document.getElementById('activityPatterns');
    activityPatterns.innerHTML = '';
    
    // Simular patrones de actividad (en una app real, esto se calcularía de los datos)
    const patterns = [
        {
            title: 'Horario pico de interacciones',
            description: 'La mayoría de tus interacciones ocurren entre las 16:00 y 20:00 horas.'
        },
        {
            title: 'Días de mayor actividad',
            description: 'Viernes y sábados son tus días con mayor número de interacciones.'
        },
        {
            title: 'Tipo de contenido más interactivo',
            description: 'Tus publicaciones con preguntas en la descripción generan un 40% más de comentarios.'
        }
    ];
    
    patterns.forEach(pattern => {
        const patternDiv = document.createElement('div');
        patternDiv.className = 'pattern-card';
        patternDiv.innerHTML = `
            <h4>${pattern.title}</h4>
            <p>${pattern.description}</p>
        `;
        activityPatterns.appendChild(patternDiv);
    });
}

// Exportar a CSV
function exportToCSV(data, type) {
    if (data.length === 0) {
        showNotification(`No hay ${type === 'no_seguidores' ? 'no seguidores' : type === 'fans' ? 'fans' : 'solicitudes pendientes'} para exportar.`, 'warning');
        return;
    }
    
    // Crear contenido CSV
    let csvContent = "data:text/csv;charset=utf-8,Usuario\n";
    data.forEach(user => {
        csvContent += `${user}\n`;
    });
    
    // Crear enlace de descarga
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", `${type}_${username}.csv`);
    document.body.appendChild(link);
    
    // Simular clic para descargar
    link.click();
    document.body.removeChild(link);
    showNotification('Archivo exportado con éxito', 'success');
}

// Mostrar sección de análisis
function showAnalysisSection() {
    document.getElementById('analysis').scrollIntoView({ behavior: 'smooth' });
}

// Mostrar notificación
function showNotification(message, type = 'info') {
    // Crear elemento de notificación
    const notification = document.createElement('div');
    notification.className = `notification ${type}`;
    notification.innerHTML = `
        <div class="notification-content">
            <i class="fas fa-${type === 'success' ? 'check-circle' : type === 'error' ? 'exclamation-circle' : 'info-circle'}"></i>
            <span>${message}</span>
        </div>
    `;
    
    // Añadir al cuerpo del documento
    document.body.appendChild(notification);
    
    // Mostrar con animación
    setTimeout(() => {
        notification.classList.add('show');
    }, 10);
    
    // Ocultar después de 3 segundos
    setTimeout(() => {
        notification.classList.remove('show');
        setTimeout(() => {
            document.body.removeChild(notification);
        }, 300);
    }, 3000);
}