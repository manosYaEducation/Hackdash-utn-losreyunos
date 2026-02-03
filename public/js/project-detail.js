const API_BASE = CONFIG.API_BASE;

// SOLUCIÓN FRONTEND: Función global para verificar si un usuario es creador de un proyecto
window.isProjectCreator = function(projectId, userEmail) {
    const creators = JSON.parse(localStorage.getItem('projectCreators') || '[]');
    return creators.some(c => c.projectId == projectId && c.email === userEmail);
};

// SOLUCIÓN FRONTEND: Función global para obtener el rol funcional de un usuario
window.getUserFunctionalRole = function(projectId, userEmail, backendRole) {
    if (window.isProjectCreator(projectId, userEmail)) {
        return 'owner';
    }
    return backendRole || 'member';
};

document.addEventListener('DOMContentLoaded', () => {
    const projectDetailContent = document.getElementById('projectDetailContent');
    const urlParams = new URLSearchParams(window.location.search);
    const projectId = urlParams.get('id');
    let project = null; // Variable para almacenar los datos del proyecto

    if (projectId) {
        fetchProjectDetails(projectId);
    } else {
        projectDetailContent.innerHTML = '<p>No se especificó ningún ID de proyecto.</p>';
    }

    async function fetchProjectDetails(id) {
        try {
            const response = await fetch(`${API_BASE}project/get?id=${id}`);
            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }
            const data = await response.json();

            if (data.success) {
                if (data.project) {
                    project = data.project; // Almacenar los datos del proyecto
                    renderProjectDetails(data.project);
                } else {
                    projectDetailContent.innerHTML = '<p>No se encontraron detalles del proyecto.</p>';
                }
            } else {
                projectDetailContent.innerHTML = '<p>Error al cargar detalles del proyecto: ' + data.message + '</p>';
            }
        } catch (error) {
            console.error('Error fetching project detail:', error);
            projectDetailContent.innerHTML = '<p>No se pudieron cargar los detalles del proyecto. Inténtalo de nuevo más tarde.</p>';
        }
    }

    // Función para truncar el título solo en móviles
    function truncateTitleForMobile(title, maxLength = 154) {
        const isMobile = window.innerWidth < 768;
        if (isMobile && title && title.length > maxLength) {
            return title.substring(0, maxLength) + '...';
        }
        return title;
    }

    function renderProjectDetails(project) {
        if (!project) {
            console.error("Project data is undefined or null.");
            return;
        }

        const truncatedTitle = truncateTitleForMobile(project.title);
        document.querySelector('.project-detail-title').textContent = truncatedTitle;

        // Construir bloque de Pitch si existe
        const pitchEmbed = (() => {
            const pitch = (project.pitch || '').trim();
            if (!pitch) return '';
            // Detectar YouTube y embeber
            const ytMatch = pitch.match(/(?:youtu\.be\/|youtube\.com\/(?:watch\?v=|embed\/))([\w-]{11})/);
            if (ytMatch && ytMatch[1]) {
                const videoId = ytMatch[1];
                return `
                <div class="project-section">
                    <div class="section-title">Pitch</div>
                    <div class="section-content" style="margin-top:6px; display:flex; justify-content:center;">
                        <iframe width="560" height="315" src="https://www.youtube.com/embed/${videoId}" title="Pitch" frameborder="0" allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share" allowfullscreen></iframe>
                    </div>
                </div>`;
            }
            // Si es URL genérica, mostrar enlace
            const isUrl = /^(https?:)\/\//i.test(pitch);
            const safeText = escapeHtml(pitch);
            const linkHtml = isUrl ? `<a href="${safeText}" target="_blank" rel="noopener noreferrer" style="color:#ffffff; font-size: 16px; font-weight: 500;">${safeText}</a>` : safeText;
            return `
            <div class="project-section">
                <div class="section-title">Pitch</div>
                <div class="section-content" style="margin-top:6px; text-align:left;">${linkHtml}</div>
            </div>`;
        })();

        // Función para formato a la descripción del proyecto
        const formatProjectDescription = (description) => {
            if (!description) return '';
            
            // Dividir la descripción en líneas
            const lines = description.split('\n').filter(line => line.trim());
            
            let formattedHTML = '';
            let currentSection = '';
            let bulletPoints = [];
            let isFirstLine = true;
            let hasProcessedInitialBullets = false;
            
            let i = 0;
            while (i < lines.length) {
                const line = lines[i].trim();
                
                // La primera línea siempre es el título
                if (isFirstLine) {
                    formattedHTML += `<div class="project-title-numbered">${line}</div>`;
                    isFirstLine = false;
                    i++;
                    continue;
                }
                
                // Si es una viñeta y no hemos procesado las viñetas iniciales aún
                if (/^[•\-]\s/.test(line) && !hasProcessedInitialBullets) {
                    bulletPoints.push(line.replace(/^[•\-]\s/, ''));
                    i++;
                    continue;
                }
                
                // Si ya no es una viñeta, procesar las viñetas iniciales acumuladas
                if (bulletPoints.length > 0 && !hasProcessedInitialBullets) {
                    formattedHTML += '<ul class="project-bullet-points">';
                    bulletPoints.forEach(point => {
                        formattedHTML += `<li>${point}</li>`;
                    });
                    formattedHTML += '</ul>';
                    bulletPoints = [];
                    hasProcessedInitialBullets = true;
                }
                
                // Detectar secciones (Descripción:, Valor diferencial:, etc.)
                if (line.endsWith(':')) {
                    currentSection = line;
                    formattedHTML += `<div class="project-section-title">${currentSection}</div>`;
                }
                // Si es una viñeta dentro de una sección o después de secciones
                else if (/^[•\-]\s/.test(line)) {
                    // Si no hay viñetas acumuladas, empezar una nueva lista
                    if (bulletPoints.length === 0) {
                        formattedHTML += '<ul class="project-bullet-points">';
                    }
                    bulletPoints.push(line.replace(/^[•\-]\s/, ''));
                }
                // Contenido de sección
                else if (currentSection && line) {
                    // Si hay viñetas pendientes, procesarlas antes del contenido
                    if (bulletPoints.length > 0) {
                        bulletPoints.forEach(point => {
                            formattedHTML += `<li>${point}</li>`;
                        });
                        formattedHTML += '</ul>';
                        bulletPoints = [];
                    }
                    formattedHTML += `<div class="project-section-content">${line}</div>`;
                }
                // Texto general
                else if (line) {
                    // Si hay viñetas pendientes, procesarlas antes del texto general
                    if (bulletPoints.length > 0) {
                        bulletPoints.forEach(point => {
                            formattedHTML += `<li>${point}</li>`;
                        });
                        formattedHTML += '</ul>';
                        bulletPoints = [];
                    }
                    formattedHTML += `<div class="project-general-text">${line}</div>`;
                }
                
                i++;
            }
            
            // Si quedan viñetas sin procesar al final
            if (bulletPoints.length > 0) {
                bulletPoints.forEach(point => {
                    formattedHTML += `<li>${point}</li>`;
                });
                formattedHTML += '</ul>';
            }
            
            return formattedHTML;
        };

        projectDetailContent.innerHTML = `
            <!-- Sección de Miembros con Botones -->
            <div id="membersSection" class="members-section">
                <div class="members-header">
                    <h3>Integrantes:</h3>
                    <div id="membersList" class="members-list">
                        <p>Cargando miembros...</p>
                    </div>
                </div>
                <div class="project-action-buttons">
                    <div class="project-controls">
                        <button class="submit-button" id="joinButton">Unirse</button>
                        <button class="submit-button" id="leaveButton" style="display:none">Abandonar</button>
                        <button class="submit-button" id="editButton" style="display:none">Editar</button>
                        <button class="submit-button" id="deleteButton" style="display:none">Eliminar</button>
                    </div>
                    <div id="requestsContainer"></div>
                    <div id="joinStatus" class="join-status"></div>
                </div>
            </div>
            
            <!-- Project Details -->
            <div class="project-details">
                <div class="project-description-formatted">
                    ${formatProjectDescription(project.description)}
                </div>
                ${pitchEmbed}
            </div>
        `;

        // Unirse o abandonar un proyecto
        const joinButton = document.getElementById('joinButton');
        const leaveButton = document.getElementById('leaveButton');
        const viewRequestsButton = document.getElementById('viewRequestsButton');
        const editButton = document.getElementById('editButton');
        const deleteButton = document.getElementById('deleteButton');
        const joinStatus = document.getElementById('joinStatus');

        // Ocultar controles avanzados por defecto (se muestran solo si es owner)
        if (viewRequestsButton) viewRequestsButton.style.display = 'none';
        if (editButton) editButton.style.display = 'none';
        if (deleteButton) deleteButton.style.display = 'none';

        async function checkMembershipAndSetState() {
            const userEmail = localStorage.getItem('userEmail');
            if (!userEmail || !joinButton) return;
            try {
                const resp = await fetch(`${API_BASE}project/members?id=${project.id}`);
                if (!resp.ok) return;
                const data = await resp.json();
                if (data.success && Array.isArray(data.members)) {
                    const already = data.members.some(m => m.email === userEmail);
                    if (already) {
                        joinButton.style.display = 'none';
                        leaveButton.style.display = 'inline-block';
                    } else {
                        joinButton.style.display = 'inline-block';
                        leaveButton.style.display = 'none';
                    }
                    
                    // SOLUCIÓN FRONTEND: Verificar rol funcional del usuario
                    const me = data.members.find(m => m.email === userEmail);
                    const backendRole = (me && me.role) ? String(me.role).toLowerCase() : '';
                    const functionalRole = window.getUserFunctionalRole(project.id, userEmail, backendRole);
                    const isOwner = functionalRole === 'owner';
                    
                    console.log('🔍 Verificación de roles:', {
                        email: userEmail,
                        backendRole: backendRole,
                        functionalRole: functionalRole,
                        isOwner: isOwner,
                        projectId: project.id
                    });
                    
                    if (viewRequestsButton) viewRequestsButton.style.display = isOwner ? 'inline-block' : 'none';
                    if (editButton) editButton.style.display = isOwner ? 'inline-block' : 'none';
                    if (deleteButton) deleteButton.style.display = isOwner ? 'inline-block' : 'none';
                }
            } catch (_) {}
        }

        checkMembershipAndSetState();
        
        // Cargar miembros del proyecto
        loadProjectMembers(project.id);
        setupProjectButton(joinButton, 'join', leaveButton, 'project/sendJoinRequest');
        setupProjectButton(leaveButton, 'leave', joinButton, 'member/delete'); // Add this line

        // Ver Solicitudes (solo si es owner; el botón está oculto por defecto)
        if (viewRequestsButton) {
            viewRequestsButton.addEventListener('click', () => getJoinRequests());
        }

        // Eliminar proyecto (visible para todos los usuarios, el backend validará permisos)
        if (deleteButton) {
            deleteButton.addEventListener('click', () => {
                // Mostrar modal de confirmación
                const deleteModal = document.getElementById('deleteModal');
                if (deleteModal) {
                    deleteModal.style.display = 'flex';
                }
            });
        }

        // Editar proyecto
        if (editButton) {
            editButton.addEventListener('click', () => {
                window.location.href = `project-edit?id=${project.id}`;
            });
        }

        // Configurar botones del modal de eliminación
        const deleteModal = document.getElementById('deleteModal');
        const deleteCancelBtn = document.getElementById('deleteCancelBtn');
        const deleteConfirmBtn = document.getElementById('deleteConfirmBtn');

        if (deleteCancelBtn) {
            deleteCancelBtn.addEventListener('click', () => {
                if (deleteModal) {
                    deleteModal.style.display = 'none';
                }
            });
        }

        if (deleteConfirmBtn) {
            deleteConfirmBtn.addEventListener('click', async () => {
                try {
                    const fd = new FormData();
                    fd.append('project_id', project.id);
                    fd.append('id', project.id); // compatibilidad
                    const res = await fetch(`${API_BASE}project/delete`, { method: 'POST', body: fd });
                    const data = await res.json();
                    if (res.ok && data && data.success) {
                        showNotification('Proyecto eliminado exitosamente.', 'success');
                        // Redirigir después de un breve delay para que se vea la notificación
                        setTimeout(() => {
                            window.location.href = 'project-list';
                        }, 1500);
                    } else {
                        showNotification(data.message || 'No se pudo eliminar el proyecto.', 'error');
                    }
                } catch (err) {
                    console.error('Error al eliminar proyecto:', err);
                    showNotification('Error de conexión al eliminar el proyecto.', 'error');
                } finally {
                    // Cerrar modal
                    if (deleteModal) {
                        deleteModal.style.display = 'none';
                    }
                }
            });
        }

        // Cerrar modal al hacer clic fuera de él
        if (deleteModal) {
            deleteModal.addEventListener('click', (e) => {
                if (e.target === deleteModal) {
                    deleteModal.style.display = 'none';
                }
            });
        }

        // Cerrar modal con tecla Escape
        document.addEventListener('keydown', (e) => {
            if (e.key === 'Escape' && deleteModal && deleteModal.style.display === 'flex') {
                deleteModal.style.display = 'none';
            }
        });

        // Utility function for fetch with timeout
        async function fetchWithTimeout(url, options, timeout = 10000) {
            const controller = new AbortController();
            const timeoutId = setTimeout(() => controller.abort(), timeout);

            try {
                const response = await fetch(url, { ...options, signal: controller.signal });
                return response;
            } finally {
                clearTimeout(timeoutId);
            }
        }

                // Utility function to handle button states
        function updateButtonStates(activeButton, inactiveButton, activeText, isDisabled) {
            activeButton.disabled = isDisabled;
            activeButton.textContent = activeText;
            activeButton.style.display = 'inline-block';
            inactiveButton.style.display = 'none';
        }


        // Utility function to get user credentials
        function getUserCredentials() {
            return {
                userName: localStorage.getItem('userName') || '',
                userEmail: localStorage.getItem('userEmail') || '',
                userId: localStorage.getItem('userId') || '',
            };
        }
        
function setupProjectButton(button, action, otherButton, apiEndpoint) {
    if (!button) return;

    button.addEventListener('click', async () => {

        // Verificar autenticación
        if (!window.isAuthenticated || !window.isAuthenticated()) {
            console.log('Usuario no autenticado, mostrando modal');
            if (typeof window.showLoginModal === 'function') {
                window.showLoginModal();
            } else {
                console.error('ERROR: window.showLoginModal no está disponible');
                document.getElementById('joinStatus').textContent = 'Error: No se puede mostrar el modal de inicio de sesión.';
            }
            return;
        }

        const { userName, userEmail, userId } = getUserCredentials();
        const joinStatus = document.getElementById('joinStatus');

        // Validar credenciales del usuario
        if (!userEmail || !userName) {
            joinStatus.textContent = 'Por favor, inicia sesión para unirte a un proyecto.';
            joinStatus.style.color = '#white';
            return;
        }

        // Deshabilitar botón y mostrar estado de carga
        updateButtonStates(button, otherButton, action === 'join' ? 'Uniéndose...' : 'Abandonando...', true);
        joinStatus.textContent = '';
        joinStatus.style.color = ''; // Resetear color

        // Preparar datos para la solicitud
        const formData = new FormData();
        if (action === 'join') {
            formData.append('project_id', project.id);
            formData.append('name', userName);
            formData.append('email', userEmail);
            formData.append('role', 'member');
        } else {
            formData.append('project_id', project.id);
            formData.append('email', userEmail);
        }

        try {
            const res = await fetchWithTimeout(`${API_BASE}${apiEndpoint}`, {
                method: 'POST',
                body: formData
            });

            const data = await res.json();

            if (!res.ok) {
                // Manejar errores HTTP
                throw new Error(data.message || `Error HTTP: ${res.status}`);
            }

            if (!data.success) {
                // Manejar errores específicos del backend
                throw new Error(data.message || 'Error desconocido al procesar la solicitud.');
            }

            // Actualizar estado y botones
            joinStatus.textContent = action === 'join'
                ? 'Te uniste al proyecto exitosamente.'
                : 'Has abandonado el proyecto exitosamente.';
            joinStatus.style.color = '#white'; // Verde para éxito
            updateButtonStates(otherButton, button, action === 'join' ? 'Abandonar' : 'Unirse', false);

            // Recargar lista de miembros
            loadProjectMembers(project.id);
        } catch (err) {
            console.error(`Error al ${action === 'join' ? 'unirse' : 'abandonar'} el proyecto:`, err);

            // Mostrar mensaje de error específico
            let errorMessage = 'Error al procesar la solicitud. Inténtalo de nuevo.';
            if (err.name === 'AbortError') {
                errorMessage = 'Tiempo de espera agotado. Verifica tu conexión.';
            } else if (err.message) {
                errorMessage = err.message;
            }

            joinStatus.textContent = errorMessage;
            joinStatus.style.color = '#white';
        } finally {
            // Restaurar estado del botón si sigue visible
            if (button.style.display !== 'none') {
                updateButtonStates(button, otherButton, action === 'join' ? 'Unirse' : 'Abandonar', false);
            }
        }
    });
}
// Inicializar botones
setupProjectButton(joinButton, 'join', leaveButton, 'project/createProjectMember');
        }
        
        // Función para cargar miembros del proyecto
        async function loadProjectMembers(projectId) {
            const membersList = document.getElementById('membersList');
            if (!membersList) return;
            
            try {
                console.log('Cargando miembros del proyecto:', projectId);
                const response = await fetch(`${API_BASE}project/members?id=${projectId}`);
                
                if (!response.ok) {
                    if (response.status === 404) {
                        console.log('Endpoint de miembros no encontrado - posiblemente no implementado en el backend');
                        membersList.innerHTML = '<p style="color: #6b7280; font-style: italic; text-align: center;">La funcionalidad de miembros no está disponible en este momento.</p>';
                        return;
                    }
                    throw new Error(`HTTP error! status: ${response.status}`);
                }
                
                const data = await response.json();
                console.log('Respuesta de la API de miembros:', data);
                
                if (data.success && Array.isArray(data.members)) {
                    displayProjectMembers(data.members);
                } else if (data.success && (!data.members || data.members.length === 0)) {
                    // Caso específico: API responde correctamente pero no hay miembros
                    membersList.innerHTML = '<p style="color: #6b7280; font-style: italic; text-align: center;">No hay miembros en este proyecto.</p>';
                } else {
                    console.warn('Respuesta inesperada de la API:', data);
                    membersList.innerHTML = '<p style="color: #6b7280; font-style: italic; text-align: center;">No se pudieron cargar los miembros del proyecto.</p>';
                }
            } catch (error) {
                console.error('Error cargando miembros:', error);
                
                // Distinguir entre diferentes tipos de errores
                if (error.name === 'TypeError' && error.message.includes('fetch')) {
                    membersList.innerHTML = '<p style="color: #white; text-align: center;">Error de conexión. Verifica tu conexión a internet.</p>';
                } else if (error.message.includes('404')) {
                    membersList.innerHTML = '<p style="color: #6b7280; font-style: italic; text-align: center;">La funcionalidad de miembros no está disponible.</p>';
                } else {
                    membersList.innerHTML = '<p style="color: #white; text-align: center; margin-bottom: 15px;">No hay miembros en el proyecto.</p>';
                }
            }
        }
        
        // Función para mostrar los miembros del proyecto
        function displayProjectMembers(members) {
            const membersList = document.getElementById('membersList');
            if (!membersList) return;
            
            if (members.length === 0) {
                membersList.innerHTML = '<p style="text-align: center;">No hay miembros en este proyecto.</p>';
                return;
            }
            
            // Crear vista de avatares
            const membersHTML = members.map(member => {
                const joinDate = member.joined_at ? new Date(member.joined_at).toLocaleDateString('es-ES', { 
                    dateStyle: 'medium' 
                }) : 'Fecha no disponible';
                const memberName = escapeHtml(member.name || member.user_name || 'Usuario');
                const memberEmail = escapeHtml(member.email || '');
                
                // SOLUCIÓN FRONTEND: Obtener rol funcional
                const backendRole = member.role || 'Miembro';
                const functionalRole = window.getUserFunctionalRole(project.id, member.email, backendRole);
                const memberRole = functionalRole === 'owner' ? 'Owner' : escapeHtml(backendRole);
                
                // Crear iniciales del nombre
                const initials = memberName.split(' ').map(name => name.charAt(0)).join('').toUpperCase().substring(0, 2);
                
                return `
                    <div class="member-avatar-container" onclick="showMemberInfo('${memberName}', '${memberEmail}', '${memberRole}', '${joinDate}')">
                        <div class="member-avatar-large">
                            <span class="member-initials">${initials}</span>
                        </div>
                        <div class="member-name-overlay">${memberName}</div>
                    </div>
                `;
            }).join('');
            
            membersList.innerHTML = `
                <div class="members-avatars-inline">
                    ${membersHTML}
                </div>
            `;
        }
        
        // Función para escapar HTML
        function escapeHtml(str) {
            return String(str)
                .replace(/&/g, '&amp;')
                .replace(/</g, '&lt;')
                .replace(/>/g, '&gt;')
                .replace(/"/g, '&quot;')
                .replace(/'/g, '&#039;');
        }

        // Función global para mostrar información del miembro
        window.showMemberInfo = function(name, email, role, joinedDate) {
            // Crear modal si no existe
            let modal = document.getElementById('memberInfoModal');
            if (!modal) {
                modal = document.createElement('div');
                modal.id = 'memberInfoModal';
                modal.className = 'modal-overlay';
                modal.innerHTML = `
                    <div class="modal-content member-info-modal">
                        <div class="modal-title">Información del Miembro</div>
                        <div class="modal-body">
                            <div class="member-details">
                                <div class="member-detail-item">
                                    <strong>Nombre:</strong> ${name}
                                </div>
                                <div class="member-detail-item">
                                    <strong>Email:</strong> ${email}
                                </div>
                                <div class="member-detail-item">
                                    <strong>Rol:</strong> ${role}
                                </div>
                                <div class="member-detail-item">
                                    <strong>Se unió:</strong> ${joinedDate}
                                </div>
                            </div>
                        </div>
                        <div class="modal-buttons">
                            <button class="modal-cancel-btn" onclick="closeMemberInfo()">Cerrar</button>
                        </div>
                    </div>
                `;
                document.body.appendChild(modal);
            }
            
            // Actualizar contenido del modal
            modal.querySelector('.member-details').innerHTML = `
                <div class="member-detail-item">
                    <strong>Nombre:</strong> ${name}
                </div>
                <div class="member-detail-item">
                    <strong>Email:</strong> ${email}
                </div>
                <div class="member-detail-item">
                    <strong>Rol:</strong> ${role}
                </div>
                <div class="member-detail-item">
                    <strong>Se unió:</strong> ${joinedDate}
                </div>
            `;
            
            // Mostrar modal
            modal.style.display = 'flex';
        };

        // Función global para cerrar el modal
        window.closeMemberInfo = function() {
            const modal = document.getElementById('memberInfoModal');
            if (modal) {
                modal.style.display = 'none';
            }
        };

        // Cerrar modal al hacer click fuera de él
        document.addEventListener('click', function(event) {
            const modal = document.getElementById('memberInfoModal');
            if (modal && event.target === modal) {
                modal.style.display = 'none';
            }
        });


        // Función para re-renderizar el título cuando cambie el tamaño de ventana
        function handleResize() {
            const titleElement = document.querySelector('.project-detail-title');
            if (titleElement && project) {
                const truncatedTitle = truncateTitleForMobile(project.title);
                titleElement.textContent = truncatedTitle;
            }
        }

        // Escuchar cambios de tamaño de ventana
        window.addEventListener('resize', handleResize);
});

async function getJoinRequests() {
    const urlParams = new URLSearchParams(window.location.search);
    const projectId = urlParams.get('id');
    if (!projectId) {
        showNotification('Por favor, ingresa un ID de proyecto.', 'error');
        return;
    }

    try {
        const res = await fetch(`${API_BASE}project/getJoinRequests?project_id=${projectId}`);
        const data = await res.json();

        const container = document.getElementById('requestsContainer');
        container.innerHTML = '<h4>Solicitudes:</h4>';

        if (data.success && Array.isArray(data.requests) && data.requests.length > 0) {
            data.requests.forEach(req => {
                const requestDiv = document.createElement('div');
                requestDiv.style = 'border:1px solid #ccc; padding:10px; margin:5px 0;';
                requestDiv.innerHTML = `
                    <strong>ID:</strong> ${req.id}<br/>
                    <strong>Nombre:</strong> ${req.user_name}<br/>
                    <strong>Email:</strong> ${req.email}<br/>
                    <button class="approve-btn" data-id="${req.id}">Aprobar</button>
                    <button class="reject-btn" data-id="${req.id}" style="background:#dc3545;color:white;">Rechazar</button>
                `;
                container.appendChild(requestDiv);
            });

            // Asignar eventos a los botones
            document.querySelectorAll('.approve-btn').forEach(btn => {
                btn.addEventListener('click', async () => {
                    const requestId = btn.getAttribute('data-id');
                    await handleRequestAction(requestId, 'approve');
                });
            });

            document.querySelectorAll('.reject-btn').forEach(btn => {
                btn.addEventListener('click', async () => {
                    const requestId = btn.getAttribute('data-id');
                    await handleRequestAction(requestId, 'reject');
                });
            });

        } else {
            container.innerHTML += '<p>No hay solicitudes pendientes.</p>';
        }
    } catch (err) {
        console.error(err);
        showNotification('Error al obtener las solicitudes.', 'error');
    }
}

async function handleRequestAction(requestId, action) {
    const endpoint = action === 'approve'
        ? 'project/approveJoinRequest'
        : 'project/rejectJoinRequest';

    const formData = new URLSearchParams();
    formData.append('request_id', requestId);

    try {
        const res = await fetch(`${API_BASE}${endpoint}`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/x-www-form-urlencoded'
            },
            body: formData.toString()
        });

        const data = await res.json();

        if (data.success) {
            showNotification(action === 'approve' ? 'Solicitud aprobada.' : 'Solicitud rechazada.');
            getJoinRequests(); // Recarga el listado
        } else {
            showNotification(data.message || 'Ocurrió un error.', 'error');
        }
    } catch (error) {
        console.error(error);
        showNotification('Error de conexión.', 'error');
    }
}

function showNotification(message, type = 'success') {
    const notification = document.createElement('div');
    notification.className = `notification ${type}`;
    notification.textContent = message;
    document.body.appendChild(notification);
}