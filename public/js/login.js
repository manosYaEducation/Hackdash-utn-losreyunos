const loginF = document.querySelector("form");

// Configuración bloqueo login por intentos fallidos
const loginBtn = document.querySelector(".login-button");
let intentosFallidos = parseInt(localStorage.getItem("intentosFallidos")) || 0;
const maxIntentos = 5;
const bloqueoTiempo = 120; //Segundos

// Verificación de bloqueo activo
window.addEventListener("load", verificarBloqueo);

function verificarBloqueo() {
  const bloqueoHasta = parseInt(localStorage.getItem("bloqueoLoginHasta"));
  const ahora = Date.now();
  if (bloqueoHasta && bloqueoHasta > ahora) {
    if(loginBtn) loginBtn.disabled = true;
    actualizarMensajeBloqueo();
  } else {
    localStorage.removeItem("bloqueoLoginHasta");
    if(loginBtn) loginBtn.disabled = false;
    intentosFallidos = 0;
    localStorage.setItem("intentosFallidos", "0");
  }
}

// Timer bloqueo
function actualizarMensajeBloqueo() {
  const bloqueoHasta = parseInt(localStorage.getItem("bloqueoLoginHasta"));
  const ahora = Date.now();
  if (bloqueoHasta > ahora) {
    const segundosRestantes = Math.ceil((bloqueoHasta - ahora) / 1000);
    if(loginBtn) loginBtn.textContent = `Bloqueado (${segundosRestantes}s)`;
    setTimeout(actualizarMensajeBloqueo, 1000);
  } else {
    if(loginBtn) {
        loginBtn.disabled = false;
        loginBtn.textContent = "Iniciar sesión";
    }
    localStorage.removeItem("bloqueoLoginHasta");
    localStorage.setItem("intentosFallidos", "0");
    intentosFallidos = 0;
  }
}

function showNotification(message, type = 'success') {
    // Verificar si ya existe una notificación y eliminarla
    const existing = document.querySelector('.notification');
    if(existing) existing.remove();

    const notification = document.createElement('div');
    notification.className = `notification ${type}`;
    notification.textContent = message;
    document.body.appendChild(notification);
    
    // Auto-dismiss after 4 seconds
    setTimeout(() => {
        if (notification.parentNode) {
            notification.style.animation = 'slideOutNotification 0.3s ease';
            setTimeout(() => {
                if (notification.parentNode) {
                    notification.parentNode.removeChild(notification);
                }
            }, 300);
        }
    }, 4000);
}

// Ver/Ocultar contraseña
const togglePassword = document.querySelector("#togglePassword");
const passwordInput = document.querySelector("#password");

if(togglePassword && passwordInput) {
    togglePassword.addEventListener("click", () => {
      const esPassword = passwordInput.getAttribute("type") === "password";
      passwordInput.setAttribute("type", esPassword ? "text" : "password");
    
      togglePassword.classList.toggle("bi-eye");
      togglePassword.classList.toggle("bi-eye-slash");
    });
}

if (loginF) {
    loginF.addEventListener("submit", async (event) => {
      event.preventDefault();
      const username = document.querySelector("#username").value;
      const password = document.querySelector("#password").value;
      const mantenerSesion = document.querySelector("#mantenerSesion") ? document.querySelector("#mantenerSesion").checked : false;
    
      if (!username || !password) {
        showNotification("Por favor ingresa ambos campos: usuario y contraseña.", 'error');
        return;
      }
    
     try {
    // CAMBIO IMPORTANTE: Usar la constante API_BASE + la ruta del controlador
    // La ruta exacta depende de cómo esté definido en backend/app/Routes/api.php
    // Usualmente es 'login' o 'auth/login'
    const response = await fetch(CONFIG.API_BASE + 'login', { 
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          email: username,     // Ojo: verifica si el backend espera "email" o "username"
          password: password,
        }),
    });v
    
        const result = await response.json();
        console.log("Respuesta del servidor:", result);
    
        if (result.success === true) {
          // Reset de intentos fallidos
          intentosFallidos = 0;
          localStorage.setItem("intentosFallidos", "0");
          localStorage.removeItem("bloqueoLoginHasta");
          
          // Almacenar información del login
          const storage = mantenerSesion ? localStorage : sessionStorage;
          
          storage.setItem("userLoggedIn", "true");
          storage.setItem("username", username);
          
          // Guardar en ambos para consistencia de session-check.js
          if(!mantenerSesion) {
             localStorage.setItem("userLoggedIn", "true"); // Respaldo mínimo
          }

          if (result.token) storage.setItem("token", result.token);
          if (result.user) {
              storage.setItem("userId", result.user.id);
              storage.setItem("userEmail", result.user.email);
              storage.setItem("userName", result.user.nombre || username);
          }
    
          showNotification("¡Inicio de sesión exitoso!", 'success');
          setTimeout(() => {
            window.location.href = "project-list"; // Redirigir a lista de proyectos
          }, 1500);
          
        } else {
          showNotification(result.error || "Usuario o contraseña incorrectos.", 'error');
    
          // Lógica de intentos fallidos
          intentosFallidos++;
          localStorage.setItem("intentosFallidos", intentosFallidos);
          if (intentosFallidos >= maxIntentos) {
            const bloqueoHasta = Date.now() + bloqueoTiempo * 1000;
            localStorage.setItem("bloqueoLoginHasta", bloqueoHasta);
            if(loginBtn) loginBtn.disabled = true;
            actualizarMensajeBloqueo();
          }
        }
      } catch (error) {
        console.error("Error completo:", error);
        showNotification("Error de conexión con el servidor local.", 'error');
      }
    });
}