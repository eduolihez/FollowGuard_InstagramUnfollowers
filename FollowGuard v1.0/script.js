// Variables globales
let currentStep = 1;
let username = '';
let connectionsFiles = [];
let followers = [];
let following = [];
let nonFollowers = [];

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
        }, 1000);
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

function restartProcess() {
    // Reiniciar variables
    username = '';
    connectionsFiles = [];
    followers = [];
    following = [];
    nonFollowers = [];
    
    // Reiniciar UI
    document.getElementById('username').value = '';
    
    const area = document.getElementById('connectionsUpload');
    area.innerHTML = `
        <div class="upload-icon">📁</div>
        <p>Haz clic para seleccionar <strong>todos los archivos JSON</strong> de la carpeta connections</p>
        <small>Incluye: followers_1.json, following.json</small>
    `;
    area.style = '';
    
    document.getElementById('selectedFiles').innerHTML = '';
    document.getElementById('analyzeBtn').disabled = true;
    
    // Volver al primer paso
    document.querySelector(`#step${currentStep}Content`).classList.remove('active');
    document.querySelector(`#step${currentStep}`).classList.remove('active');
    
    currentStep = 1;
    
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

// Función optimizada para extraer usuarios de archivos JSON de Instagram
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

// Análisis de datos optimizado
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
    // Usamos un Set para búsquedas más eficientes
    const followersSet = new Set(followers);
    nonFollowers = following.filter(user => !followersSet.has(user));
    
    // Actualizar UI
    document.getElementById('resultUsername').textContent = username;
    document.getElementById('followingCount').textContent = following.length;
    document.getElementById('followersCount').textContent = followers.length;
    document.getElementById('nonFollowersCount').textContent = nonFollowers.length;
    
    // Limpiar lista anterior
    const nonFollowersList = document.getElementById('nonFollowersList');
    nonFollowersList.innerHTML = '';
    
    // Añadir no seguidores a la lista
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

// Inicialización
document.addEventListener('DOMContentLoaded', function() {
    setupUploadArea();
    document.getElementById('exportBtn').addEventListener('click', function() {
        exportToCSV(nonFollowers, 'no_seguidores');
    });
    
    updateProgressBar();
});