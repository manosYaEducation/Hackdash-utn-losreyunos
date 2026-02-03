// Session management and authentication check
(function() {
    'use strict';

    function isUserLoggedIn() {
        const userLoggedIn = localStorage.getItem('userLoggedIn') === 'true' || 
                            sessionStorage.getItem('userLoggedIn') === 'true';
        const username = localStorage.getItem('username') || sessionStorage.getItem('username');
        const userEmail = localStorage.getItem('userEmail') || sessionStorage.getItem('userEmail');
        
        return userLoggedIn && (username || userEmail);
    }

    function redirectToLogin() {
        localStorage.removeItem('userLoggedIn');
        sessionStorage.removeItem('userLoggedIn');
        localStorage.removeItem('username');
        sessionStorage.removeItem('username');
        localStorage.removeItem('userEmail');
        sessionStorage.removeItem('userEmail');
        localStorage.removeItem('userName');
        sessionStorage.removeItem('userName');
        localStorage.removeItem('userId');
        sessionStorage.removeItem('userId');
        localStorage.removeItem('token');
        sessionStorage.removeItem('token');
        localStorage.removeItem('roles');
        sessionStorage.removeItem('roles');
        localStorage.removeItem('userProjectMemberships'); // Clear memberships on logout
        
        window.location.href = 'login';
    }

    function checkSession() {
        const currentPath = window.location.pathname;
        const skipPages = ['/login', '/register', '/recover-password', '/index', '/', '/project-list', '/project-detail'];
        
        if (skipPages.some(page => currentPath.includes(page))) {
            return;
        }

        if (!isUserLoggedIn()) {
            console.log('User not logged in, redirecting to login');
            redirectToLogin();
        }
    }

    document.addEventListener('DOMContentLoaded', function() {
        checkSession();
    });

    document.addEventListener('visibilitychange', function() {
        if (!document.hidden) {
            checkSession();
        }
    });

    window.isAuthenticated = function() {
        return isUserLoggedIn();
    };

    window.getUserData = function() {
        return {
            username: localStorage.getItem('username') || sessionStorage.getItem('username'),
            userEmail: localStorage.getItem('userEmail') || sessionStorage.getItem('userEmail'),
            userName: localStorage.getItem('userName') || sessionStorage.getItem('userName'),
            userId: localStorage.getItem('userId') || sessionStorage.getItem('userId'),
            token: localStorage.getItem('token') || sessionStorage.getItem('token')
        };
    };

    window.isProjectMember = function(projectId) {
        const userData = window.getUserData();
        const userEmail = userData.userEmail;
        if (!userEmail) return false;
        
        const memberships = JSON.parse(localStorage.getItem('userProjectMemberships') || '[]');
        return memberships.some(m => String(m.projectId) === String(projectId) && m.userEmail === userEmail);
    };

    window.updateProjectMembership = function(projectId, isMember) {
        const userData = window.getUserData();
        const userEmail = userData.userEmail;
        const userName = userData.userName || userData.username;
        
        if (!userEmail) return;
        
        let memberships = JSON.parse(localStorage.getItem('userProjectMemberships') || '[]');
        
        if (isMember) {
            const existingIndex = memberships.findIndex(m => m.projectId === projectId && m.userEmail === userEmail);
            if (existingIndex === -1) {
                memberships.push({
                    projectId: projectId,
                    userEmail: userEmail,
                    userName: userName,
                    role: 'member',
                    joinedAt: new Date().toISOString()
                });
            }
        } else {
            memberships = memberships.filter(m => !(m.projectId === projectId && m.userEmail === userEmail));
        }
        
        localStorage.setItem('userProjectMemberships', JSON.stringify(memberships));
    };


    window.logout = function() {
        localStorage.clear();
        sessionStorage.clear();
        window.location.href = 'login';
    };

    // Función global para el modal de login
    window.showLoginModal = function() {
        // Remove any existing modal to prevent duplicates
        const existingModal = document.querySelector('.modal-overlay');
        if (existingModal) {
            document.body.removeChild(existingModal);
        }

        const modalOverlay = document.createElement('div');
        modalOverlay.className = 'modal-overlay';

        const modalContent = document.createElement('div');
        modalContent.className = 'modal-content';

        modalContent.innerHTML = `
            <div style="margin-bottom: 1.5rem;">
                <h3 class="modal-title">Inicia Sesión</h3>
                <p class="modal-message">
                    Para unirte a este proyecto necesitas iniciar sesión en tu cuenta.
                </p>
            </div>
            <div class="modal-buttons">
                <button id="modalCancelBtn" class="modal-cancel-btn">Cancelar</button>
                <button id="modalLoginBtn" class="modal-login-btn">Ir al Login</button>
            </div>
        `;

        
        modalOverlay.appendChild(modalContent);
        document.body.appendChild(modalOverlay);

        // Event listeners
        const cancelBtn = document.getElementById('modalCancelBtn');
        const loginBtn = document.getElementById('modalLoginBtn');

        if (cancelBtn) {
            cancelBtn.addEventListener('click', () => {
                document.body.removeChild(modalOverlay);
            });
        }

        if (loginBtn) {
            loginBtn.addEventListener('click', () => {
                window.location.href = 'login';
            });
        }

        modalOverlay.addEventListener('click', (e) => {
            if (e.target === modalOverlay) {
                document.body.removeChild(modalOverlay);
            }
        });

        document.addEventListener('keydown', function handleEscape(e) {
            if (e.key === 'Escape') {s
                document.body.removeChild(modalOverlay);
                document.removeEventListener('keydown', handleEscape);
            }
        });
    };

})();
