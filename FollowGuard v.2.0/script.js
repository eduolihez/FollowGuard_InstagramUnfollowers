// Variables globales
let currentStep = 1;
let username = '';
let connectionsFiles = [];
let followers = [];
let following = [];
let nonFollowers = [];
let profileVisitors = [];

// Inicialización
document.addEventListener('DOMContentLoaded', function() {
    setupUploadArea();
    document.getElementById('exportNonFollowersBtn').addEventListener('click', function() {
        exportToCSV(nonFollowers, 'no_seguidores');
    });
    
    updateProgressBar();
    
    // Gráfico de previsualización
    const ctx = document.getElementById('previewChart').getContext('2d');
    new Chart(ctx, {
        type: 'line',
        data: {
            labels: ['Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb', 'Dom'],
            datasets: [{
                label: 'Interacciones semanales',
                data: [12, 19, 8, 15, 6, 11, 14],
                borderColor: '#E1306C',
                tension: 0.3,
                fill: true,
                backgroundColor: 'rgba(225, 48, 108, 0.1)'
            }]
        },
        options: {
            responsive: true,
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
});

// Configuración del área de upload para múltiples archivos
function setupUploadArea() {
    const area = document.getElementById('connectionsUpload');
    const input = document.createElement('input');
    input.type = 'file';
    input.multiple = true;
    input.accept = '.json';
    input.style.display = 'none';
    
    area.appendChild(input);
    
    area.addEventListener('click', function() {
        input.click();
    });
    
    input.addEventListener('change', function(e) {
        const files = Array.from(e.target.files);
        if (files.length === 0) return;
        
        connectionsFiles = [];
        const filesContainer = document.getElementById('selectedFiles');
        filesContainer.innerHTML = '';
        
        // Procesar cada archivo
        let processedFiles = 0;
        files.forEach(file => {
            const reader = new FileReader();
            reader.onload = function(e) {
                try {
                    const data = JSON.parse(e.target.result);
                    connectionsFiles.push({
                        name: file.name,
                        data: data,
                        file: file
                    });
                    
                    // Mostrar archivo en la lista
                    const fileItem = document.createElement('div');
                    fileItem.className = 'file-item';
                    fileItem.innerHTML = `
                        <span class="file-name">${file.name}</span>
                        <span class="file-status success">✓ Cargado</span>
                    `;
                    filesContainer.appendChild(fileItem);
                    
                    processedFiles++;
                    if (processedFiles === files.length) {
                        checkFilesReady();
                    }
                } catch (error) {
                    // Mostrar error para este archivo
                    const fileItem = document.createElement('div');
                    fileItem.className = 'file-item';
                    fileItem.innerHTML = `
                        <span class="file-name">${file.name}</span>
                        <span class="file-status error">Error: Archivo JSON inválido</span>
                    `;
                    filesContainer.appendChild(fileItem);
                    console.error('Error al leer el archivo:', error);
                }
            };
            reader.readAsText(file);
        });
        
        area.style.borderColor = '#28a745';
        area.style.backgroundColor = 'rgba(40, 167, 69, 0.05)';
        area.innerHTML = `
            <div style="color: #28a745; font-size: 2rem;">✓</div>
            <p>${files.length} archivo(s) seleccionado(s)</p>
        `;
    });
}

// Verificar si hay archivos listos
function checkFilesReady() {
    const analyzeBtn = document.getElementById('analyzeBtn');
    if (connectionsFiles.length > 0) {
        analyzeBtn.disabled = false;
    }
}

// Navegación entre pasos
function nextStep(step) {
    if (step === 2) {
        username = document.getElementById('username').value.trim();
        if (!username) {
            alert('Por favor, ingresa tu nombre de usuario de Instagram');
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
        
        // Procesar datos
        setTimeout(function() {
            analyzeData();
            
            // Ocultar carga y mostrar resultados
            document.getElementById('loadingIndicator').style.display = 'none';
            document.getElementById('resultsSection').style.display = 'block';
        }, 2000);
    }
    
    updateProgressBar();
}

function prevStep(step) {
    document.querySelector(`#step${currentStep}Content`).classList.remove('active');
    document.querySelector(`#step${currentStep}`).classList.remove('active');
    
    currentStep = step;
    
    document.querySelector(`#step${currentStep}Content`).classList.add('active');
    document.querySelector(`#step${currentStep}`).classList.add('active');
    
    updateProgressBar();
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

// Función para extraer usuarios de archivos JSON de Instagram
function extractUsers(data) {
    const users = [];
    
    // Buscar recursivamente valores de usuario en la estructura JSON
    function searchForUsers(obj) {
        if (typeof obj !== 'object' || obj === null) return;
        
        // Si encontramos un campo que parece contener un nombre de usuario
        if (obj.value && typeof obj.value === 'string' && obj.value.length > 0) {
            users.push(obj.value);
        }
        
        if (obj.title && typeof obj.title === 'string' && obj.title.length > 0) {
            users.push(obj.title);
        }
        
        // Buscar en arrays y objetos anidados
        if (Array.isArray(obj)) {
            obj.forEach(item => searchForUsers(item));
        } else {
            Object.values(obj).forEach(value => searchForUsers(value));
        }
    }
    
    searchForUsers(data);
    return [...new Set(users)]; // Eliminar duplicados
}

// Analizar datos de Instagram
function analyzeData() {
    followers = [];
    following = [];
    
    // Procesar archivos
    connectionsFiles.forEach(file => {
        const fileName = file.name.toLowerCase();
        const users = extractUsers(file.data);
        
        if (fileName.includes('follower')) {
            followers = [...followers, ...users];
        } else if (fileName.includes('following')) {
            following = [...following, ...users];
        }
    });
    
    // Eliminar duplicados
    followers = [...new Set(followers)];
    following = [...new Set(following)];
    
    // Encontrar no seguidores (personas que sigues pero que no te siguen)
    const followersSet = new Set(followers);
    nonFollowers = following.filter(user => !followersSet.has(user));
    
    // Analizar visitantes del perfil
    analyzeProfileVisitors();
    
    // Actualizar UI
    document.getElementById('resultUsername').textContent = username;
    document.getElementById('followingCount').textContent = following.length;
    document.getElementById('followersCount').textContent = followers.length;
    document.getElementById('nonFollowersCount').textContent = nonFollowers.length;
    
    // Mostrar no seguidores
    const nonFollowersList = document.getElementById('nonFollowersList');
    nonFollowersList.innerHTML = '';
    
    if (nonFollowers.length > 0) {
        nonFollowers.forEach(user => {
            const div = document.createElement('div');
            div.className = 'non-follower-item';
            div.innerHTML = `
                <div class="user-avatar">${user.charAt(0).toUpperCase()}</div>
                <div>${user}</div>
            `;
            nonFollowersList.appendChild(div);
        });
    } else {
        nonFollowersList.innerHTML = '<p class="no-results">¡Genial! Todos tus seguidores te siguen de vuelta.</p>';
    }
}

// Analizar visitantes del perfil
function analyzeProfileVisitors() {
    // Este es un algoritmo de ejemplo que simula el análisis de visitantes
    // En una implementación real, se analizarían archivos como likes.json, comments.json, etc.
    
    // 1. Combinar todos los usuarios de los que tenemos datos
    const allUsers = [...new Set([...followers, ...following, ...nonFollowers])];
    
    // 2. Simular datos de interacción (en una app real, esto vendría de los archivos JSON)
    const interactions = simulateInteractions(allUsers);
    
    // 3. Calcular puntuación de posible visita al perfil
    profileVisitors = calculateVisitorScore(interactions);
    
    // 4. Mostrar resultados
    displayVisitorResults();
}

// Simular interacciones (en una app real, esto se obtendría de los archivos JSON)
function simulateInteractions(users) {
    const interactions = [];
    
    users.forEach(user => {
        // Simular diferentes tipos de interacciones con pesos diferentes
        const likes = Math.floor(Math.random() * 20); // 0-20 likes
        const comments = Math.floor(Math.random() * 10); // 0-10 comentarios
        const messages = Math.floor(Math.random() * 5); // 0-5 mensajes
        const shares = Math.floor(Math.random() * 3); // 0-3 shares
        const storyViews = Math.floor(Math.random() * 15); // 0-15 visualizaciones de stories
        
        // Fecha de última interacción (más reciente para algunos usuarios)
        const lastInteractionDays = Math.floor(Math.random() * 30);
        const lastInteraction = new Date();
        lastInteraction.setDate(lastInteraction.getDate() - lastInteractionDays);
        
        interactions.push({
            username: user,
            likes,
            comments,
            messages,
            shares,
            storyViews,
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
        score += interaction.shares * 8; // Cada share suma 8 puntos
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
                shares: interaction.shares,
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
                <div class="user-avatar">${visitor.username.charAt(0).toUpperCase()}</div>
                <div>
                    <strong>${visitor.username}</strong>
                    <div class="user-detail">
                        Likes: ${visitor.interactions.likes} | 
                        Comentarios: ${visitor.interactions.comments} | 
                        Última interacción: ${visitor.lastInteraction}
                    </div>
                </div>
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
    const ctx = document.getElementById('interactionsChart').getContext('2d');
    
    // Preparar datos para el gráfico
    const topVisitors = profileVisitors.slice(0, 5);
    const labels = topVisitors.map(v => v.username);
    const scores = topVisitors.map(v => v.score);
    
    new Chart(ctx, {
        type: 'bar',
        data: {
            labels: labels,
            datasets: [{
                label: 'Puntuación de visita',
                data: scores,
                backgroundColor: '#E1306C',
                borderRadius: 5
            }]
        },
        options: {
            responsive: true,
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
        alert(`No hay ${type === 'no_seguidores' ? 'no seguidores' : 'solicitudes pendientes'} para exportar.`);
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
}

// Mostrar sección de análisis
function showAnalysisSection() {
    document.getElementById('analysis').scrollIntoView({ behavior: 'smooth' });
}